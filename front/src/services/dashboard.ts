/**
 * Service do Dashboard admin/feirante.
 *
 * Endpoints que rodam atrás de `verificaToken + verificaNivel(2)` — token
 * deve vir do AdminContext (usuário logado como feirante ou superadmin).
 */

import type { ProdutosASepararResposta } from "../types/api";

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

export const dashboardService = {
  /**
   * Agrega quantidades de mercadorias dos pedidos em aberto, pra o feirante
   * separar tudo de uma vez.
   *
   * - Feirante (nível 2): só pedidos com mercadorias dele
   * - Superadmin (nível 3): todos os pedidos em aberto
   */
  async produtosASeparar(token: string): Promise<ProdutosASepararResposta> {
    const res = await fetch(`${base()}/dashboard/produtos-a-separar`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) await lidaErro(res, "Erro ao carregar produtos a separar");
    return res.json();
  },
};
