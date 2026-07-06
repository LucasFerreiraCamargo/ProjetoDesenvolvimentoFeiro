import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import ConfirmModal from '../../../components/admin/ConfirmModal'
import { useAdmin, useAdminGuard, useAdminTitulo } from '../../../contexts/AdminContext'
import { adminFetch } from '../../../utils/adminApi'

// Convenção do projeto: 1 = Cliente, 2 = Feirante, 3 = Superadmin.
const NIVEIS = [
  { valor: 1, label: 'Cliente', cor: '#6B7280', bg: '#F3F4F6' },
  { valor: 2, label: 'Feirante', cor: '#255336', bg: '#E8F5E8' },
  { valor: 3, label: 'Superadmin', cor: '#92400E', bg: '#FEF3C7' },
] as const

type Usuario = {
  id: string
  nome: string
  email: string
  telefone?: string
  nivel: number
  feirantes?: { id: number }[]
}

type Pendente = { usuario: Usuario; nivelNovo: number } | null

export default function Usuarios() {
  // Só Superadmin (nivel 3) gerencia usuários
  useAdminGuard(3)
  useAdminTitulo('Usuários')
  const { admin } = useAdmin()
  const router = useRouter()

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  // Alteração de nível (fluxo separado do de exclusão).
  const [pendente, setPendente] = useState<Pendente>(null)
  const [salvando, setSalvando] = useState(false)
  const buscaTimeout = useRef<any>(null)

  useEffect(() => { fetchUsuarios() }, [])

  async function fetchUsuarios(termo?: string) {
    setLoading(true)
    try {
      const path = termo ? `/usuarios/pesquisa/${encodeURIComponent(termo)}` : '/usuarios'
      const res = await adminFetch(path, undefined, admin!.token)
      const data = await res.json()
      setUsuarios(Array.isArray(data) ? data : [])
    } catch { alert('Erro ao carregar usuários') }
    setLoading(false)
  }

  function handleBusca(texto: string) {
    setBusca(texto)
    clearTimeout(buscaTimeout.current)
    buscaTimeout.current = setTimeout(() => {
      fetchUsuarios(texto || undefined)
    }, 500)
  }

  async function deletar() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await adminFetch(`/usuarios/${deleteId}`, { method: 'DELETE' }, admin!.token)
      setUsuarios((prev) => prev.filter((u) => u.id !== deleteId))
    } catch { alert('Erro ao excluir usuário') }
    setDeleting(false)
    setDeleteId(null)
  }

  async function confirmarNivel() {
    if (!pendente) return
    const { usuario, nivelNovo } = pendente
    setSalvando(true)
    try {
      const res = await adminFetch(
        `/usuarios/${usuario.id}/nivel`,
        { method: 'PATCH', body: JSON.stringify({ nivel: nivelNovo }) },
        admin!.token,
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(data?.erro || 'Não foi possível alterar o nível.')
      } else {
        // Atualiza localmente: novo nível e, se veio, a banca recém-vinculada.
        setUsuarios((prev) =>
          prev.map((u) =>
            u.id === usuario.id
              ? {
                  ...u,
                  nivel: nivelNovo,
                  feirantes:
                    data?.feiranteId != null
                      ? [{ id: Number(data.feiranteId) }]
                      : u.feirantes,
                }
              : u,
          ),
        )
      }
    } catch { alert('Erro de conexão ao alterar o nível.') }
    setSalvando(false)
    setPendente(null)
  }

  function mensagemNivel(p: Pendente): string {
    if (!p) return ''
    const labelNovo = NIVEIS.find((n) => n.valor === p.nivelNovo)?.label ?? ''
    const jaTemBanca = (p.usuario.feirantes?.length ?? 0) > 0
    let msg = `Alterar "${p.usuario.nome}" para ${labelNovo}?`
    if (p.nivelNovo === 2 && !jaTemBanca) {
      msg +=
        '\n\nUma banca será criada e vinculada automaticamente a este usuário. ' +
        'O feirante poderá ajustar os dados no próprio perfil.'
    }
    return msg
  }

  return (
    <View style={styles.container}>
      <View style={styles.topo}>
        <View style={styles.buscaContainer}>
          <Ionicons name="search" size={18} color="#999" />
          <TextInput
            style={styles.buscaInput}
            placeholder="Buscar usuário..."
            placeholderTextColor="#999"
            value={busca}
            onChangeText={handleBusca}
            autoCapitalize="none"
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#255336" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={usuarios}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <Text style={styles.vazio}>Nenhum usuário encontrado.</Text>
          }
          renderItem={({ item }) => {
            const nivelInfo = NIVEIS.find((n) => n.valor === item.nivel) ?? NIVEIS[0]
            const souEu = String(item.id) === String(admin?.id)
            const temBanca = (item.feirantes?.length ?? 0) > 0
            return (
              <View style={styles.card}>
                <View style={styles.cardTopo}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={24} color="#255336" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nome} numberOfLines={1}>{item.nome}</Text>
                    <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
                    {item.telefone ? (
                      <Text style={styles.sub}>{item.telefone}</Text>
                    ) : null}
                  </View>
                  <View style={[styles.badge, { backgroundColor: nivelInfo.bg }]}>
                    <Text style={[styles.badgeText, { color: nivelInfo.cor }]}>
                      {nivelInfo.label}
                    </Text>
                  </View>
                </View>

                {item.nivel === 2 && temBanca ? (
                  <View style={styles.vinculo}>
                    <Ionicons name="storefront" size={13} color="#255336" />
                    <Text style={styles.vinculoText}>Banca vinculada</Text>
                  </View>
                ) : null}

                <Text style={styles.rotuloNivel}>Nível de acesso</Text>
                <View style={styles.segment}>
                  {NIVEIS.map((n) => {
                    const ativo = item.nivel === n.valor
                    return (
                      <TouchableOpacity
                        key={n.valor}
                        disabled={ativo || souEu}
                        style={[
                          styles.segBtn,
                          ativo && styles.segBtnAtivo,
                          souEu && !ativo && styles.segBtnDisabled,
                        ]}
                        onPress={() => setPendente({ usuario: item, nivelNovo: n.valor })}
                      >
                        <Text style={[styles.segText, ativo && styles.segTextAtivo]}>
                          {n.label}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>

                <View style={styles.cardAcoes}>
                  {souEu ? (
                    <Text style={styles.aviso}>
                      Você não pode alterar o seu próprio nível.
                    </Text>
                  ) : (
                    <View />
                  )}
                  <TouchableOpacity
                    style={styles.botaoVer}
                    onPress={() => router.push(`/admin/usuarios/${item.id}` as any)}
                  >
                    <Text style={styles.botaoVerText}>Ver Perfil</Text>
                  </TouchableOpacity>
                  {!souEu && (
                    <TouchableOpacity
                      style={styles.botaoExcluir}
                      onPress={() => setDeleteId(item.id)}
                    >
                      <Ionicons name="trash" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )
          }}
        />
      )}

      <ConfirmModal
        visible={pendente !== null}
        titulo="Alterar nível de acesso"
        mensagem={mensagemNivel(pendente)}
        confirmLabel="Confirmar"
        loading={salvando}
        onConfirm={confirmarNivel}
        onCancel={() => setPendente(null)}
      />

      <ConfirmModal
        visible={deleteId !== null}
        titulo="Excluir Usuário"
        mensagem="Tem certeza que deseja excluir este usuário?"
        confirmLabel="Excluir"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={deletar}
        onCancel={() => setDeleteId(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7E4' },
  topo: { padding: 16 },
  buscaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  buscaInput: { flex: 1, fontSize: 14, fontFamily: 'Poppins-Regular', color: '#333333' },
  lista: { paddingHorizontal: 16, paddingBottom: 32 },
  vazio: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
    fontFamily: 'Poppins-Regular',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 1,
  },
  cardTopo: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nome: { fontSize: 16, fontFamily: 'Poppins-SemiBold', color: '#333333' },
  email: { fontSize: 14, fontFamily: 'Poppins-Regular', color: '#666666' },
  sub: { fontSize: 13, fontFamily: 'Poppins-Regular', color: '#666666' },
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontFamily: 'Poppins-SemiBold' },
  vinculo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  vinculoText: { fontSize: 12, fontFamily: 'Poppins-Regular', color: '#255336' },
  rotuloNivel: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#999999',
    marginTop: 14,
    marginBottom: 8,
  },
  segment: { flexDirection: 'row', gap: 8 },
  segBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#255336',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  segBtnAtivo: { backgroundColor: '#255336' },
  segBtnDisabled: { borderColor: '#CBD5CB', opacity: 0.5 },
  segText: { fontSize: 12, fontFamily: 'Poppins-SemiBold', color: '#255336' },
  segTextAtivo: { color: '#FFFFFF' },
  cardAcoes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 12,
    marginTop: 14,
  },
  aviso: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#999999',
  },
  botaoVer: {
    borderWidth: 1,
    borderColor: '#255336',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 'auto',
  },
  botaoVerText: { fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#255336' },
  botaoExcluir: {
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
})
