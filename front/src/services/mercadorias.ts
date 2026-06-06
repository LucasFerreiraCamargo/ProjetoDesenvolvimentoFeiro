/**
 * Service de mercadorias — encapsula chamadas à rota /mercadorias da API.
 *
 * Nunca chame fetch() para /mercadorias diretamente nas telas; use sempre
 * estas funções.
 */

import { apiGet } from "./api";
import type { Mercadoria } from "../types/api";

export const mercadoriasService = {
  /**
   * Lista todas as mercadorias.
   * A rota inclui `feirante` para que o cliente possa aplicar filtros
   * de proximidade geográfica sem novas requisições.
   */
  listar: () => apiGet<Mercadoria[]>("/mercadorias"),

  /**
   * Busca uma mercadoria por id (com feirante incluído).
   */
  buscarPorId: (id: string | number) =>
    apiGet<Mercadoria>(`/mercadorias/${id}`),
};
