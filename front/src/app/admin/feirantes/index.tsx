import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
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
import StatusBadge from '../../../components/admin/StatusBadge'
import { useAdmin, useAdminGuard, useAdminTitulo } from '../../../contexts/AdminContext'
import { adminFetch } from '../../../utils/adminApi'

type FiltroStatus = 'Todos' | 'Aberto' | 'Fechado'

export default function Feirantes() {
  // Só Superadmin (nivel 3) gerencia feirantes
  useAdminGuard(3)
  useAdminTitulo('Feirantes')
  const { admin } = useAdmin()
  const router = useRouter()

  const [feirantes, setFeirantes] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<FiltroStatus>('Todos')
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { fetchFeirantes() }, [])

  async function fetchFeirantes() {
    setLoading(true)
    try {
      const res = await adminFetch('/feirantes', undefined, admin!.token)
      const data = await res.json()
      setFeirantes(Array.isArray(data) ? data : [])
    } catch { alert('Erro ao carregar feirantes') }
    setLoading(false)
  }

  async function deletar() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await adminFetch(`/feirantes/${deleteId}`, { method: 'DELETE' }, admin!.token)
      setFeirantes((prev) => prev.filter((f) => f.id !== deleteId))
    } catch { alert('Erro ao excluir feirante') }
    setDeleting(false)
    setDeleteId(null)
  }

  const filtrados = feirantes.filter((f) => {
    const matchBusca = f.nome?.toLowerCase().includes(busca.toLowerCase())
    const matchFiltro = filtro === 'Todos' || f.status === filtro
    return matchBusca && matchFiltro
  })

  return (
    <View style={styles.container}>
      <View style={styles.topo}>
        <View style={styles.buscaContainer}>
          <Ionicons name="search" size={18} color="#999" />
          <TextInput
            style={styles.buscaInput}
            placeholder="Buscar feirante..."
            placeholderTextColor="#999"
            value={busca}
            onChangeText={setBusca}
          />
        </View>

        {admin?.nivel === 3 && (
          <TouchableOpacity
            style={styles.botaoNovo}
            onPress={() => router.push('/admin/feirantes/novo' as any)}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.botaoNovoText}>Novo Feirante</Text>
          </TouchableOpacity>
        )}

        <View style={styles.filtros}>
          {(['Todos', 'Aberto', 'Fechado'] as FiltroStatus[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filtroBtn, filtro === f && styles.filtroBtnAtivo]}
              onPress={() => setFiltro(f)}
            >
              <Text style={[styles.filtroText, filtro === f && styles.filtroTextAtivo]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#255336" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtrados}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTopo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarEmoji}>🧑‍🌾</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nome}>{item.nome}</Text>
                  <Text style={styles.sub}>
                    {item.banca} · {item.feira?.nome ?? ''}
                  </Text>
                  {item.avaliacao ? (
                    <Text style={styles.avaliacao}>⭐ {item.avaliacao}</Text>
                  ) : null}
                  <Text style={styles.especialidade}>{item.especialidade}</Text>
                </View>
              </View>
              <View style={styles.cardAcoes}>
                <StatusBadge status={item.status ?? 'Fechado'} />
                <TouchableOpacity
                  style={styles.botaoEditar}
                  onPress={() => router.push(`/admin/feirantes/${item.id}` as any)}
                >
                  <Ionicons name="pencil" size={16} color="#255336" />
                  <Text style={styles.botaoEditarText}>Editar</Text>
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
        titulo="Excluir Feirante"
        mensagem="Tem certeza que deseja excluir este feirante?"
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
  topo: { padding: 16, gap: 12 },
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
  botaoNovo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#255336',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  botaoNovoText: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#FFFFFF' },
  filtros: { flexDirection: 'row', gap: 8 },
  filtroBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#255336',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  filtroBtnAtivo: { backgroundColor: '#255336' },
  filtroText: { fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#255336' },
  filtroTextAtivo: { color: '#FFFFFF' },
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
  avatarEmoji: { fontSize: 24 },
  nome: { fontSize: 16, fontFamily: 'Poppins-SemiBold', color: '#333333' },
  sub: { fontSize: 14, fontFamily: 'Poppins-Regular', color: '#666666' },
  avaliacao: { fontSize: 13, fontFamily: 'Poppins-Regular', color: '#666666' },
  especialidade: { fontSize: 13, fontFamily: 'Poppins-Regular', color: '#999999' },
  cardAcoes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 12,
  },
  botaoEditar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#255336',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 'auto',
  },
  botaoEditarText: { fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#255336' },
  botaoExcluir: {
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
})
