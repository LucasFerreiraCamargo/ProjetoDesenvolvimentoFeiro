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
import { useAdmin, useAdminGuard, useAdminTitulo } from '../../../contexts/AdminContext'
import { adminFetch } from '../../../utils/adminApi'

export default function Cestas() {
  // Feirante (2) e Superadmin (3) podem acessar
  useAdminGuard(2)
  useAdminTitulo('Cestas')
  const { admin } = useAdmin()
  const router = useRouter()

  const [cestas, setCestas] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { fetchCestas() }, [])

  async function fetchCestas() {
    setLoading(true)
    try {
      const res = await adminFetch('/cestas', undefined, admin!.token)
      const data = await res.json()
      let lista = Array.isArray(data) ? data : []
      // Feirante (nivel 2) só vê as próprias cestas; Superadmin vê todas
      if (admin!.nivel === 2 && admin!.feiranteId) {
        lista = lista.filter((c: any) => c.feirante_id === admin!.feiranteId)
      }
      setCestas(lista)
    } catch { alert('Erro ao carregar cestas') }
    setLoading(false)
  }

  async function deletar() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await adminFetch(`/cestas/${deleteId}`, { method: 'DELETE' }, admin!.token)
      setCestas((prev) => prev.filter((c) => c.id !== deleteId))
    } catch { alert('Erro ao excluir cesta') }
    setDeleting(false)
    setDeleteId(null)
  }

  const filtradas = cestas.filter((c) =>
    c.nome?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <View style={styles.container}>
      <View style={styles.topo}>
        <View style={styles.buscaContainer}>
          <Ionicons name="search" size={18} color="#999" />
          <TextInput
            style={styles.buscaInput}
            placeholder="Buscar cesta..."
            placeholderTextColor="#999"
            value={busca}
            onChangeText={setBusca}
          />
        </View>

        <TouchableOpacity
          style={styles.botaoNovo}
          onPress={() => router.push('/admin/cestas/novo' as any)}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.botaoNovoText}>Nova Cesta</Text>
        </TouchableOpacity>
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
                <Text style={styles.emoji}>{item.emoji ?? '🧺'}</Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.nomeLinha}>
                    <Text style={styles.nome}>{item.nome}</Text>
                    <Text style={styles.preco}>R$ {Number(item.preco).toFixed(2)}</Text>
                  </View>
                  {item.feirante && (
                    <Text style={styles.feirante}>Feirante: {item.feirante.nome}</Text>
                  )}
                  <Text style={styles.sub}>
                    {item.mercadorias?.length ?? 0} itens
                    {item.desconto ? ` · ${item.desconto}` : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.cardAcoes}>
                <TouchableOpacity
                  style={styles.botaoEditar}
                  onPress={() => router.push(`/admin/cestas/${item.id}` as any)}
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
        titulo="Excluir Cesta"
        mensagem="Tem certeza que deseja excluir esta cesta?"
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
  emoji: { fontSize: 32 },
  nomeLinha: { flexDirection: 'row', justifyContent: 'space-between' },
  nome: { fontSize: 16, fontFamily: 'Poppins-SemiBold', color: '#333333', flex: 1 },
  preco: { fontSize: 16, fontFamily: 'Poppins-SemiBold', color: '#255336' },
  feirante: { fontSize: 13, fontFamily: 'Poppins-Regular', color: '#999999' },
  sub: { fontSize: 13, fontFamily: 'Poppins-Regular', color: '#666666' },
  cardAcoes: {
    flexDirection: 'row',
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
  botaoEditarText: { fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#255336' },
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
  botaoExcluirText: { fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#DC2626' },
})
