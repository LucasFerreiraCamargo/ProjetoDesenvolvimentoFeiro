/**
 * Service de endereços do cliente (múltiplos endereços por usuário).
 *
 * Todas as operações exigem token JWT do cliente — o backend valida
 * que o usuário só consegue manipular os próprios endereços.
 */

import type { EnderecoUsuario } from "../types/api";

const API_BASE =
  (process.env.EXPO_PUBLIC_API_URL as string) || "http://localhost:3001";

/** Payload para criar/editar endereço. */
export interface EnderecoPayload {
  label: string;
  endereco: string;
  numero?: string | null;
  complemento?: string | null;
  bairro: string;
  cidade?: string | null;
  estado?: string | null;
  uf?: string | null;
  pais?: string | null;
  cep?: string | null;
  principal?: boolean;
}

/** Erro de request com o status HTTP anexado, para o chamador decidir o que fazer. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * fetch com timeout — impede que a UI fique presa em "carregando" caso a API
 * demore demais (cold start do Neon + geocoding no POST/PUT podem somar vários
 * segundos). Sem isto, o fetch cru espera indefinidamente.
 *
 * 20s cobre o pior caso legítimo (ViaCEP 5s + Nominatim 5s + wake do banco)
 * sem deixar o usuário travado para sempre.
 */
async function fetchComTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 20000,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new ApiError(
        "O servidor demorou a responder. Verifique sua conexão e tente novamente.",
        0,
      );
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function lidaErro(res: Response, fallback: string): Promise<never> {
  let msg = fallback;
  try {
    const data = await res.json();
    msg = data?.erro || data?.error || data?.message || fallback;
    // Detalhes Zod: { campo: ["mensagem"] }
    if (data?.detalhes && typeof data.detalhes === "object") {
      const linhas = Object.entries(data.detalhes)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
        .join("\n");
      if (linhas) msg = `${msg}\n${linhas}`;
    }
  } catch {
    /* corpo não-JSON */
  }
  throw new ApiError(`${msg} (HTTP ${res.status})`, res.status);
}

/** Faz res.json() sem derrubar a tela caso o corpo não seja JSON válido. */
async function jsonSeguro<T>(res: Response): Promise<T> {
  const texto = await res.text();
  try {
    return JSON.parse(texto) as T;
  } catch {
    throw new ApiError(
      `Resposta inesperada do servidor (HTTP ${res.status})`,
      res.status,
    );
  }
}

function base() {
  return API_BASE.replace(/\/$/, "");
}

export const enderecosService = {
  /** Lista os endereços do usuário (principal sempre primeiro). */
  async listar(token: string, usuarioId: string): Promise<EnderecoUsuario[]> {
    const res = await fetchComTimeout(`${base()}/enderecos/usuario/${usuarioId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) await lidaErro(res, "Erro ao listar endereços");
    return jsonSeguro<EnderecoUsuario[]>(res);
  },

  /** Cria um novo endereço para o usuário. */
  async criar(
    token: string,
    usuarioId: string,
    payload: EnderecoPayload,
  ): Promise<EnderecoUsuario> {
    const res = await fetchComTimeout(`${base()}/enderecos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...payload, usuario_id: usuarioId }),
    });
    if (!res.ok) await lidaErro(res, "Erro ao criar endereço");
    return res.json();
  },

  /** Atualiza um endereço existente (patch parcial). */
  async atualizar(
    token: string,
    id: number,
    payload: Partial<EnderecoPayload>,
  ): Promise<EnderecoUsuario> {
    const res = await fetchComTimeout(`${base()}/enderecos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) await lidaErro(res, "Erro ao atualizar endereço");
    return res.json();
  },

  /** Remove um endereço. Se for o principal, promove o mais antigo restante. */
  async remover(token: string, id: number): Promise<void> {
    const res = await fetchComTimeout(`${base()}/enderecos/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) await lidaErro(res, "Erro ao remover endereço");
  },

  /** Marca um endereço como principal (desmarca os outros). */
  async marcarComoPrincipal(
    token: string,
    id: number,
  ): Promise<EnderecoUsuario> {
    const res = await fetchComTimeout(`${base()}/enderecos/${id}/principal`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) await lidaErro(res, "Erro ao marcar como principal");
    return res.json();
  },
};
