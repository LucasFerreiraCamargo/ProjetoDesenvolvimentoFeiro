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
  throw new Error(`${msg} (HTTP ${res.status})`);
}

function base() {
  return API_BASE.replace(/\/$/, "");
}

export const enderecosService = {
  /** Lista os endereços do usuário (principal sempre primeiro). */
  async listar(token: string, usuarioId: string): Promise<EnderecoUsuario[]> {
    const res = await fetch(`${base()}/enderecos/usuario/${usuarioId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) await lidaErro(res, "Erro ao listar endereços");
    return res.json();
  },

  /** Cria um novo endereço para o usuário. */
  async criar(
    token: string,
    usuarioId: string,
    payload: EnderecoPayload,
  ): Promise<EnderecoUsuario> {
    const res = await fetch(`${base()}/enderecos`, {
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
    const res = await fetch(`${base()}/enderecos/${id}`, {
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
    const res = await fetch(`${base()}/enderecos/${id}`, {
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
    const res = await fetch(`${base()}/enderecos/${id}/principal`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) await lidaErro(res, "Erro ao marcar como principal");
    return res.json();
  },
};
