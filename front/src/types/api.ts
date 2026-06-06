/**
 * Tipos espelhando o schema Prisma da API (api_finalv2).
 *
 * Estas interfaces representam o formato JSON cru recebido das rotas REST.
 * Observações importantes:
 *
 * - Campos `Decimal` do Prisma chegam como STRING via `res.json()` no client.
 *   Por isso `preco`, `quantidade`, etc. são tipados como `number | string` —
 *   sempre converta com `Number(x)` antes de calcular.
 *
 * - Campos opcionais no Prisma (com `?`) são representados como
 *   `field?: T` ou `field: T | null`, conforme o caso real da resposta.
 *
 * - Relations (`include: { feirante: true }`) só aparecem se a rota faz
 *   o include — não confie nelas sem checar a rota correspondente.
 */

// ────────── Enums da API ──────────

export type Categoria =
  | "FRUTAS"
  | "LEGUMES"
  | "VERDURAS"
  | "TEMPEROS"
  | "OVOS"
  | "ORGANICOS"
  | "CARNES"
  | "PEIXES"
  | "LATICINIOS"
  | "GRAOS";

export type Unidade = "UN" | "KG" | "CX";

export type StatusPedido =
  | "PENDENTE"
  | "EM_PREPARACAO"
  | "EM_ANDAMENTO"
  | "EM_ROTA"
  | "ENTREGUE"
  | "RETORNANDO"
  | "CANCELADO"
  | "FINALIZADO";

/** Categorias pré-definidas para cestas (enum CategoriaCesta no banco). */
export type CategoriaCesta =
  | "SEMANAL"
  | "QUINZENAL"
  | "MENSAL"
  | "FIT"
  | "ORGANICA"
  | "CAFE_DA_MANHA"
  | "SOPAO"
  | "FESTA"
  | "OUTRA";

export type StatusAberto = "Aberto" | "Fechado";

/** Decimal do Prisma chega como string no JSON, mas pode vir number também. */
export type Decimalish = number | string;

// ────────── Entidades ──────────

export interface Feira {
  id: number;
  nome: string;
  endereco: string;
  status: StatusAberto;
  horario: string;
  latitude: number;
  longitude: number;
  imagem?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Feirante {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  uf?: string | null;
  pais?: string | null;
  cep?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  raio_entrega_km?: number | null;
  entrega_ativa: boolean;
  banca?: string | null;
  avaliacao?: number | null;
  totalAvaliacoes?: number | null;
  foto?: string | null;
  avatar?: string | null;
  especialidade?: string | null;
  status?: StatusAberto | null;
  feiraId?: number | null;
  /** Presente apenas quando a rota faz `include: { feira: true }`. */
  feira?: Feira;
}

export interface Mercadoria {
  id: number;
  nome: string;
  preco: Decimalish;
  preco_promocional?: Decimalish | null;
  quantidade: Decimalish;
  estoque_minimo: Decimalish;
  estoque_maximo: Decimalish;
  categoria: Categoria;
  unidade: Unidade;
  foto: string;
  emoji?: string | null;
  destaque: boolean;
  feirante_id: number;
  /** Presente apenas quando a rota faz `include: { feirante: true }`. */
  feirante?: Feirante;
}

export interface Cesta {
  id: number;
  nome: string;
  preco: Decimalish;
  /**
   * Desconto em valor absoluto (R$). O backend armazena Decimal; o JSON
   * chega como string (Prisma) ou number. Converta com `Number()` antes
   * de calcular. Sempre `null`/ausente quando a cesta não tem desconto.
   */
  desconto?: Decimalish | null;
  imagem?: string | null;
  emoji?: string | null;
  categoria?: CategoriaCesta | null;
  feirante_id: number;
  /** Presente quando a rota faz `include: { feirante: true }`. */
  feirante?: Feirante;
  /** Presente quando a rota faz `include: { mercadorias: true }`. */
  mercadorias?: Mercadoria[];
}

export interface CestaRecorrente {
  id: number;
  nome: string;
  frequencia: string;
  dia_entrega: string;
  preco: Decimalish;
  ativa: boolean;
  usuario_id: string;
  feirante_id: number;
  feirante?: Feirante;
  mercadorias?: Mercadoria[];
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  numero?: string | null;
  bairro: string;
  cidade?: string | null;
  estado?: string | null;
  uf?: string | null;
  pais?: string | null;
  cep?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  nivel: number;
}

export interface PedidoItem {
  id: number;
  quantidade: Decimalish;
  preco_unitario: Decimalish;
  pedido_id: number;
  mercadoria_id: number;
  mercadoria?: Mercadoria;
}

export interface Pedido {
  id: number;
  valor_total: Decimalish;
  status: StatusPedido;
  createdAt: string;
  updatedAt?: string | null;
  usuario_id: string;
  adminId?: string | null;
  items?: PedidoItem[];
}

// ────────── Erros padronizados da API ──────────

/** Formato comum de erro retornado pelas rotas (`res.status(4xx).json({ erro })`). */
export interface ApiError {
  erro: unknown;
  detalhes?: unknown;
}
