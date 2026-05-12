import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
// Tenta importar AsyncStorage se estiver disponível
let AsyncStorage: any = null;
try {
  // eslint-disable-next-line import/no-extraneous-dependencies
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch (e) {
  console.warn("AsyncStorage não encontrado. Persistência local ficará desabilitada.");
}

export interface User {
  id?: string;
  nome: string;
  email: string;
  token?: string;
  nivel?: any;
  telefone?: string;
  endereco?: string;
  avatar?: string | null; // url ou base64
  membro_desde?: string;
  pedidos_realizados?: number;
  feira_favorita?: string;
  pedidos?: Pedido[];
}

export interface Pedido {
  id: string;
  data: string; // ISO ou formato legível
  total: number;
  status: "Pendente" | "Em andamento" | "Concluído" | "Cancelado";
  itens: { id: string; nome: string; quantidade: number; preco: number }[];
}

interface UserContextValue {
  user: User | null;
  loading: boolean;
  updateUser: (patch: Partial<User>) => Promise<User>;
  setUser: (u: User | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

const STORAGE_KEY = "@feiro:user";
const API_BASE =
  // Variáveis comuns: EXPO_PUBLIC_API_URL (Expo), API_URL, REACT_APP_API_URL
  (process.env.EXPO_PUBLIC_API_URL as string) || (process.env.API_URL as string) || (process.env.REACT_APP_API_URL as string) || "";
const API_TOKEN = (process.env.EXPO_PUBLIC_API_TOKEN as string) || (process.env.API_TOKEN as string) || "";

async function tryGet(url: string) {
  try {
    const res = await fetch(url, {
      headers: API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : undefined,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json;
  } catch (e) {
    return null;
  }
}

async function tryPostOrPut(url: string, method: string, body: any) {
  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (AsyncStorage) {
        try {
          const raw = await AsyncStorage.getItem(STORAGE_KEY);
          if (raw) setUserState(JSON.parse(raw));
        } catch (e) {
          console.warn("Falha ao carregar usuário:", e);
        }
      }
      // Após carregar do storage, tentar sincronizar com API se configurada
      if (API_BASE) {
        // tentar endpoints comuns para obter usuário
        const userEndpoints = ["/me", "/users/me", "/user"];
        let apiUser = null as any;
        for (const ep of userEndpoints) {
          apiUser = await tryGet(API_BASE.replace(/\/$/, "") + ep);
          if (apiUser) break;
        }

        if (apiUser) {
          // se trouxe pedidos embutidos ou separados, normalize
          setUserState((prev) => ({ ...(prev || {}), ...(apiUser || {}) } as User));
          // se a API não retornou pedidos embutidos, tentar buscar endpoints comuns de pedidos
          if (!apiUser.pedidos) {
            const ordersEndpoints = ["/orders", "/pedidos", "/me/pedidos", "/users/me/pedidos", "/users/1/pedidos"];
            let fetchedOrders = null as any;
            for (const ep of ordersEndpoints) {
              fetchedOrders = await tryGet(API_BASE.replace(/\/$/, "") + ep);
              if (fetchedOrders) break;
            }
            if (fetchedOrders) {
              setUserState((prev) => ({ ...(prev || {}), pedidos: fetchedOrders } as User));
            }
          }
        } else {
          // tentar obter pedidos e perfil separados (se já tivermos id)
        }
      }

      setLoading(false);
    }
    load();
  }, []);

  const persist = async (u: User | null) => {
    if (!AsyncStorage) return;
    try {
      if (u) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      else await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Falha ao persistir usuário:", e);
    }
  };

  const setUser = (u: User | null) => {
    setUserState(u);
    persist(u);
  };

  const updateUser = async (patch: Partial<User>) => {
    if (!user || !user.id) {
      throw new Error("Você precisa estar logado para atualizar o perfil.");
    }
    if (!user.token) {
      throw new Error("Sua sessão expirou. Faça login novamente.");
    }
    if (!API_BASE) {
      throw new Error("API_BASE não configurada (EXPO_PUBLIC_API_URL).");
    }

    // Constrói payload limpo: só envia campos que o usuário realmente forneceu.
    // (Campos cosméticos como `avatar` ainda não existem no banco; preservados localmente.)
    const camposApi = ["nome", "email", "telefone", "endereco", "bairro", "senha"] as const;
    const payloadApi: Record<string, any> = {};
    for (const k of camposApi) {
      const v = (patch as any)[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        payloadApi[k] = typeof v === "string" ? v.trim() : v;
      }
    }

    const url = `${API_BASE.replace(/\/$/, "")}/usuarios/${user.id}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify(payloadApi),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.warn("[UserContext.updateUser] API erro:", { status: res.status, body });
      // Formata Zod fieldErrors em mensagem legível
      const detalhes = (body as any)?.erro ?? body;
      let msg = `Erro ${res.status} ao atualizar perfil`;
      if (typeof detalhes === "string") {
        msg = detalhes;
      } else if (detalhes && typeof detalhes === "object" && !Array.isArray(detalhes)) {
        const linhas: string[] = [];
        for (const k of Object.keys(detalhes)) {
          const v = (detalhes as any)[k];
          if (Array.isArray(v)) linhas.push(`${k}: ${v.join(", ")}`);
          else if (typeof v === "string") linhas.push(`${k}: ${v}`);
        }
        if (linhas.length) msg = linhas.join("\n");
      }
      throw new Error(msg);
    }

    // Mescla o que veio da API com campos só-locais (avatar, pedidos, etc.) e o token.
    const merged: User = {
      ...(user || {}),
      ...(body || {}),
      // mantém campos locais não devolvidos pela API
      avatar: (patch as any).avatar ?? user?.avatar,
      token: user.token,
    } as User;

    setUserState(merged);
    await persist(merged);
    return merged;
  };

  const logout = () => {
    setUserState(null);
    persist(null);
    Alert.alert("Sucesso", "Você saiu da sua conta");
  };

  return (
    <UserContext.Provider value={{ user, loading, updateUser, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser deve ser usado dentro de UserProvider");
  return ctx;
}

export default UserProvider;
