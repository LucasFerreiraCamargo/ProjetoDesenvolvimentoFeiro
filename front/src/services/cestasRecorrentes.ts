/**
 * Service de cestas recorrentes — encapsula chamadas a /cestas-recorrentes da API.
 *
 * Diferente do `services/api.ts` (que serve a área pública), este service
 * precisa do token do usuário (cliente) — porque o backend usa verificaToken
 * em todas as rotas. Construímos a chamada com fetch + Authorization header.
 */

import type { Decimalish } from "../types/api";

const API_BASE =
  (process.env.EXPO_PUBLIC_API_URL as string) || "http://localhost:3001";

export interface CestaRecorrenteApi {
  id: number;
  nome: string;
  frequencia: string;
  dia_entrega: string;
  preco: Decimalish;
  ativa: boolean;
  usuario_id: string;
  feirante_id: number;
  feirante?: { id: number; nome: string; banca?: string | null };
  mercadorias?: Array<{ id: number; nome: string; preco: Decimalish; foto?: string; emoji?: string | null }>;
  createdAt: string;
  updatedAt: string;
}

export interface CriarCestaRecorrenteInput {
  nome: string;
  frequencia: string; // ex: "Semanal", "Quinzenal", "Mensal"
  dia_entrega: string; // ex: "Segunda-feira"
  preco: number;
  usuario_id: string;
  feirante_id: number;
  mercadorias?: number[];
  ativa?: boolean;
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

function authHeaders(token?: string): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export const cestasRecorrentesService = {
  async listarPorUsuario(
    token: string,
    usuarioId: string,
  ): Promise<CestaRecorrenteApi[]> {
    const res = await fetch(
      `${API_BASE.replace(/\/$/, "")}/cestas-recorrentes/usuario/${usuarioId}`,
      { headers: authHeaders(token) },
    );
    if (!res.ok) await lidaErro(res, "Erro ao listar cestas recorrentes");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async criar(token: string, dados: CriarCestaRecorrenteInput): Promise<CestaRecorrenteApi> {
    const res = await fetch(`${API_BASE.replace(/\/$/, "")}/cestas-recorrentes`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(dados),
    });
    if (!res.ok) await lidaErro(res, "Erro ao criar cesta recorrente");
    return res.json();
  },

  /** Atualiza só os campos enviados (ex: alternar `ativa`). */
  async patch(
    token: string,
    id: number,
    dados: Partial<CriarCestaRecorrenteInput>,
  ): Promise<CestaRecorrenteApi> {
    const res = await fetch(
      `${API_BASE.replace(/\/$/, "")}/cestas-recorrentes/${id}`,
      {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify(dados),
      },
    );
    if (!res.ok) await lidaErro(res, "Erro ao atualizar cesta recorrente");
    return res.json();
  },

  async remover(token: string, id: number): Promise<void> {
    const res = await fetch(
      `${API_BASE.replace(/\/$/, "")}/cestas-recorrentes/${id}`,
      { method: "DELETE", headers: authHeaders(token) },
    );
    if (!res.ok) await lidaErro(res, "Erro ao remover cesta recorrente");
  },
};
