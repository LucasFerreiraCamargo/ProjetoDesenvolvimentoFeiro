import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import ConfirmModal from '../../../components/admin/ConfirmModal'
import { useAdmin, useAdminGuard, useAdminTitulo } from '../../../contexts/AdminContext'
import { adminFetch } from '../../../utils/adminApi'

const CATEGORIAS = [
  'Todos',
  'FRUTAS',
  'LEGUMES',
  'VERDURAS',
  'TEMPEROS',
  'OVOS',
  'ORGANICOS',
  'CARNES',
  'PEIXES',
  'LATICINIOS',
  'GRAOS',
]

export default function Mercadorias() {
  // Feirante (2) e Superadmin (3) podem acessar
  useAdminGuard(2)
  useAdminTitulo('Mercadorias')
  const { admin } = useAdmin()
  const router = useRouter()

  const [mercadorias, setMercadorias] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('Todos')
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { fetchMercadorias() }, [])

  async function fetchMercadorias() {
    setLoading(true)
    try {
      // Feirante (nivel 2) vê só suas mercadorias; Superadmin (3) vê todas
      const path = admin!.nivel === 2
        ? `/mercadorias/feirantes/${admin!.feiranteId}`
        : '/mercadorias'
      const res = await adminFetch(path, undefined, admin!.token)
      const data = await res.json()
      setMercadorias(Array.isArray(data) ? data : [])
    } catch { alert('Erro ao carregar mercadorias') }
    setLoading(false)
  }

  async function toggleDestaque(id: number, atual: boolean) {
    try {
      await adminFetch(`/mercadorias/${id}`, { method: 'PATCH', body: JSON.stringify({ destaque: !atual }) }, admin!.token)
      setMercadorias((prev) => prev.map((m) => m.id === id ? { ...m, destaque: !atual } : m))
    } catch { alert('Erro ao atualizar destaque') }
  }

  async function deletar() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await adminFetch(
        `/mercadorias/${deleteId}`,
        { method: 'DELETE' },
        admin!.token
      )
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        console.warn('[Mercadorias.deletar] API respondeu erro:', {
          status: res.status,
          body: data,
        })
        // 401/403 = token vencido ou nível insuficiente
        if (res.status === 401 || res.status === 403) {
          alert('Sua sessão expirou ou você não tem permissão. Faça login novamente.')
        }
        // Conflito comum: FK do Prisma (mercadoria está em cesta/pedido)
        else if (
          data?.codigo === 'FK_CONSTRAINT' ||
          data?.error?.code === 'P2003' ||
          (typeof data?.error === 'object' &&
            JSON.stringify(data.error).includes('foreign key'))
        ) {
          alert(
            data?.erro ||
              'Não é possível excluir esta mercadoria porque ela está vinculada a cestas ou pedidos. ' +
                'Remova essas referências antes (ou marque como "fora de estoque").'
          )
        } else {
          alert(formataErroApi(data) || `Erro ${res.status} ao excluir`)
        }
        return
      }

      console.log('[Mercadorias.deletar] OK', data)
      setMercadorias((prev) => prev.filter((m) => m.id !== deleteId))
    } catch (e: any) {
      console.error('[Mercadorias.deletar] Exceção:', e)
      alert(`Erro de conexão ao excluir mercadoria: ${e?.message ?? e}`)
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  // Formata erros da API (Zod, Prisma ou string) em mensagem legível
  function formataErroApi(data: any): string {
    if (!data) return ''
    const raw = data.erro ?? data.error ?? data.message ?? data
    if (!raw) return ''
    if (typeof raw === 'string') return raw
    if (Array.isArray(raw?.issues)) {
      return raw.issues
        .map((i: any) => `${(i.path ?? []).join('.') || 'campo'}: ${i.message}`)
        .join('\n')
    }
    if (typeof raw?.message === 'string') return raw.message
    try {
      return JSON.stringify(raw, null, 2)
    } catch {
      return String(raw)
    }
  }

  const filtradas = mercadorias.filter((m) => {
    const matchBusca = m.nome?.toLowerCase().includes(busca.toLowerCase())
    const matchCat = categoria === 'Todos' || m.categoria === categoria
    return matchBusca && matchCat
  })

  return (
    <View style={styles.container}>
      <View style={styles.topo}>
        <View style={styles.buscaContainer}>
          <Ionicons name="search" size={18} color="#999" />
          <TextInput
            style={styles.buscaInput}
            placeholder="Buscar mercadoria..."
            placeholderTextColor="#999"
            value={busca}
            onChangeText={setBusca}
          />
        </View>

        <TouchableOpacity
          style={styles.botaoNovo}
          onPress={() => router.push('/admin/mercadorias/novo' as any)}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.botaoNovoText}>Nova Mercadoria</Text>
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filtros}>
            {CATEGORIAS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.filtroBtn, categoria === c && styles.filtroBtnAtivo]}
                onPress={() => setCategoria(c)}
              >
                <Text style={[styles.filtroText, categoria === c && styles.filtroTextAtivo]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
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
                {/* Miniatura: foto se houver, senão emoji do produto, senão ícone genérico */}
                {item.foto ? (
                  <Image
                    source={{ uri: item.foto }}
                    style={styles.thumb}
                    resizeMode="cover"
                  />
                ) : item.emoji ? (
                  <View style={styles.thumbFallback}>
                    <Text style={styles.emoji}>{item.emoji}</Text>
                  </View>
                ) : (
                  <View style={styles.thumbFallback}>
                    <Ionicons name="leaf-outline" size={28} color="#999" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.nome}>{item.nome}</Text>
                  {(() => {
                    const p = Number(item.preco)
                    const pp =
                      item.preco_promocional != null
                        ? Number(item.preco_promocional)
                        : null
                    if (pp != null && pp > 0 && pp < p) {
                      const pct = Math.round(((p - pp) / p) * 100)
                      return (
                        <View style={styles.precoRow}>
                          <Text style={styles.subPromo}>
                            R$ {pp.toFixed(2)}/{item.unidade}
                          </Text>
                          <Text style={styles.subOriginal}>
                            R$ {p.toFixed(2)}
                          </Text>
                          <View style={styles.precoPctBadge}>
                            <Text style={styles.precoPctText}>-{pct}%</Text>
                          </View>
                        </View>
                      )
                    }
                    return (
                      <Text style={styles.sub}>
                        R$ {p.toFixed(2)}/{item.unidade}
                      </Text>
                    )
                  })()}
                  {/* Só Superadmin (3) vê o nome do feirante na listagem (Feirante já sabe que é seu) */}
                  {admin!.nivel >= 3 && item.feirante && (
                    <Text style={styles.feirante}>Feirante: {item.feirante.nome}</Text>
                  )}
                  <View style={styles.badges}>
                    {item.categoria ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.categoria}</Text>
                      </View>
                    ) : null}
                    {item.destaque ? (
                      <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}>
                        <Text style={[styles.badgeText, { color: '#92400E' }]}>★ Destaque</Text>
                      </View>
                    ) : null}
                    {/* Badge de alerta de estoque baixo */}
                    {(() => {
                      const qtd = Number(item.quantidade ?? 0)
                      const min = Number(item.estoque_minimo ?? 0)
                      if (qtd <= 0) return (
                        <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
                          <Text style={[styles.badgeText, { color: '#DC2626' }]}>⛔ Sem estoque</Text>
                        </View>
                      )
                      if (min > 0 && qtd <= min) return (
                        <View style={[styles.badge, { backgroundColor: '#FFEDD5' }]}>
                          <Text style={[styles.badgeText, { color: '#C2410C' }]}>⚠️ Estoque baixo</Text>
                        </View>
                      )
                      return null
                    })()}
                  </View>
                </View>
              </View>

              {/* Barra de estoque */}
              {(() => {
                const qtd = Number(item.quantidade ?? 0)
                const min = Number(item.estoque_minimo ?? 0)
                const max = Number(item.estoque_maximo ?? 0)
                if (max <= 0) return (
                  <Text style={styles.estoqueTexto}>Estoque: {qtd} unid.</Text>
                )
                const pct = Math.min(Math.max(qtd / max, 0), 1)
                const cor = qtd <= 0 ? '#EF4444' : (min > 0 && qtd <= min) ? '#F97316' : pct <= 0.4 ? '#F59E0B' : '#10B981'
                return (
                  <View style={styles.estoqueContainer}>
                    <View style={styles.estoqueInfo}>
                      <Text style={styles.estoqueTexto}>Estoque: {qtd} / {max}</Text>
                      {min > 0 && <Text style={styles.estoqueMin}>Mín: {min}</Text>}
                    </View>
                    <View style={styles.estoqueBarra}>
                      <View style={[styles.estoquePreenchido, { width: `${pct * 100}%`, backgroundColor: cor }]} />
                    </View>
                  </View>
                )
              })()}

              <View style={styles.cardAcoes}>
                <View style={styles.destaqueRow}>
                  <Text style={styles.destaqueLabel}>Destaque</Text>
                  <Switch
                    value={!!item.destaque}
                    onValueChange={() => toggleDestaque(item.id, !!item.destaque)}
                    trackColor={{ false: '#DDD', true: '#255336' }}
                    thumbColor="#FFF"
                  />
                </View>
                <TouchableOpacity
                  style={styles.botaoEditar}
                  onPress={() => router.push(`/admin/mercadorias/${item.id}` as any)}
                >
                  <Ionicons name="pencil" size={16} color="#255336" />
                  <Text style={styles.botaoEditarText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.botaoExcluir}
                  onPress={() => setDeleteId(item.id)}
                >
                  <Ionicons name="trash" size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <ConfirmModal
        visible={deleteId !== null}
        titulo="Excluir Mercadoria"
        mensagem="Tem certeza que deseja excluir esta mercadoria?"
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
    borderWidth: 1,
    borderColor: '#255336',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  cardTopo: { flexDirection: 'row', gap: 12, marginBottom: 8, alignItems: 'flex-start' },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  thumbFallback: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  estoqueContainer: { marginBottom: 12 },
  estoqueInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  estoqueTexto: { fontSize: 12, fontFamily: 'Poppins-Regular', color: '#666666', marginBottom: 8 },
  estoqueMin: { fontSize: 12, fontFamily: 'Poppins-Regular', color: '#999999' },
  estoqueBarra: { height: 6, backgroundColor: '#E5E5E5', borderRadius: 3, overflow: 'hidden' },
  estoquePreenchido: { height: 6, borderRadius: 3 },
  emoji: { fontSize: 32 },
  nome: { fontSize: 16, fontFamily: 'Poppins-SemiBold', color: '#333333' },
  sub: { fontSize: 14, fontFamily: 'Poppins-Regular', color: '#666666', marginBottom: 4 },
  precoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  subPromo: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#DC2626',
  },
  subOriginal: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  precoPctBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  precoPctText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Poppins-SemiBold',
  },
  feirante: { fontSize: 13, fontFamily: 'Poppins-Regular', color: '#999999', marginBottom: 4 },
  badges: { flexDirection: 'row', gap: 6 },
  badge: {
    backgroundColor: '#E8F5E8',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, fontFamily: 'Poppins-SemiBold', color: '#255336' },
  cardAcoes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 12,
  },
  destaqueRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  destaqueLabel: { fontSize: 12, fontFamily: 'Poppins-Regular', color: '#666666' },
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
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
})
