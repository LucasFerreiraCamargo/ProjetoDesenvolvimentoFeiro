import { useRouter } from 'expo-router'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { useUser } from './UserContext'
import { adminFetch } from '../utils/adminApi'

/**
 * Convenção de níveis do projeto:
 *   nivel 1 = Cliente (menos acesso)
 *   nivel 2 = Feirante / admin parcial
 *   nivel 3 = Superadmin (mais acesso)
 *
 * Regra: número MAIOR = mais permissão.
 *
 * Este Context é um wrapper sobre o UserContext. A autenticação real
 * (token, persistência via AsyncStorage) vive no UserContext. Aqui só
 * expomos o usuário quando ele tem nível de admin (>= 2), para que as
 * telas de /admin/* continuem usando useAdmin() sem precisar lidar com
 * a lógica de autenticação geral.
 */

// Nível mínimo para entrar na área administrativa.
// 2 = feirante (acesso parcial) ou superior.
export const NIVEL_MINIMO_ADMIN_AREA = 2

interface AdminLogado {
  id: string
  nome: string
  email: string
  nivel: 1 | 2 | 3
  token: string
  feiranteId?: number
}

interface AdminContextValue {
  admin: AdminLogado | null
  loading: boolean
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
  /** True se o admin atual tem `nivel >= minNivel`. */
  isNivel: (minNivel: number) => boolean
  titulo: string
  setTitulo: (t: string) => void
}

const AdminContext = createContext<AdminContextValue>({
  admin: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  isNivel: () => false,
  titulo: '',
  setTitulo: () => {},
})

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user, setUser, loading: userLoading, logout: userLogout } = useUser()
  const [titulo, setTitulo] = useState('')
  const [feiranteId, setFeiranteId] = useState<number | undefined>(undefined)
  const [carregandoFeirante, setCarregandoFeirante] = useState(false)

  // Quando o usuário logado é Feirante (nivel === 2), busca o feiranteId associado.
  useEffect(() => {
    let cancelado = false
    async function carregaFeirante() {
      if (!user || user.nivel == null) {
        setFeiranteId(undefined)
        return
      }
      if (Number(user.nivel) !== 2) {
        setFeiranteId(undefined)
        return
      }
      setCarregandoFeirante(true)
      try {
        const res = await adminFetch(
          `/feirantes?adminId=${user.id}`,
          undefined,
          user.token
        )
        if (!res.ok) return
        const feirantes = await res.json()
        const feirante = Array.isArray(feirantes) ? feirantes[0] : feirantes
        if (!cancelado && feirante?.id != null) {
          setFeiranteId(Number(feirante.id))
        }
      } catch (e) {
        console.warn('[AdminContext] Falha ao buscar feirante (ignorado):', e)
      } finally {
        if (!cancelado) setCarregandoFeirante(false)
      }
    }
    carregaFeirante()
    return () => {
      cancelado = true
    }
  }, [user?.id, user?.nivel, user?.token])

  // Deriva o `admin` a partir do `user`. Só é não-nulo se o nível for >= mínimo.
  const admin: AdminLogado | null =
    user && user.nivel != null && Number(user.nivel) >= NIVEL_MINIMO_ADMIN_AREA
      ? {
          id: String(user.id),
          nome: user.nome,
          email: user.email,
          nivel: Number(user.nivel) as 1 | 2 | 3,
          token: user.token ?? '',
          feiranteId,
        }
      : null

  async function login(email: string, senha: string) {
    const API_BASE =
      (process.env.EXPO_PUBLIC_API_URL as string) || 'http://localhost:3001'

    const response = await fetch(`${API_BASE.replace(/\/$/, '')}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.erro || data.error || 'Login ou senha incorretos')
    }

    if (Number(data.nivel) < NIVEL_MINIMO_ADMIN_AREA) {
      throw new Error(
        `Você não tem permissão para acessar a área administrativa. ` +
          `Seu nível: ${data.nivel} (mínimo exigido: ${NIVEL_MINIMO_ADMIN_AREA}).`
      )
    }

    setUser({
      id: data.id,
      nome: data.nome,
      email: data.email,
      token: data.token,
      nivel: data.nivel,
    })
  }

  function logout() {
    setFeiranteId(undefined)
    userLogout()
  }

  function isNivel(minNivel: number) {
    return !!admin && admin.nivel >= minNivel
  }

  return (
    <AdminContext.Provider
      value={{
        admin,
        loading: userLoading || carregandoFeirante,
        login,
        logout,
        isNivel,
        titulo,
        setTitulo,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  return useContext(AdminContext)
}

/**
 * Guarda a tela: redireciona pra /admin/login se o usuário não tem permissão.
 *
 * @param minNivel nível mínimo exigido (lembre: maior = mais acesso).
 *   2 => feirante ou superior (default)
 *   3 => só superadmin
 */
export function useAdminGuard(minNivel = NIVEL_MINIMO_ADMIN_AREA) {
  const { admin, loading } = useAdmin()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!admin || admin.nivel < minNivel) {
      router.replace('/admin/login')
    }
  }, [admin, loading, minNivel])
}

export function useAdminTitulo(titulo: string) {
  const { setTitulo } = useAdmin()
  useEffect(() => {
    setTitulo(titulo)
    return () => setTitulo('')
  }, [titulo])
}
