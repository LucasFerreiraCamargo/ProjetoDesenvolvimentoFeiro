/**
 * Service de notificações in-app do cliente.
 *
 * Todas as rotas exigem token de cliente (UserContext). O backend filtra
 * automaticamente pelas notificações do `userLogadoId`.
 */

import type { Notificacao } from "../types/api";

const API_BASE =
  (process.env.EXPO_PUBLIC_API_URL as string) || "http://localhost:3001";

async function lidaErro(res: Response, fallback: string): Promise<never> {
  let msg = fallback;
  try {
    const data = await res.json();
    msg = data?.erro || data?.error || data?.message || fallback;
  } catch {
    /* corpo não-JSON */
  }
  throw new Error(`${msg} (HTTP ${res.status})`);
}

function base() {
  return API_BASE.replace(/\/$/, "");
}

export const notificacoesService = {
  /** Lista as últimas N notificações do usuário logado (default 50). */
  async listar(token: string, limit = 50): Promise<Notificacao[]> {
    const res = await fetch(`${base()}/notificacoes?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) await lidaErro(res, "Erro ao listar notificações");
    return res.json();
  },

  /** Total de não-lidas (badge do sino). */
  async naoLidas(token: string): Promise<number> {
    const res = await fetch(`${base()}/notificacoes/nao-lidas`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) await lidaErro(res, "Erro ao contar notificações");
    const data = await res.json();
    return Number(data?.total ?? 0);
  },

  /** Marca uma notificação como lida (idempotente). */
  async marcarLida(token: string, id: number): Promise<void> {
    const res = await fetch(`${base()}/notificacoes/${id}/lida`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) await lidaErro(res, "Erro ao marcar como lida");
  },

  /** Marca todas as não-lidas do usuário como lidas. */
  async marcarTodasLidas(token: string): Promise<number> {
    const res = await fetch(`${base()}/notificacoes/marcar-todas-lidas`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) await lidaErro(res, "Erro ao marcar todas como lidas");
    const data = await res.json();
    return Number(data?.marcadas ?? 0);
  },

  /** Remove a notificação. */
  async remover(token: string, id: number): Promise<void> {
    const res = await fetch(`${base()}/notificacoes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) await lidaErro(res, "Erro ao remover notificação");
  },
};
