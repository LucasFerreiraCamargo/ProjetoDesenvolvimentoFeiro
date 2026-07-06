/**
 * Service de cestas — encapsula chamadas à rota /cestas da API.
 *
 * Nunca chame fetch() para /cestas diretamente nas telas; use sempre estas
 * funções. Isso garante tipos consistentes e um único ponto de manutenção
 * caso a URL ou o formato da rota mude.
 */

import { apiGet } from "./api";
import type { Cesta } from "../types/api";

/** Opções aceitas pelas chamadas de leitura (ex.: signal p/ cancelamento). */
interface ListarOptions {
  signal?: AbortSignal;
}

export const cestasService = {
  /**
   * Lista todas as cestas cadastradas.
   * A rota `GET /cestas` inclui automaticamente `feirante` e `mercadorias`.
   */
  listar: (options?: ListarOptions) =>
    apiGet<Cesta[]>("/cestas", { signal: options?.signal }),

  /**
   * Busca uma cesta por id.
   * A rota `GET /cestas/:id` inclui `feirante` e `mercadorias`.
   * Lança ApiException com status 404 se a cesta não existir.
   */
  buscarPorId: (id: string | number) => apiGet<Cesta>(`/cestas/${id}`),
};
