/**
 * Service de rotas — encapsula chamadas a /rotas da API admin.
 * Todas as chamadas exigem token (header Authorization: Bearer).
 */

import { adminFetch } from "../utils/adminApi";
import type { Rota, StatusRota, StatusParada } from "../types/api";

export interface CriarRotaInput {
  nome?: string;
  entregador_id: number;
  pedido_ids: number[];
  origem_latitude?: number;
  origem_longitude?: number;
  origem_endereco?: string;
}

export interface ListarRotasParams {
  status?: StatusRota;
  entregador_id?: number;
}

export interface AtualizarParadaInput {
  status_parada: StatusParada;
  observacao?: string;
}

/** Resposta da otimização inclui um campo extra com metadados do algoritmo. */
export interface RotaOtimizada extends Rota {
  otimizacao?: {
    algoritmo: string;
    distancia_total_km: number | null;
    iteracoes_2opt: number;
  };
}

function montaQuery(p?: ListarRotasParams): string {
  if (!p) return "";
  const partes: string[] = [];
  if (p.status) partes.push(`status=${p.status}`);
  if (p.entregador_id != null) partes.push(`entregador_id=${p.entregador_id}`);
  return partes.length ? `?${partes.join("&")}` : "";
}

async function lidaErro(res: Response, fallback: string): Promise<never> {
  let msg = fallback;
  try {
    const data = await res.json();
    msg = data?.erro || data?.error || data?.message || fallback;
  } catch {
    /* corpo nao-JSON */
  }
  throw new Error(`${msg} (HTTP ${res.status})`);
}

export const rotasService = {
  async listar(token: string, params?: ListarRotasParams): Promise<Rota[]> {
    const res = await adminFetch(`/rotas${montaQuery(params)}`, undefined, token);
    if (!res.ok) await lidaErro(res, "Erro ao listar rotas");
    return res.json();
  },

  async buscarPorId(token: string, id: number): Promise<Rota> {
    const res = await adminFetch(`/rotas/${id}`, undefined, token);
    if (!res.ok) await lidaErro(res, "Erro ao buscar rota");
    return res.json();
  },

  async criar(token: string, dados: CriarRotaInput): Promise<Rota> {
    const res = await adminFetch(
      "/rotas",
      { method: "POST", body: JSON.stringify(dados) },
      token,
    );
    if (!res.ok) await lidaErro(res, "Erro ao criar rota");
    return res.json();
  },

  async reordenar(token: string, id: number, ordem: number[]): Promise<Rota> {
    const res = await adminFetch(
      `/rotas/${id}/reordenar`,
      { method: "PUT", body: JSON.stringify({ ordem }) },
      token,
    );
    if (!res.ok) await lidaErro(res, "Erro ao reordenar rota");
    return res.json();
  },

  /**
   * Otimiza a ordem das paradas. Por padrão usa o algoritmo do backend
   * (Haversine + NN + 2-opt). Se passar `ordem`, força essa sequência.
   */
  async otimizar(
    token: string,
    id: number,
    ordem?: number[],
  ): Promise<RotaOtimizada> {
    const body = ordem ? { ordem } : {};
    const res = await adminFetch(
      `/rotas/${id}/otimizar`,
      { method: "PATCH", body: JSON.stringify(body) },
      token,
    );
    if (!res.ok) await lidaErro(res, "Erro ao otimizar rota");
    return res.json();
  },

  async iniciar(token: string, id: number): Promise<Rota> {
    const res = await adminFetch(
      `/rotas/${id}/iniciar`,
      { method: "PATCH", body: JSON.stringify({}) },
      token,
    );
    if (!res.ok) await lidaErro(res, "Erro ao iniciar rota");
    return res.json();
  },

  async finalizar(token: string, id: number): Promise<Rota> {
    const res = await adminFetch(
      `/rotas/${id}/finalizar`,
      { method: "PATCH", body: JSON.stringify({}) },
      token,
    );
    if (!res.ok) await lidaErro(res, "Erro ao finalizar rota");
    return res.json();
  },

  async cancelar(token: string, id: number): Promise<Rota> {
    const res = await adminFetch(
      `/rotas/${id}/cancelar`,
      { method: "PATCH", body: JSON.stringify({}) },
      token,
    );
    if (!res.ok) await lidaErro(res, "Erro ao cancelar rota");
    return res.json();
  },

  async atualizarParada(
    token: string,
    rotaId: number,
    pedidoId: number,
    dados: AtualizarParadaInput,
  ): Promise<Rota> {
    const res = await adminFetch(
      `/rotas/${rotaId}/paradas/${pedidoId}`,
      { method: "PATCH", body: JSON.stringify(dados) },
      token,
    );
    if (!res.ok) await lidaErro(res, "Erro ao atualizar parada");
    return res.json();
  },

  async remover(token: string, id: number): Promise<void> {
    const res = await adminFetch(`/rotas/${id}`, { method: "DELETE" }, token);
    if (!res.ok) await lidaErro(res, "Erro ao remover rota");
  },
};
