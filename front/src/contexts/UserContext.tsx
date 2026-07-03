import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert } from "react-native";
import { ApiError, enderecosService } from "../services/enderecos";
import type { EnderecoUsuario } from "../types/api";

// Tenta importar AsyncStorage se estiver disponível
let AsyncStorage: any = null;
try {
  // eslint-disable-next-line import/no-extraneous-dependencies
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch (e) {
  console.warn(
    "AsyncStorage não encontrado. Persistência local ficará desabilitada.",
  );
}

/**
 * Conta do cliente — APENAS dados pessoais.
 * Endereços ficam em `EnderecoUsuario` (tabela própria), expostos no
 * contexto via `enderecos` e `enderecoAtual`. Quem precisa de lat/lng,
 * bairro, cep etc. deve ler do endereço atual, NÃO do user.
 */
export interface User {
  id?: string;
  nome: string;
  email: string;
  token?: string;
  nivel?: any;
  telefone?: string;
  /** Avatar local (base64 ou URL). Não persiste no banco ainda. */
  avatar?: string | null;
  membro_desde?: string;
  pedidos_realizados?: number;
  feira_favorita?: string;
  pedidos?: Pedido[];
}

export interface Pedido {
  id: string;
  data: string;
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

  // ─── Endereços ──────────────────────────────────────────────────────────
  /** Lista completa de endereços cadastrados pelo usuário. */
  enderecos: EnderecoUsuario[];
  /** Endereço atualmente "selecionado" (do dropdown do header). */
  enderecoAtual: EnderecoUsuario | null;
  /** ID do endereço selecionado pelo cliente (persistido em AsyncStorage). */
  enderecoSelecionadoId: number | null;
  /** Troca o endereço selecionado (persiste em AsyncStorage). */
  setEnderecoSelecionado: (id: number | null) => void;
  /** Recarrega a lista de endereços da API (após criar/editar/excluir). */
  recarregarEnderecos: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

const STORAGE_KEY = "@feiro:user";
const ENDERECO_KEY = "@feiro:enderecoSelecionadoId";
const API_BASE =
  (process.env.EXPO_PUBLIC_API_URL as string) ||
  (process.env.API_URL as string) ||
  (process.env.REACT_APP_API_URL as string) ||
  "";

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [enderecos, setEnderecos] = useState<EnderecoUsuario[]>([]);
  const [enderecoSelecionadoId, setEnderecoSelecionadoState] = useState<
    number | null
  >(null);

  // ── Carga inicial ────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      if (AsyncStorage) {
        try {
          const raw = await AsyncStorage.getItem(STORAGE_KEY);
          if (raw) setUserState(JSON.parse(raw));
          const endRaw = await AsyncStorage.getItem(ENDERECO_KEY);
          if (endRaw) {
            const n = Number(endRaw);
            if (Number.isFinite(n) && n > 0) setEnderecoSelecionadoState(n);
          }
        } catch (e) {
          console.warn("Falha ao carregar usuário:", e);
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

  // ── Endereços ────────────────────────────────────────────────────────────

  const recarregarEnderecos = useCallback(async () => {
    if (!user?.id || !user?.token) {
      setEnderecos([]);
      return;
    }
    try {
      const lista = await enderecosService.listar(user.token, user.id);
      setEnderecos(lista);
      // Sincroniza a seleção: se ainda não há nada selecionado, usa o principal.
      if (enderecoSelecionadoId == null) {
        const principal = lista.find((e) => e.principal);
        if (principal) {
          setEnderecoSelecionadoState(principal.id);
          if (AsyncStorage) {
            AsyncStorage.setItem(ENDERECO_KEY, String(principal.id)).catch(
              () => {},
            );
          }
        }
      } else {
        // Se o selecionado foi apagado, faz fallback pro principal.
        const aindaExiste = lista.some((e) => e.id === enderecoSelecionadoId);
        if (!aindaExiste) {
          const proximo = lista.find((e) => e.principal) ?? lista[0] ?? null;
          setEnderecoSelecionadoState(proximo?.id ?? null);
          if (AsyncStorage) {
            if (proximo) {
              AsyncStorage.setItem(ENDERECO_KEY, String(proximo.id)).catch(
                () => {},
              );
            } else {
              AsyncStorage.removeItem(ENDERECO_KEY).catch(() => {});
            }
          }
        }
      }
    } catch (e) {
      console.warn("[UserContext] Falha ao listar endereços:", e);
      // Sessão inválida/expirada: limpa em silêncio para o app voltar ao
      // estado deslogado, em vez de insistir num endpoint autenticado.
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        setUserState(null);
        persist(null);
        setEnderecos([]);
        setEnderecoSelecionadoState(null);
        if (AsyncStorage) {
          AsyncStorage.removeItem(ENDERECO_KEY).catch(() => {});
        }
      }
    }
  }, [user?.id, user?.token, enderecoSelecionadoId]);

  // Recarrega endereços sempre que o user mudar (login/logout)
  useEffect(() => {
    recarregarEnderecos();
  }, [user?.id, user?.token]);

  const setEnderecoSelecionado = (id: number | null) => {
    setEnderecoSelecionadoState(id);
    if (!AsyncStorage) return;
    if (id == null) {
      AsyncStorage.removeItem(ENDERECO_KEY).catch(() => {});
    } else {
      AsyncStorage.setItem(ENDERECO_KEY, String(id)).catch(() => {});
    }
  };

  // Endereço efetivamente em uso — derivado da lista + seleção
  const enderecoAtual = useMemo<EnderecoUsuario | null>(() => {
    if (enderecos.length === 0) return null;
    if (enderecoSelecionadoId != null) {
      const m = enderecos.find((e) => e.id === enderecoSelecionadoId);
      if (m) return m;
    }
    return enderecos.find((e) => e.principal) ?? enderecos[0] ?? null;
  }, [enderecos, enderecoSelecionadoId]);

  // ── Atualização do perfil ────────────────────────────────────────────────

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

    // PUT /usuarios agora só aceita perfil pessoal — endereço fica em /enderecos.
    const camposApi = ["nome", "email", "telefone", "senha"] as const;
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
      console.warn("[UserContext.updateUser] API erro:", {
        status: res.status,
        body,
      });
      const detalhes = (body as any)?.erro ?? body;
      let msg = `Erro ${res.status} ao atualizar perfil`;
      if (typeof detalhes === "string") {
        msg = detalhes;
      } else if (
        detalhes &&
        typeof detalhes === "object" &&
        !Array.isArray(detalhes)
      ) {
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

    const merged: User = {
      ...(user || {}),
      ...(body || {}),
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
    setEnderecos([]);
    setEnderecoSelecionadoState(null);
    if (AsyncStorage) {
      AsyncStorage.removeItem(ENDERECO_KEY).catch(() => {});
    }
    Alert.alert("Sucesso", "Você saiu da sua conta");
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        updateUser,
        setUser,
        logout,
        enderecos,
        enderecoAtual,
        enderecoSelecionadoId,
        setEnderecoSelecionado,
        recarregarEnderecos,
      }}
    >
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
