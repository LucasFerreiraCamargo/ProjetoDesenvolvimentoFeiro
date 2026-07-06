/**
 * Service de mercadorias — encapsula chamadas à rota /mercadorias da API.
 *
 * Nunca chame fetch() para /mercadorias diretamente nas telas; use sempre
 * estas funções.
 */

import { apiGet } from "./api";
import type { Mercadoria } from "../types/api";

/** Opções aceitas pelas chamadas de leitura (ex.: signal p/ cancelamento). */
interface ListarOptions {
  signal?: AbortSignal;
}

export const mercadoriasService = {
  /**
   * Lista todas as mercadorias.
   * A rota inclui `feirante` para que o cliente possa aplicar filtros
   * de proximidade geográfica sem novas requisições.
   */
  listar: (options?: ListarOptions) =>
    apiGet<Mercadoria[]>("/mercadorias", { signal: options?.signal }),

  /**
   * Busca uma mercadoria por id (com feirante incluído).
   */
  buscarPorId: (id: string | number) =>
    apiGet<Mercadoria>(`/mercadorias/${id}`),
};
