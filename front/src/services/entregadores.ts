/**
 * Service de entregadores — encapsula chamadas à rota /entregadores da API admin.
 *
 * As rotas /entregadores exigem token (header Authorization: Bearer).
 * Por isso usamos `adminFetch` em vez do client genérico de `services/api.ts`.
 */

import { adminFetch } from "../utils/adminApi";
import type { Entregador } from "../types/api";

export interface ListarEntregadoresParams {
  ativo?: boolean;
  /** Só respeitado para superadmin (nível 3). */
  feirante_id?: number | "null";
}

/** Constrói query string a partir do objeto de filtros. */
function montaQuery(params?: ListarEntregadoresParams): string {
  if (!params) return "";
  const partes: string[] = [];
  if (typeof params.ativo === "boolean") {
    partes.push(`ativo=${params.ativo ? "true" : "false"}`);
  }
  if (params.feirante_id != null) {
    partes.push(`feirante_id=${params.feirante_id}`);
  }
  return partes.length ? `?${partes.join("&")}` : "";
}

/** Lança erro com mensagem do backend quando a resposta não for OK. */
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

export const entregadoresService = {
  async listar(token: string, params?: ListarEntregadoresParams): Promise<Entregador[]> {
    const res = await adminFetch(`/entregadores${montaQuery(params)}`, undefined, token);
    if (!res.ok) await lidaErro(res, "Erro ao listar entregadores");
    return res.json();
  },

  async buscarPorId(token: string, id: number): Promise<Entregador> {
    const res = await adminFetch(`/entregadores/${id}`, undefined, token);
    if (!res.ok) await lidaErro(res, "Erro ao buscar entregador");
    return res.json();
  },

  async criar(token: string, dados: Partial<Entregador>): Promise<Entregador> {
    const res = await adminFetch(
      "/entregadores",
      { method: "POST", body: JSON.stringify(dados) },
      token,
    );
    if (!res.ok) await lidaErro(res, "Erro ao criar entregador");
    return res.json();
  },

  async atualizar(token: string, id: number, dados: Partial<Entregador>): Promise<Entregador> {
    const res = await adminFetch(
      `/entregadores/${id}`,
      { method: "PUT", body: JSON.stringify(dados) },
      token,
    );
    if (!res.ok) await lidaErro(res, "Erro ao atualizar entregador");
    return res.json();
  },

  /** Atualização parcial — útil pra alternar ativo sem reenviar tudo. */
  async patch(token: string, id: number, dados: Partial<Entregador>): Promise<Entregador> {
    const res = await adminFetch(
      `/entregadores/${id}`,
      { method: "PATCH", body: JSON.stringify(dados) },
      token,
    );
    if (!res.ok) await lidaErro(res, "Erro ao atualizar entregador");
    return res.json();
  },

  async remover(token: string, id: number): Promise<void> {
    const res = await adminFetch(`/entregadores/${id}`, { method: "DELETE" }, token);
    if (!res.ok) await lidaErro(res, "Erro ao remover entregador");
  },
};
