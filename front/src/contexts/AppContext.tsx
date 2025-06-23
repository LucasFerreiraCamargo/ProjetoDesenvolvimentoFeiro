import React, { createContext, ReactNode, useContext, useReducer } from "react";

// Tipos
export interface Produto {
  id: string;
  nome: string;
  preco: number;
  unidade: string;
  estoque: number;
  imagem: string;
  quantidade: number;
  categoria: string;
  emoji?: string;
  unidades?: { tipo: string; preco: number }[];
  unidadeSelecionada?: string;
}

export interface Cesta {
  id: string;
  nome: string;
  preco: number;
  desconto?: string;
  itens: ItemCesta[];
  feirante: string;
  banca: string;
  feira: string;
  categoria?: string;
  emoji?: string;
  imagem?: string;
}

export interface ItemCesta {
  id: string;
  nome: string;
  preco: number;
  unidade: string;
  quantidade: number;
  imagem: string;
}

export interface Feirante {
  id: string;
  nome: string;
  banca: string;
  avaliacao: number;
  totalAvaliacoes: number;
  foto: string;
  especialidade: string;
  produtos: Produto[];
  cestas: Cesta[];
  status: "Aberto" | "Fechado";
  avatar?: string;
}

export interface Feira {
  id: string;
  nome: string;
  endereco: string;
  status: "Aberto" | "Fechado";
  horario: string;
  distancia: string;
  feirantes: Feirante[];
  coordinate: {
    latitude: number;
    longitude: number;
  };
  imagem: string;
}

export interface CestaRecorrente {
  id: string;
  nome: string;
  feirante: string;
  frequencia: string;
  entrega: string;
  preco: string;
  itens: number;
  ativa: boolean;
  produtos?: ItemCesta[];
}

interface AppState {
  feiras: Feira[];
  cestasRecorrentes: CestaRecorrente[];
  categorias: string[];
  carrinho: ItemCarrinho[];
}

interface ItemCarrinho {
  produtoId: string;
  feiranteId: string;
  quantidade: number;
  preco: number;
}

type AppAction =
  | { type: "ADD_TO_CART"; payload: ItemCarrinho }
  | { type: "REMOVE_FROM_CART"; payload: string }
  | {
      type: "UPDATE_CART_QUANTITY";
      payload: { produtoId: string; quantidade: number };
    }
  | { type: "CLEAR_CART" }
  | { type: "ADD_CESTA_RECORRENTE"; payload: CestaRecorrente }
  | { type: "UPDATE_CESTA_RECORRENTE"; payload: CestaRecorrente }
  | { type: "DELETE_CESTA_RECORRENTE"; payload: string };

// Dados iniciais
const initialFeiras: Feira[] = [
  {
    id: "1",
    nome: "Feira Central",
    endereco: "Av. Principal, 1234 - Centro",
    status: "Aberto",
    horario: "7h às 14h",
    distancia: "1.2 km",
    coordinate: { latitude: -31.7654, longitude: -52.3376 },
    imagem:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop",
    feirantes: [
      {
        id: "joao-silva",
        nome: "João da Silva",
        banca: "Banca 23",
        avaliacao: 4.8,
        totalAvaliacoes: 234,
        foto: "👨‍🌾",
        especialidade: "Frutas e Verduras",
        status: "Aberto",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
        produtos: [
          {
            id: "tomate-italiano",
            nome: "Tomate Italiano",
            preco: 8.9,
            unidade: "kg",
            estoque: 12,
            imagem:
              "https://images.unsplash.com/photo-1546470427-227a3d7baa1b?w=100&h=100&fit=crop",
            quantidade: 0,
            categoria: "verduras",
            emoji: "🍅",
          },
          {
            id: "alface-crespa",
            nome: "Alface Crespa",
            preco: 3.5,
            unidade: "unid",
            estoque: 20,
            imagem:
              "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=100&h=100&fit=crop",
            quantidade: 0,
            categoria: "verduras",
            emoji: "🥬",
          },
          {
            id: "cenoura",
            nome: "Cenoura",
            preco: 5.9,
            unidade: "kg",
            estoque: 8,
            imagem:
              "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=100&h=100&fit=crop",
            quantidade: 0,
            categoria: "legumes",
            emoji: "🥕",
          },
          {
            id: "banana-prata",
            nome: "Banana Prata",
            preco: 4.2,
            unidade: "kg",
            estoque: 15,
            imagem:
              "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=100&h=100&fit=crop",
            quantidade: 0,
            categoria: "frutas",
            unidades: [
              { tipo: "kg", preco: 4.2 },
              { tipo: "dúzia", preco: 5.0 },
            ],
            unidadeSelecionada: "kg",
          },
          {
            id: "maca-gala",
            nome: "Maçã Gala",
            preco: 6.8,
            unidade: "kg",
            estoque: 10,
            imagem:
              "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=100&h=100&fit=crop",
            quantidade: 0,
            categoria: "frutas",
            unidades: [
              { tipo: "kg", preco: 6.8 },
              { tipo: "unid", preco: 1.2 },
            ],
            unidadeSelecionada: "kg",
          },
          {
            id: "brocolis",
            nome: "Brócolis",
            preco: 4.5,
            unidade: "unid",
            estoque: 6,
            imagem:
              "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=100&h=100&fit=crop",
            quantidade: 0,
            categoria: "verduras",
            unidades: [
              { tipo: "unid", preco: 4.5 },
              { tipo: "kg", preco: 12.0 },
            ],
            unidadeSelecionada: "unid",
          },
        ],
        cestas: [
          {
            id: "kit-sopao",
            nome: "Kit Sopão",
            preco: 25.8,
            desconto: "10% OFF",
            feirante: "João da Silva",
            banca: "Banca 23",
            feira: "Feira Central",
            emoji: "🥕",
            imagem:
              "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop",
            itens: [
              {
                id: "abobrinha",
                nome: "Abobrinha",
                preco: 2.8,
                unidade: "kg",
                quantidade: 2,
                imagem:
                  "https://images.unsplash.com/photo-1601470982266-89ee3e0f9ce4?w=100&h=100&fit=crop",
              },
              {
                id: "moranga",
                nome: "Moranga Cabotiá",
                preco: 3.5,
                unidade: "unid",
                quantidade: 1,
                imagem:
                  "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=100&h=100&fit=crop",
              },
              {
                id: "cenoura-kit",
                nome: "Cenoura",
                preco: 3.5,
                unidade: "unid",
                quantidade: 1,
                imagem:
                  "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=100&h=100&fit=crop",
              },
              {
                id: "batata-inglesa",
                nome: "Batata Inglesa",
                preco: 3.5,
                unidade: "unid",
                quantidade: 1,
                imagem:
                  "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=100&h=100&fit=crop",
              },
              {
                id: "brocolis-kit",
                nome: "Brócolis",
                preco: 3.5,
                unidade: "unid",
                quantidade: 1,
                imagem:
                  "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=100&h=100&fit=crop",
              },
            ],
          },
          {
            id: "cesta-semanal-familia",
            nome: "Cesta Semanal Família",
            preco: 89.9,
            feirante: "João da Silva",
            banca: "Banca 23",
            feira: "Feira Central",
            emoji: "🥬",
            imagem:
              "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400&h=300&fit=crop",
            itens: [
              {
                id: "tomate-italiano-cesta",
                nome: "Tomate Italiano",
                preco: 5.99,
                unidade: "kg",
                quantidade: 2,
                imagem:
                  "https://images.unsplash.com/photo-1546470427-227a3d7baa1b?w=100&h=100&fit=crop",
              },
              {
                id: "alface-crespa-cesta",
                nome: "Alface Crespa",
                preco: 2.5,
                unidade: "unid",
                quantidade: 3,
                imagem:
                  "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=100&h=100&fit=crop",
              },
              {
                id: "cenoura-organica",
                nome: "Cenoura Orgânica",
                preco: 4.2,
                unidade: "kg",
                quantidade: 1,
                imagem:
                  "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=100&h=100&fit=crop",
              },
              {
                id: "batata-doce",
                nome: "Batata Doce",
                preco: 3.8,
                unidade: "kg",
                quantidade: 1,
                imagem:
                  "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=100&h=100&fit=crop",
              },
              {
                id: "cebola-roxa",
                nome: "Cebola Roxa",
                preco: 3.2,
                unidade: "kg",
                quantidade: 1,
                imagem:
                  "https://images.unsplash.com/photo-1508747703725-719777637510?w=100&h=100&fit=crop",
              },
              {
                id: "brocolis-familia",
                nome: "Brócolis",
                preco: 4.5,
                unidade: "unid",
                quantidade: 2,
                imagem:
                  "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=100&h=100&fit=crop",
              },
              {
                id: "couve-flor",
                nome: "Couve-flor",
                preco: 3.9,
                unidade: "unid",
                quantidade: 1,
                imagem:
                  "https://images.unsplash.com/photo-1568584711271-0e4e2d6e4119?w=100&h=100&fit=crop",
              },
              {
                id: "abobrinha-familia",
                nome: "Abobrinha",
                preco: 2.8,
                unidade: "kg",
                quantidade: 1,
                imagem:
                  "https://images.unsplash.com/photo-1601470982266-89ee3e0f9ce4?w=100&h=100&fit=crop",
              },
            ],
          },
        ],
      },
      {
        id: "maria-santos",
        nome: "Maria Santos",
        banca: "Banca 15",
        avaliacao: 4.6,
        totalAvaliacoes: 189,
        foto: "👩‍🌾",
        especialidade: "Legumes Orgânicos",
        status: "Aberto",
        avatar:
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
        produtos: [],
        cestas: [
          {
            id: "cesta-premium",
            nome: "Cesta Premium",
            preco: 119.9,
            feirante: "Maria Santos",
            banca: "Banca 15",
            feira: "Feira Central",
            imagem:
              "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400&h=300&fit=crop",
            itens: [
              {
                id: "tomate-organico",
                nome: "Tomate Orgânico",
                preco: 12.0,
                unidade: "kg",
                quantidade: 1,
                imagem:
                  "https://images.unsplash.com/photo-1546470427-227a3d7baa1b?w=100&h=100&fit=crop",
              },
              {
                id: "alface-americana-organica",
                nome: "Alface Americana Orgânica",
                preco: 4.5,
                unidade: "unid",
                quantidade: 2,
                imagem:
                  "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=100&h=100&fit=crop",
              },
              {
                id: "rucula-premium",
                nome: "Rúcula Premium",
                preco: 6.0,
                unidade: "maço",
                quantidade: 2,
                imagem:
                  "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=100&h=100&fit=crop",
              },
              {
                id: "espinafre-baby",
                nome: "Espinafre Baby",
                preco: 8.5,
                unidade: "maço",
                quantidade: 1,
                imagem:
                  "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=100&h=100&fit=crop",
              },
              {
                id: "cogumelos-shiitake",
                nome: "Cogumelos Shiitake",
                preco: 15.0,
                unidade: "kg",
                quantidade: 1,
                imagem:
                  "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=100&h=100&fit=crop",
              },
              {
                id: "pimentao-organico-mix",
                nome: "Pimentão Orgânico Mix",
                preco: 9.8,
                unidade: "kg",
                quantidade: 1,
                imagem:
                  "https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba?w=100&h=100&fit=crop",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "2",
    nome: "Feira do Lobão",
    endereco: "Rua das Flores, 123 - Vila Mariana",
    status: "Aberto",
    horario: "6h às 13h",
    distancia: "0.8 km",
    coordinate: { latitude: -31.7704, longitude: -52.3426 },
    imagem:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop",
    feirantes: [],
  },
  {
    id: "3",
    nome: "Feira Vila Mariana",
    endereco: "Av. Pinheiros, 456 - Pinheiros",
    status: "Fechado",
    horario: "7h às 15h",
    distancia: "2.1 km",
    coordinate: { latitude: -31.7604, longitude: -52.3326 },
    imagem:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop",
    feirantes: [],
  },
  {
    id: "4",
    nome: "Feira do Produtor",
    endereco: "Praça Central, s/n - Centro",
    status: "Fechado",
    horario: "8h às 14h",
    distancia: "1.5 km",
    coordinate: { latitude: -31.7684, longitude: -52.3406 },
    imagem:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop",
    feirantes: [],
  },
  {
    id: "5",
    nome: "Feira Orgânica",
    endereco: "Rua Verde, 789 - Ecológico",
    status: "Aberto",
    horario: "9h às 16h",
    distancia: "3.2 km",
    coordinate: { latitude: -31.7634, longitude: -52.3356 },
    imagem:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop",
    feirantes: [],
  },
];

const initialCestasRecorrentes: CestaRecorrente[] = [
  {
    id: "1",
    nome: "Kit Sopão",
    feirante: "João da Silva - Banca 23 - Feira do Lobão",
    frequencia: "Toda Segunda-feira",
    entrega: "Entrega • R$ 5,00",
    preco: "R$ 25,90",
    itens: 8,
    ativa: true,
    produtos: [
      {
        id: "tomate-italiano",
        nome: "Tomate Italiano",
        preco: 8.9,
        unidade: "g",
        quantidade: 500,
        imagem:
          "https://images.unsplash.com/photo-1546470427-227a3d7baa1b?w=100&h=100&fit=crop",
      },
      {
        id: "cenoura",
        nome: "Cenoura",
        preco: 5.9,
        unidade: "g",
        quantidade: 300,
        imagem:
          "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=100&h=100&fit=crop",
      },
      {
        id: "cebola",
        nome: "Cebola",
        preco: 4.2,
        unidade: "unid",
        quantidade: 2,
        imagem:
          "https://images.unsplash.com/photo-1518906447387-39137d94819d?w=100&h=100&fit=crop",
      },
    ],
  },
  {
    id: "2",
    nome: "Cesta Fit",
    feirante: "Feira do Produtor",
    frequencia: "A cada 15 dias (Quinta)",
    entrega: "Retirada no local",
    preco: "R$ 120,00",
    itens: 12,
    ativa: true,
    produtos: [
      {
        id: "alface-crespa",
        nome: "Alface Crespa",
        preco: 3.5,
        unidade: "unid",
        quantidade: 3,
        imagem:
          "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=100&h=100&fit=crop",
      },
      {
        id: "brocolis",
        nome: "Brócolis",
        preco: 4.5,
        unidade: "unid",
        quantidade: 2,
        imagem:
          "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=100&h=100&fit=crop",
      },
      {
        id: "banana-prata",
        nome: "Banana Prata",
        preco: 4.2,
        unidade: "g",
        quantidade: 1000,
        imagem:
          "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=100&h=100&fit=crop",
      },
    ],
  },
];

const initialState: AppState = {
  feiras: initialFeiras,
  cestasRecorrentes: initialCestasRecorrentes,
  categorias: ["Todos", "Frutas", "Verduras", "Legumes"],
  carrinho: [],
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "ADD_TO_CART":
      const existingItemIndex = state.carrinho.findIndex(
        (item) => item.produtoId === action.payload.produtoId
      );

      if (existingItemIndex >= 0) {
        const updatedCarrinho = [...state.carrinho];
        updatedCarrinho[existingItemIndex].quantidade +=
          action.payload.quantidade;
        return { ...state, carrinho: updatedCarrinho };
      }

      return { ...state, carrinho: [...state.carrinho, action.payload] };

    case "REMOVE_FROM_CART":
      return {
        ...state,
        carrinho: state.carrinho.filter(
          (item) => item.produtoId !== action.payload
        ),
      };

    case "UPDATE_CART_QUANTITY":
      return {
        ...state,
        carrinho: state.carrinho.map((item) =>
          item.produtoId === action.payload.produtoId
            ? { ...item, quantidade: action.payload.quantidade }
            : item
        ),
      };

    case "CLEAR_CART":
      return { ...state, carrinho: [] };

    case "ADD_CESTA_RECORRENTE":
      return {
        ...state,
        cestasRecorrentes: [...state.cestasRecorrentes, action.payload],
      };

    case "UPDATE_CESTA_RECORRENTE":
      return {
        ...state,
        cestasRecorrentes: state.cestasRecorrentes.map((cesta) =>
          cesta.id === action.payload.id ? action.payload : cesta
        ),
      };

    case "DELETE_CESTA_RECORRENTE":
      return {
        ...state,
        cestasRecorrentes: state.cestasRecorrentes.filter(
          (cesta) => cesta.id !== action.payload
        ),
      };

    default:
      return state;
  }
}

// Context
const AppContext = createContext<
  | {
      state: AppState;
      dispatch: React.Dispatch<AppAction>;
      // Funções helper
      getFeira: (id: string) => Feira | undefined;
      getFeirante: (
        feiraId: string,
        feiranteId: string
      ) => Feirante | undefined;
      getProduto: (
        feiraId: string,
        feiranteId: string,
        produtoId: string
      ) => Produto | undefined;
      getCesta: (cestaId: string) => Cesta | undefined;
      getAllCestas: () => Cesta[];
      getAllProdutos: () => Produto[];
    }
  | undefined
>(undefined);

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const getFeira = (id: string): Feira | undefined => {
    return state.feiras.find((feira) => feira.id === id);
  };

  const getFeirante = (
    feiraId: string,
    feiranteId: string
  ): Feirante | undefined => {
    const feira = getFeira(feiraId);
    return feira?.feirantes.find((feirante) => feirante.id === feiranteId);
  };

  const getProduto = (
    feiraId: string,
    feiranteId: string,
    produtoId: string
  ): Produto | undefined => {
    const feirante = getFeirante(feiraId, feiranteId);
    return feirante?.produtos.find((produto) => produto.id === produtoId);
  };

  const getCesta = (cestaId: string): Cesta | undefined => {
    for (const feira of state.feiras) {
      for (const feirante of feira.feirantes) {
        const cesta = feirante.cestas.find((c) => c.id === cestaId);
        if (cesta) return cesta;
      }
    }
    return undefined;
  };

  const getAllCestas = (): Cesta[] => {
    const cestas: Cesta[] = [];
    state.feiras.forEach((feira) => {
      feira.feirantes.forEach((feirante) => {
        cestas.push(...feirante.cestas);
      });
    });
    return cestas;
  };

  const getAllProdutos = (): Produto[] => {
    const produtos: Produto[] = [];
    state.feiras.forEach((feira) => {
      feira.feirantes.forEach((feirante) => {
        produtos.push(...feirante.produtos);
      });
    });
    return produtos;
  };

  const contextValue = {
    state,
    dispatch,
    getFeira,
    getFeirante,
    getProduto,
    getCesta,
    getAllCestas,
    getAllProdutos,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}

// Hook
export function useApp() {
  const context = useContext(AppContext);

  // Se o context não está disponível, retornar um fallback temporário
  if (context === undefined) {
    console.warn(
      "useApp foi chamado fora do AppProvider - usando dados temporários"
    );

    // Dados temporários básicos para evitar crash
    const fallbackState = {
      feiras: [],
      cestasRecorrentes: [],
      categorias: ["Todos", "Frutas", "Verduras", "Legumes"],
      carrinho: [],
    };

    const fallbackFunctions = {
      state: fallbackState,
      dispatch: () => {},
      getFeira: () => undefined,
      getFeirante: () => undefined,
      getProduto: () => undefined,
      getCesta: () => undefined,
      getAllCestas: () => [],
      getAllProdutos: () => [],
    };

    return fallbackFunctions;
  }

  return context;
}
