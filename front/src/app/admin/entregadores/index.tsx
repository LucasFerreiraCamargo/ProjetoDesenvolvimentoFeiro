import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import ConfirmModal from '../../../components/admin/ConfirmModal'
import { useAdmin, useAdminGuard, useAdminTitulo } from '../../../contexts/AdminContext'
import { entregadoresService } from '../../../services/entregadores'
import type { Entregador } from '../../../types/api'

export default function EntregadoresLista() {
  useAdminGuard(2)
  useAdminTitulo('Entregadores')
  const { admin } = useAdmin()
  const router = useRouter()

  const [entregadores, setEntregadores] = useState<Entregador[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const carregar = useCallback(async () => {
    if (!admin?.token) return
    setLoading(true)
    try {
      const lista = await entregadoresService.listar(admin.token)
      setEntregadores(lista)
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível carregar entregadores')
    } finally {
      setLoading(false)
    }
  }, [admin?.token])

  // Recarrega ao focar a tela (após criar/editar entregador)
  useFocusEffect(
    useCallback(() => {
      carregar()
    }, [carregar]),
  )

  async function alternarAtivo(item: Entregador) {
    if (!admin?.token) return
    setTogglingId(item.id)
    try {
      const atualizado = await entregadoresService.patch(admin.token, item.id, {
        ativo: !item.ativo,
      })
      setEntregadores((prev) =>
        prev.map((e) => (e.id === item.id ? { ...e, ativo: atualizado.ativo } : e)),
      )
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível alternar o status')
    } finally {
      setTogglingId(null)
    }
  }

  async function confirmarRemocao() {
    if (deleteId == null || !admin?.token) return
    setDeleting(true)
    try {
      await entregadoresService.remover(admin.token, deleteId)
      setEntregadores((prev) => prev.filter((e) => e.id !== deleteId))
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível remover')
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const termo = busca.trim().toLowerCase()
  const filtrados = termo
    ? entregadores.filter(
        (e) =>
          e.nome.toLowerCase().includes(termo) ||
          (e.email ?? '').toLowerCase().includes(termo) ||
          (e.telefone ?? '').includes(termo) ||
          (e.placa ?? '').toLowerCase().includes(termo),
      )
    : entregadores

  return (
    <View style={styles.container}>
      <View style={styles.topo}>
        <View style={styles.buscaContainer}>
          <Ionicons name="search" size={18} color="#999" />
          <TextInput
            style={styles.buscaInput}
            placeholder="Buscar entregador..."
            placeholderTextColor="#999"
            value={busca}
            onChangeText={setBusca}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={styles.botaoNovo}
          onPress={() => router.push('/admin/entregadores/novo' as any)}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.botaoNovoText}>Novo Entregador</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#255336" style={{ marginTop: 40 }} />
      ) : filtrados.length === 0 ? (
        <View style={styles.vazio}>
          <Ionicons name="person-outline" size={48} color="#CCC" />
          <Text style={styles.vazioTexto}>
            {entregadores.length === 0
              ? 'Nenhum entregador cadastrado ainda.'
              : 'Nenhum resultado para essa busca.'}
          </Text>
          {entregadores.length === 0 && (
            <TouchableOpacity
              style={styles.botaoNovo}
              onPress={() => router.push('/admin/entregadores/novo' as any)}
            >
              <Text style={styles.botaoNovoText}>Cadastrar primeiro entregador</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtrados}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.cardCorpo}
                onPress={() => router.push(`/admin/entregadores/${item.id}` as any)}
                activeOpacity={0.7}
              >
                <View style={styles.avatarCirc}>
                  <Ionicons
                    name={
                      item.veiculo === 'moto'
                        ? 'bicycle'
                        : item.veiculo === 'carro'
                        ? 'car'
                        : 'person'
                    }
                    size={24}
                    color="#255336"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.linhaTopo}>
                    <Text style={styles.nome}>{item.nome}</Text>
                    {!item.ativo && (
                      <View style={styles.tagInativo}>
                        <Text style={styles.tagInativoText}>Inativo</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.sub}>{formataTelefone(item.telefone)}</Text>
                  <Text style={styles.sub}>
                    {[item.veiculo, item.placa].filter(Boolean).join(' • ') || 'Sem veículo'}
                  </Text>
                  {admin?.nivel === 3 && item.feirante && (
                    <Text style={styles.feirante}>
                      Feirante: {item.feirante.nome}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.cardAcoes}>
                <View style={styles.switchWrap}>
                  <Text style={styles.switchLabel}>Ativo</Text>
                  {togglingId === item.id ? (
                    <ActivityIndicator size="small" color="#255336" />
                  ) : (
                    <Switch
                      value={item.ativo}
                      onValueChange={() => alternarAtivo(item)}
                      trackColor={{ false: '#DDD', true: '#A7D8B5' }}
                      thumbColor={item.ativo ? '#255336' : '#999'}
                    />
                  )}
                </View>
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
        titulo="Excluir Entregador"
        mensagem="Tem certeza? Esta ação não pode ser desfeita. Se o entregador tem rotas vinculadas, prefira desativá-lo."
        confirmLabel="Excluir"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={confirmarRemocao}
        onCancel={() => setDeleteId(null)}
      />
    </View>
  )
}

/** Formata telefone BR: 51998765432 → (51) 99876-5432 */
function formataTelefone(tel: string): string {
  const d = (tel || '').replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return tel
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
    paddingHorizontal: 16,
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
  cardCorpo: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'center' },
  avatarCirc: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linhaTopo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  nome: { fontSize: 16, fontFamily: 'Poppins-SemiBold', color: '#333333', flex: 1 },
  sub: { fontSize: 13, fontFamily: 'Poppins-Regular', color: '#666666' },
  feirante: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#999999',
    fontStyle: 'italic',
  },
  tagInativo: {
    backgroundColor: '#FEE2E2',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagInativoText: {
    fontSize: 11,
    fontFamily: 'Poppins-SemiBold',
    color: '#DC2626',
  },
  cardAcoes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 12,
  },
  switchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { fontSize: 13, fontFamily: 'Poppins-Regular', color: '#333' },
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
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  vazioTexto: { fontSize: 14, color: '#999', textAlign: 'center' },
})
