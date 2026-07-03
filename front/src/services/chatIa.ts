/**
 * Service do chatbot do feirante (fluxo n8n "Feirô Chatbot") via webhook.
 *
 * Este é o MESMO chatbot que antes rodava no WhatsApp, agora sem a integração
 * UzAPI: o fluxo responde de forma síncrona ao app (respondToWebhook). O
 * webhook (EXPO_PUBLIC_N8N_CHAT_URL, path `chat-feiro`) espera o contrato
 * histórico do bot:
 *
 *   { sender, name, content }
 *
 * - `sender`  → identifica o feirante e a conversa. O fluxo busca o feirante
 *               por telefone (/feirantes/por-telefone/:sender) e mantém o
 *               estado da conversa em /conversa/:sender. Por isso enviamos o
 *               TELEFONE do feirante logado como `sender`.
 * - `name`    → nome exibido na saudação do menu.
 * - `content` → o texto digitado (ex.: "1", "3", "Pedido, 12, ENTREGUE").
 *
 * A resposta pode vir como texto puro (respondToWebhook "text") ou JSON; o
 * parser abaixo é tolerante e aceita ambos.
 */

/** URL do webhook do chatbot no n8n. Sem trailing slash. */
const N8N_CHAT_URL: string = (
  (process.env.EXPO_PUBLIC_N8N_CHAT_URL as string | undefined) || ""
).replace(/\/$/, "");

/** O bot consulta a API a cada mensagem; timeout folgado. */
const TIMEOUT_MS = 45000;

/** Uma mensagem trocada no chat (para exibição). */
export interface MensagemIa {
  id: string;
  autor: "usuario" | "ia";
  texto: string;
  createdAt: string;
}

export class ChatIaException extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ChatIaException";
    this.status = status;
  }
}

/** Extrai o texto da resposta de vários formatos possíveis do n8n. */
function extrairResposta(data: unknown): string {
  if (data == null) return "";
  if (typeof data === "string") return data;
  const obj = Array.isArray(data) ? data[0] : data;
  if (obj == null) return "";
  if (typeof obj === "string") return obj;
  if (typeof obj === "object") {
    const o = obj as Record<string, unknown>;
    const candidato =
      o.resposta ?? o.output ?? o.reply ?? o.text ?? o.message ?? o.answer;
    if (typeof candidato === "string") return candidato;
    if (candidato != null) return String(candidato);
  }
  return "";
}

export const chatIaService = {
  /** Indica se a URL do webhook está configurada no .env. */
  get configurado(): boolean {
    return !!N8N_CHAT_URL;
  },

  /**
   * Envia uma mensagem ao chatbot e devolve o texto da resposta.
   *
   * @param content  Texto digitado pelo feirante.
   * @param sender   Telefone do feirante logado (chave da conversa/estado).
   * @param name     Nome do feirante (usado na saudação do menu).
   */
  async enviar(
    content: string,
    sender: string,
    name: string
  ): Promise<string> {
    if (!N8N_CHAT_URL) {
      throw new ChatIaException(
        0,
        "EXPO_PUBLIC_N8N_CHAT_URL não configurada no .env do app."
      );
    }
    if (!sender) {
      throw new ChatIaException(
        0,
        "Feirante sem telefone cadastrado — necessário para identificar a conversa."
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(N8N_CHAT_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sender, name, content }),
        signal: controller.signal,
      });

      const raw = await res.text();
      let data: unknown = undefined;
      try {
        data = raw ? JSON.parse(raw) : undefined;
      } catch {
        // resposta não-JSON: trata o texto puro como resposta
        data = raw;
      }

      if (!res.ok) {
        const msg = extrairResposta(data) || "Falha ao falar com o assistente.";
        throw new ChatIaException(res.status, msg);
      }

      const texto = extrairResposta(data);
      return texto || "(sem resposta)";
    } finally {
      clearTimeout(timer);
    }
  },
};
