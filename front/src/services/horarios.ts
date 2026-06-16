/**
 * Service de horários do feirante (funcionamento e entrega).
 *
 * - listarPorFeirante: público (cliente lê pra saber dias de entrega disponíveis).
 * - salvarBulk: protegido (apenas admin nível 2+; substitui todas as janelas
 *   de um tipo de uma vez).
 */

import type { HorarioFeirante, TipoHorario } from "../types/api";

const API_BASE =
  (process.env.EXPO_PUBLIC_API_URL as string) || "http://localhost:3001";

export interface JanelaHorario {
  /** 0=Domingo, 6=Sábado */
  dia_semana: number;
  /** "HH:MM" 24h */
  hora_inicio: string;
  hora_fim: string;
}

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

export const horariosService = {
  async listarPorFeirante(
    feiranteId: number,
    tipo?: TipoHorario,
  ): Promise<HorarioFeirante[]> {
    const qs = tipo ? `?tipo=${tipo}` : "";
    const res = await fetch(
      `${API_BASE.replace(/\/$/, "")}/horarios/feirante/${feiranteId}${qs}`,
    );
    if (!res.ok) await lidaErro(res, "Erro ao listar horários");
    return res.json();
  },

  async salvarBulk(
    token: string,
    feiranteId: number,
    tipo: TipoHorario,
    janelas: JanelaHorario[],
  ): Promise<HorarioFeirante[]> {
    const res = await fetch(
      `${API_BASE.replace(/\/$/, "")}/horarios/feirante/${feiranteId}/bulk`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tipo, janelas }),
      },
    );
    if (!res.ok) await lidaErro(res, "Erro ao salvar horários");
    return res.json();
  },
};
