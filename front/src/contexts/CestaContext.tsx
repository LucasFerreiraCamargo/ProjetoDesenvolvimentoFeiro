import React, { createContext, ReactNode, useContext, useReducer } from "react";

// Tipos para o contexto da cesta
export interface ItemCesta {
  id: string;
  produtoId: string;
  feiranteId: string;
  feiraId: string;
  nome: string;
  preco: number;
  /** Unidade de exibição/cálculo local: "g" (peso) ou "unid". */
  unidade: string;
  /**
   * Unidade real cadastrada na mercadoria (UN/KG/CX), enviada à API no
   * checkout. Permite preço por unidade correto no backend. Para itens por
   * peso é "KG"; por unidade, "UN" ou "CX".
   */
  unidadeApi?: string;
  quantidade: number;
  imagem?: string;
  emoji?: string;
  // Informações do feirante
  feiranteNome: string;
  feiranteBanca: string;
  // Informações da feira
  feiraNome: string;
  // Novos campos para cestas
  tipo?: "produto" | "cesta"; // Para diferenciar produtos de cestas
  cestaId?: string; // ID da cesta original se for uma cesta
  precoOriginalCesta?: number; // Preço original da cesta (sem desconto)
  // Ponto de maturação escolhido pelo cliente (enum VERDE/AO_PONTO/MADURO).
  // Ausente quando o produto não oferece essa opção.
  pontoMaturacao?: string;
}

interface CestaState {
  itens: ItemCesta[];
  total: number;
  /**
   * Id da cesta recorrente criada NESTA sessão de carrinho (ou null se
   * ainda não foi criada). Resetado ao limpar o carrinho.
   * Usado para travar o card "Tornar cesta recorrente" em telas posteriores
   * (ex: tela de finalização) quando o usuário já marcou no carrinho.
   */
  cestaRecorrenteId: number | null;
}

type CestaAction =
  | { type: "ADD_ITEM"; payload: ItemCesta }
  | { type: "REMOVE_ITEM"; payload: string } // remove por id
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantidade: number } }
  | { type: "SET_CESTA_RECORRENTE"; payload: number | null }
  | { type: "CLEAR_CESTA" };

// Estado inicial
const initialState: CestaState = {
  itens: [],
  total: 0,
  cestaRecorrenteId: null,
};

// Função para calcular total
function calcularTotal(itens: ItemCesta[]): number {
  return itens.reduce((total, item) => {
    // Se for uma cesta, usar o preço com desconto já aplicado
    if (item.tipo === "cesta") {
      return total + item.preco * item.quantidade;
    }

    // Para produtos em gramas, converter para kg para o cálculo do preço
    if (item.unidade === "g") {
      return total + item.preco * (item.quantidade / 1000);
    }

    // Para produtos por unidade
    return total + item.preco * item.quantidade;
  }, 0);
}

// Reducer
function cestaReducer(state: CestaState, action: CestaAction): CestaState {
  switch (action.type) {
    case "ADD_ITEM": {
      // Verificar se o item já existe (mesmo produto do mesmo feirante com mesma unidade e nome)
      const existingItemIndex = state.itens.findIndex(
        (item) =>
          item.produtoId === action.payload.produtoId &&
          item.feiranteId === action.payload.feiranteId &&
          item.unidade === action.payload.unidade &&
          item.nome === action.payload.nome &&
          item.pontoMaturacao === action.payload.pontoMaturacao
      );

      let newState;
      if (existingItemIndex !== -1) {
        // Se existe, atualizar quantidade
        const updatedItens = [...state.itens];
        updatedItens[existingItemIndex] = {
          ...updatedItens[existingItemIndex],
          quantidade:
            updatedItens[existingItemIndex].quantidade +
            action.payload.quantidade,
        };
        newState = {
          ...state,
          itens: updatedItens,
          total: calcularTotal(updatedItens),
        };
      } else {
        // Se não existe, adicionar novo
        const newItens = [...state.itens, action.payload];
        newState = {
          ...state,
          itens: newItens,
          total: calcularTotal(newItens),
        };
      }

      return newState;
    }

    case "REMOVE_ITEM": {
      const filteredItens = state.itens.filter(
        (item) => item.id !== action.payload
      );
      return {
        ...state,
        itens: filteredItens,
        total: calcularTotal(filteredItens),
      };
    }

    case "UPDATE_QUANTITY": {
      const updatedItens = state.itens
        .map((item) =>
          item.id === action.payload.id
            ? { ...item, quantidade: action.payload.quantidade }
            : item
        )
        .filter((item) => item.quantidade > 0); // Remove itens com quantidade 0

      return {
        ...state,
        itens: updatedItens,
        total: calcularTotal(updatedItens),
      };
    }

    case "SET_CESTA_RECORRENTE":
      return { ...state, cestaRecorrenteId: action.payload };

    case "CLEAR_CESTA":
      return {
        itens: [],
        total: 0,
        cestaRecorrenteId: null,
      };

    default:
      return state;
  }
}

// Context
const CestaContext = createContext<
  | {
      state: CestaState;
      dispatch: React.Dispatch<CestaAction>;
      adicionarItem: (item: Omit<ItemCesta, "id">) => void;
      adicionarCesta: (cestaData: {
        cestaId: string;
        nome: string;
        preco: number;
        precoOriginal?: number;
        feiranteId: string;
        feiraId: string;
        feiranteNome: string;
        feiranteBanca: string;
        feiraNome: string;
        imagem?: string;
        emoji?: string;
        quantidade?: number;
      }) => void;
      removerItem: (id: string) => void;
      atualizarQuantidade: (id: string, quantidade: number) => void;
      limparCesta: () => void;
      getTotalItens: () => number;
      /** Registra que uma cesta recorrente foi criada para o carrinho atual. */
      marcarCestaRecorrenteCriada: (cestaRecorrenteId: number) => void;
      /** Limpa a marcação (ex: ao iniciar um novo fluxo). */
      resetarCestaRecorrente: () => void;
    }
  | undefined
>(undefined);

// Provider
export const CestaProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(cestaReducer, initialState);

  // Funções helper
  const adicionarItem = (itemData: Omit<ItemCesta, "id">) => {
    const item: ItemCesta = {
      ...itemData,
      id: `${itemData.produtoId}-${itemData.feiranteId}-${
        itemData.unidade
      }-${itemData.pontoMaturacao ?? "sm"}-${Date.now()}`,
    };

    dispatch({
      type: "ADD_ITEM",
      payload: item,
    });
  };

  const removerItem = (id: string) => {
    dispatch({
      type: "REMOVE_ITEM",
      payload: id,
    });
  };

  const atualizarQuantidade = (id: string, quantidade: number) => {
    if (quantidade <= 0) {
      removerItem(id);
    } else {
      dispatch({
        type: "UPDATE_QUANTITY",
        payload: { id, quantidade },
      });
    }
  };

  const limparCesta = () => {
    dispatch({
      type: "CLEAR_CESTA",
    });
  };

  const getTotalItens = () => {
    // Contar número de produtos diferentes, não quantidade total
    return state.itens.length;
  };

  const marcarCestaRecorrenteCriada = (cestaRecorrenteId: number) => {
    dispatch({ type: "SET_CESTA_RECORRENTE", payload: cestaRecorrenteId });
  };

  const resetarCestaRecorrente = () => {
    dispatch({ type: "SET_CESTA_RECORRENTE", payload: null });
  };

  const adicionarCesta = (cestaData: {
    cestaId: string;
    nome: string;
    preco: number;
    precoOriginal?: number;
    feiranteId: string;
    feiraId: string;
    feiranteNome: string;
    feiranteBanca: string;
    feiraNome: string;
    imagem?: string;
    emoji?: string;
    quantidade?: number;
  }) => {
    const item: ItemCesta = {
      id: `cesta-${cestaData.cestaId}-${Date.now()}`,
      produtoId: cestaData.cestaId,
      feiranteId: cestaData.feiranteId,
      feiraId: cestaData.feiraId,
      nome: cestaData.nome,
      preco: cestaData.preco,
      unidade: "cesta",
      quantidade: cestaData.quantidade || 1,
      imagem: cestaData.imagem,
      emoji: cestaData.emoji || "🧺",
      feiranteNome: cestaData.feiranteNome,
      feiranteBanca: cestaData.feiranteBanca,
      feiraNome: cestaData.feiraNome,
      tipo: "cesta",
      cestaId: cestaData.cestaId,
      precoOriginalCesta: cestaData.precoOriginal,
    };

    dispatch({
      type: "ADD_ITEM",
      payload: item,
    });
  };

  const contextValue = {
    state,
    dispatch,
    adicionarItem,
    adicionarCesta,
    removerItem,
    atualizarQuantidade,
    limparCesta,
    getTotalItens,
    marcarCestaRecorrenteCriada,
    resetarCestaRecorrente,
  };

  return (
    <CestaContext.Provider value={contextValue}>
      {children}
    </CestaContext.Provider>
  );
};

// Hook
export function useCesta() {
  const context = useContext(CestaContext);

  if (context === undefined) {
    throw new Error("useCesta deve ser usado dentro de um CestaProvider");
  }

  return context;
}
