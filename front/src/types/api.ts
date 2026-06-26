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

/** Tipos de horário do feirante (funcionamento vs entrega). */
export type TipoHorario = "FUNCIONAMENTO" | "ENTREGA";

export interface HorarioFeirante {
  id: number;
  feirante_id: number;
  tipo: TipoHorario;
  /** Dia da semana — 0=Domingo, 6=Sábado. */
  dia_semana: number;
  /** Formato "HH:MM" (24h). */
  hora_inicio: string;
  hora_fim: string;
  createdAt: string;
  updatedAt: string;
}

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

/** Status do ciclo de vida de uma rota de entrega. */
export type StatusRota = "RASCUNHO" | "INICIADA" | "FINALIZADA" | "CANCELADA";

/** Status de cada parada (pedido) dentro de uma rota. */
export type StatusParada = "PENDENTE" | "ENTREGUE" | "FALHA";

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

/**
 * Endereço cadastrado pelo cliente (múltiplos endereços por usuário).
 * Um único endereço fica marcado como `principal=true` por vez — esse é
 * o default ao logar; o cliente pode trocar temporariamente o "selecionado"
 * via dropdown no header (estado local em AsyncStorage).
 */
export interface EnderecoUsuario {
  id: number;
  usuario_id: string;
  /** Rótulo livre: "Casa", "Trabalho", "Sítio", etc. */
  label: string;
  endereco: string;
  numero?: string | null;
  complemento?: string | null;
  bairro: string;
  cidade?: string | null;
  estado?: string | null;
  uf?: string | null;
  pais?: string | null;
  cep?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  principal: boolean;
  createdAt: string;
  updatedAt: string;
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

// ────────── Rotas de entrega (Spoke-like) ──────────

export interface Entregador {
  id: number;
  nome: string;
  email?: string | null;
  telefone: string;
  veiculo?: string | null;
  placa?: string | null;
  ativo: boolean;
  feirante_id?: number | null;
  /** Presente quando a rota inclui o feirante. */
  feirante?: { id: number; nome: string; banca?: string | null };
  createdAt: string;
  updatedAt: string;
}

export interface RotaPedido {
  id: number;
  rota_id: number;
  pedido_id: number;
  ordem: number;
  status_parada: StatusParada;
  completed_at?: string | null;
  observacao?: string | null;
  /** Presente quando a rota faz include do pedido. */
  pedido?: Pedido & {
    usuario?: Pick<
      Usuario,
      "id" | "nome" | "telefone" | "endereco" | "numero" | "bairro" | "cidade" | "latitude" | "longitude"
    >;
  };
}

export interface Rota {
  id: number;
  nome?: string | null;
  status: StatusRota;
  origem_latitude?: number | null;
  origem_longitude?: number | null;
  origem_endereco?: string | null;
  foi_otimizada: boolean;
  data_inicio?: string | null;
  data_fim?: string | null;
  entregador_id: number;
  /** Presente quando a rota inclui o entregador. */
  entregador?: Pick<Entregador, "id" | "nome" | "telefone" | "veiculo" | "placa">;
  /** Paradas ordenadas pela `ordem`. */
  paradas?: RotaPedido[];
  /** Quando a rota só vem com contagem (lista). */
  _count?: { paradas: number };
  createdAt: string;
  updatedAt: string;
}

// ────────── Erros padronizados da API ──────────

/** Formato comum de erro retornado pelas rotas (`res.status(4xx).json({ erro })`). */
export interface ApiError {
  erro: unknown;
  detalhes?: unknown;
}

// ────────── Notificações in-app ──────────

export type TipoNotificacao =
  | "PEDIDO_CONFIRMADO"
  | "PEDIDO_STATUS_MUDOU"
  | "CHAT_NOVA_MENSAGEM"
  | "PROMOCAO"
  | "SISTEMA";

export interface Notificacao {
  id: number;
  usuario_id: string;
  tipo: TipoNotificacao;
  titulo: string;
  corpo: string;
  /** Payload livre — usado pra deep link (target) e dados auxiliares. */
  payload?: {
    pedido_id?: number;
    status?: StatusPedido;
    target?: string;
    [k: string]: unknown;
  } | null;
  lida: boolean;
  createdAt: string;
}

// ────────── Dashboard: produtos a separar ──────────

/** Detalhe de qual pedido demanda quanto daquela mercadoria. */
export interface ProdutoASepararPedido {
  pedido_id: number;
  cliente_nome: string;
  quantidade: number;
}

/** Linha agregada por mercadoria — quantidade total + breakdown. */
export interface ProdutoASeparar {
  mercadoria_id: number;
  nome: string;
  foto: string;
  unidade: Unidade | string;
  categoria: Categoria | string;
  quantidadeTotal: number;
  pedidos: ProdutoASepararPedido[];
}

/** Resposta do GET /dashboard/produtos-a-separar. */
export interface ProdutosASepararResposta {
  pedidosConsiderados: number;
  produtos: ProdutoASeparar[];
}

// ────────── Chat cliente ↔ feirante (por pedido) ──────────

export type RemetenteChat = "CLIENTE" | "FEIRANTE";

export interface ChatMensagem {
  id: number;
  pedido_id: number;
  remetente_tipo: RemetenteChat;
  remetente_id: string;
  texto: string;
  lida: boolean;
  createdAt: string;
}

/** Resposta de GET /chat/pedido/:id — inclui contexto pra renderização. */
export interface ChatHistorico {
  mensagens: ChatMensagem[];
  eu: { tipo: RemetenteChat; remetenteId: string };
  pedido: { id: number; usuario_id: string; status: StatusPedido };
}

/** Resposta de GET /chat/nao-lidas — usada pra badge global. */
export interface ChatNaoLidas {
  total: number;
  porPedido: { pedido_id: number; naoLidas: number }[];
}

/** Resposta de GET /chat/conversas — lista de conversas ativas. */
export interface ChatConversa {
  pedido: {
    id: number;
    status: StatusPedido;
    usuario: { id: string; nome: string };
    items: {
      mercadoria: {
        feirante: { id: number; nome: string; banca?: string | null };
      };
    }[];
  };
  ultimaMensagem: ChatMensagem | null;
  naoLidas: number;
}
