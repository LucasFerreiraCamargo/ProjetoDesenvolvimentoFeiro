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

export default function Usuarios() {
  // Só Superadmin (nivel 3) gerencia usuários
  useAdminGuard(3)
  useAdminTitulo('Usuários')
  const { admin } = useAdmin()
  const router = useRouter()

  const [usuarios, setUsuarios] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
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

  const formatarData = (d: string) => {
    if (!d) return ''
    try { return new Date(d).toLocaleDateString('pt-BR') } catch { return d }
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
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTopo}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={24} color="#255336" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nome}>{item.nome}</Text>
                  <Text style={styles.email}>{item.email}</Text>
                  <Text style={styles.sub}>
                    {item.telefone ? `${item.telefone} · ` : ''}
                    {item.bairro ?? item.endereco ?? ''}
                  </Text>
                  <Text style={styles.data}>
                    Cadastrado: {formatarData(item.created_at ?? item.membro_desde)}
                  </Text>
                </View>
              </View>
              <View style={styles.cardAcoes}>
                <TouchableOpacity
                  style={styles.botaoVer}
                  onPress={() => router.push(`/admin/usuarios/${item.id}` as any)}
                >
                  <Text style={styles.botaoVerText}>Ver Perfil</Text>
                </TouchableOpacity>
                {admin?.nivel === 3 && (
                  <TouchableOpacity
                    style={styles.botaoExcluir}
                    onPress={() => setDeleteId(item.id)}
                  >
                    <Ionicons name="trash" size={16} color="#DC2626" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      )}

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
  cardTopo: { flexDirection: 'row', gap: 12, marginBottom: 12 },
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
  data: { fontSize: 12, fontFamily: 'Poppins-Regular', color: '#999999' },
  cardAcoes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 12,
  },
  botaoVer: {
    borderWidth: 1,
    borderColor: '#255336',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
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
