/**
 * Service do cadastro de mercadorias por FOTO (fluxo multimodal via n8n + Gemini).
 *
 * Este é um caminho ALTERNATIVO de cadastro. Ele NÃO substitui o cadastro
 * manual (que continua usando mercadoriasService → /mercadorias com JWT).
 *
 * Diferente dos demais services, aqui NÃO falamos com a API do backend
 * diretamente: falamos com o webhook do n8n (EXPO_PUBLIC_N8N_WEBHOOK_URL),
 * que orquestra o Gemini e, no fim, insere na base via /mercadorias/bot.
 * Por isso a `geminiApiKey` e o `X-Bot-Token` ficam no servidor (n8n/backend)
 * e NUNCA no bundle do app — o front só precisa da URL do webhook.
 *
 * O fluxo é de CHAMADA ÚNICA (stateless):
 *   - O app envia, numa só requisição, a foto (`imagem_base64`) + o texto do
 *     feirante (`resposta`, com quantidade e preço).
 *   - O n8n faz UMA chamada multimodal ao Gemini 2.0 Flash: identifica o
 *     produto pela imagem e extrai quantidade/preço do texto, e então insere
 *     a mercadoria direto no banco (sem aprovação e sem campo "status").
 */

/** URL do webhook multimodal do n8n. Sem trailing slash. */
const N8N_WEBHOOK_URL: string = (
  (process.env.EXPO_PUBLIC_N8N_WEBHOOK_URL as string | undefined) || ""
).replace(/\/$/, "");

/** Timeout maior que o dos demais services: o Gemini pode demorar. */
const TIMEOUT_MS = 30000;

/** Erro do fluxo multimodal com contexto de status HTTP. */
export class MultimodalException extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "MultimodalException";
    this.status = status;
  }
}

/* ------------------------------------------------------------------ *
 * Contratos de resposta do webhook (discriminados por `status`).
 * ------------------------------------------------------------------ */

/** Mercadoria inserida com sucesso na base. */
export interface RespostaCadastrado {
  status: "cadastrado";
  /** Objeto da mercadoria criada, como devolvido pelo backend. */
  mercadoria: unknown;
}

/** A IA não reconheceu nenhum produto agrícola na foto. */
export interface RespostaNaoIdentificado {
  status: "nao_identificado";
  mensagem: string;
}

/** Produto reconhecido, mas o Gemini não extraiu quantidade/preço do texto. */
export interface RespostaFaltamDados {
  status: "faltam_dados";
  produto?: string;
  /** Mensagem pronta para exibir ao feirante (pedindo qtd/preço de novo). */
  mensagem: string;
}

/** Erro tratado pelo fluxo (ex.: feirante_id/imagem/resposta ausentes). */
export interface RespostaErro {
  status: "erro";
  mensagem: string;
}

/** Retorno único do fluxo multimodal de chamada única. */
export type RespostaCadastro =
  | RespostaCadastrado
  | RespostaNaoIdentificado
  | RespostaFaltamDados
  | RespostaErro;

/* ------------------------------------------------------------------ */

/** POST genérico ao webhook, com timeout e parse de erro. */
async function postWebhook<T>(body: unknown): Promise<T> {
  if (!N8N_WEBHOOK_URL) {
    throw new MultimodalException(
      0,
      "EXPO_PUBLIC_N8N_WEBHOOK_URL não configurada no .env do app."
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : undefined;

    if (!res.ok) {
      const msg =
        (data && (data.mensagem || data.erro || data.error)) ||
        "Falha ao falar com o cadastro por foto.";
      throw new MultimodalException(res.status, msg);
    }
    // 200 com corpo vazio: o fluxo do n8n não chegou a um nó de resposta
    // (ex.: o Gemini estourou a cota e a execução parou no meio). Sem isso,
    // o app receberia `undefined` e quebraria em `r.status`.
    if (data === undefined || data === null) {
      throw new MultimodalException(
        res.status,
        "O servidor não respondeu (workflow inativo ou cota do Gemini esgotada)."
      );
    }
    return data as T;
  } finally {
    clearTimeout(timer);
  }
}

export const cadastroMultimodalService = {
  /** Indica se a URL do webhook está configurada no .env. */
  get configurado(): boolean {
    return !!N8N_WEBHOOK_URL;
  },

  /**
   * Cadastro por foto em CHAMADA ÚNICA: envia a imagem + o texto do feirante
   * (quantidade e preço) numa só requisição. O n8n identifica o produto pela
   * imagem, extrai os números do texto e insere direto no banco.
   *
   * @param feiranteId   ID do feirante autenticado (rastreabilidade).
   * @param imagemBase64 Imagem em base64. Pode vir com ou sem o prefixo
   *                     `data:image/...;base64,` — o n8n remove o prefixo.
   * @param resposta     Texto livre do feirante com quantidade e preço
   *                     (ex.: "20 caixas a 5 reais").
   */
  async cadastrar(
    feiranteId: number,
    imagemBase64: string,
    resposta: string
  ): Promise<RespostaCadastro> {
    return postWebhook<RespostaCadastro>({
      feirante_id: feiranteId,
      imagem_base64: imagemBase64,
      resposta,
    });
  },
};
