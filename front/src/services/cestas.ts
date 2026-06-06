/**
 * Service de cestas — encapsula chamadas à rota /cestas da API.
 *
 * Nunca chame fetch() para /cestas diretamente nas telas; use sempre estas
 * funções. Isso garante tipos consistentes e um único ponto de manutenção
 * caso a URL ou o formato da rota mude.
 */

import { apiGet } from "./api";
import type { Cesta } from "../types/api";

export const cestasService = {
  /**
   * Lista todas as cestas cadastradas.
   * A rota `GET /cestas` inclui automaticamente `feirante` e `mercadorias`.
   */
  listar: () => apiGet<Cesta[]>("/cestas"),

  /**
   * Busca uma cesta por id.
   * A rota `GET /cestas/:id` inclui `feirante` e `mercadorias`.
   * Lança ApiException com status 404 se a cesta não existir.
   */
  buscarPorId: (id: string | number) => apiGet<Cesta>(`/cestas/${id}`),
};
