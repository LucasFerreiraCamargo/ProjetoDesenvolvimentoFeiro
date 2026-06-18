/**
 * Service de chat (REST). O lado tempo real (socket) é tratado pelo
 * hook `useChatSocket` em src/hooks/useChatSocket.ts.
 */

import type {
  ChatConversa,
  ChatHistorico,
  ChatMensagem,
  ChatNaoLidas,
} from "../types/api";

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

export const chatService = {
  /** Histórico da conversa de um pedido + papel do usuário logado. */
  async historico(token: string, pedidoId: number): Promise<ChatHistorico> {
    const res = await fetch(`${base()}/chat/pedido/${pedidoId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) await lidaErro(res, "Erro ao carregar mensagens");
    return res.json();
  },

  /** Envia mensagem nesse pedido. */
  async enviar(
    token: string,
    pedidoId: number,
    texto: string,
  ): Promise<ChatMensagem> {
    const res = await fetch(`${base()}/chat/pedido/${pedidoId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ texto }),
    });
    if (!res.ok) await lidaErro(res, "Erro ao enviar mensagem");
    return res.json();
  },

  /** Marca como lidas todas as mensagens do outro lado pra esse pedido. */
  async marcarLidas(token: string, pedidoId: number): Promise<number> {
    const res = await fetch(
      `${base()}/chat/pedido/${pedidoId}/marcar-lidas`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!res.ok) await lidaErro(res, "Erro ao marcar como lidas");
    const data = await res.json();
    return Number(data?.marcadas ?? 0);
  },

  /** Contagem global de mensagens não lidas + breakdown por pedido. */
  async naoLidas(token: string): Promise<ChatNaoLidas> {
    const res = await fetch(`${base()}/chat/nao-lidas`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) await lidaErro(res, "Erro ao buscar não lidas");
    return res.json();
  },

  /** Lista todas conversas ativas do usuário logado (pedidos com mensagens). */
  async conversas(token: string): Promise<ChatConversa[]> {
    const res = await fetch(`${base()}/chat/conversas`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) await lidaErro(res, "Erro ao listar conversas");
    return res.json();
  },
};
