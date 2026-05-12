import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import ActionButton from '../../../components/admin/ActionButton'
import ConfirmModal from '../../../components/admin/ConfirmModal'
import StatusBadge from '../../../components/admin/StatusBadge'
import { useAdmin, useAdminGuard, useAdminTitulo } from '../../../contexts/AdminContext'
import { adminFetch } from '../../../utils/adminApi'

export default function Feiras() {
  useAdminGuard(3)
  useAdminTitulo('Feiras')
  const { admin } = useAdmin()
  const router = useRouter()

  const [feiras, setFeiras] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchFeiras()
  }, [])

  async function fetchFeiras() {
    setLoading(true)
    try {
      const res = await adminFetch('/feiras', undefined, admin!.token)
      const data = await res.json()
      setFeiras(Array.isArray(data) ? data : [])
    } catch {
      alert('Erro ao carregar feiras')
    }
    setLoading(false)
  }

  async function toggleStatus(id: number, atual: string) {
    const novo = atual === 'Aberto' ? 'Fechado' : 'Aberto'
    try {
      await adminFetch(`/feiras/${id}`, { method: 'PATCH', body: JSON.stringify({ status: novo }) }, admin!.token)
      setFeiras((prev) => prev.map((f) => (f.id === id ? { ...f, status: novo } : f)))
    } catch {
      alert('Erro ao atualizar status')
    }
  }

  async function deletarFeira() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await adminFetch(`/feiras/${deleteId}`, { method: 'DELETE' }, admin!.token)
      setFeiras((prev) => prev.filter((f) => f.id !== deleteId))
    } catch {
      alert('Erro ao excluir feira')
    }
    setDeleting(false)
    setDeleteId(null)
  }

  const filtradas = feiras.filter((f) =>
    f.nome?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <View style={styles.container}>
      <View style={styles.topo}>
        <View style={styles.buscaContainer}>
          <Ionicons name="search" size={18} color="#999" />
          <TextInput
            style={styles.buscaInput}
            placeholder="Buscar feira..."
            placeholderTextColor="#999"
            value={busca}
            onChangeText={setBusca}
          />
        </View>

        <ActionButton
          label="+ Nova Feira"
          onPress={() => router.push('/admin/feiras/novo' as any)}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#255336" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtradas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTopo}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardNome}>{item.nome}</Text>
                  <Text style={styles.cardEndereco}>{item.endereco}</Text>
                  <Text style={styles.cardDetalhe}>
                    ⏰ {item.horario}{'   '}
                    📍 {item.feirantes?.length ?? 0} feirantes
                  </Text>
                </View>
                <StatusBadge status={item.status ?? 'Fechado'} />
              </View>

              <View style={styles.cardAcoes}>
                <Switch
                  value={item.status === 'Aberto'}
                  onValueChange={() => toggleStatus(item.id, item.status)}
                  trackColor={{ false: '#DDD', true: '#255336' }}
                  thumbColor="#FFF"
                />
                <TouchableOpacity
                  style={styles.botaoEditar}
                  onPress={() => router.push(`/admin/feiras/${item.id}` as any)}
                >
                  <Ionicons name="pencil" size={16} color="#255336" />
                  <Text style={styles.botaoEditarText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.botaoExcluir}
                  onPress={() => setDeleteId(item.id)}
                >
                  <Ionicons name="trash" size={16} color="#DC2626" />
                  <Text style={styles.botaoExcluirText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <ConfirmModal
        visible={deleteId !== null}
        titulo="Excluir Feira"
        mensagem="Tem certeza que deseja excluir esta feira? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={deletarFeira}
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
  buscaInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#333333',
  },
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
  cardTopo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  cardNome: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
    marginBottom: 2,
  },
  cardEndereco: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666666',
    marginBottom: 4,
  },
  cardDetalhe: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#666666',
  },
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
  },
  botaoEditarText: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    color: '#255336',
  },
  botaoExcluir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  botaoExcluirText: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    color: '#DC2626',
  },
})
