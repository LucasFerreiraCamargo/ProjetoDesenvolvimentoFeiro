import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import StatusBadge, { STATUS_MAP } from '../../../components/admin/StatusBadge'
import { useAdmin, useAdminGuard, useAdminTitulo } from '../../../contexts/AdminContext'
import { adminFetch } from '../../../utils/adminApi'

const FILTROS = [
  'Todos',
  'PENDENTE',
  'EM_PREPARACAO',
  'EM_ROTA',
  'FINALIZADO',
  'CANCELADO',
]

export default function Pedidos() {
  // Feirante (2) e Superadmin (3) podem acessar
  useAdminGuard(2)
  useAdminTitulo('Pedidos')
  const { admin } = useAdmin()
  const router = useRouter()

  const [pedidos, setPedidos] = useState<any[]>([])
  const [filtro, setFiltro] = useState('Todos')
  const [loading, setLoading] = useState(true)

  // Seleção pra criar rota — só vale para pedidos EM_PREPARACAO
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set())

  const fetchPedidos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminFetch('/pedido', undefined, admin!.token)
      const data = await res.json()
      if (!res.ok) {
        console.warn('[Pedidos] API erro:', { status: res.status, body: data })
        alert('Erro ao carregar pedidos')
        setPedidos([])
        return
      }
      setPedidos(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('[Pedidos] Exceção:', e)
      alert('Erro de conexão ao carregar pedidos')
    } finally {
      setLoading(false)
    }
  }, [admin?.token])

  // Recarrega ao focar (após editar pedido ou criar rota)
  useFocusEffect(
    useCallback(() => {
      fetchPedidos()
    }, [fetchPedidos]),
  )

  // Feirante (nível 2) só vê pedidos que incluem alguma mercadoria da banca dele.
  // Superadmin (nível 3) vê todos.
  const visiveis = useMemo(() => {
    if (!admin) return []
    if (admin.nivel >= 3) return pedidos
    if (admin.nivel === 2 && admin.feiranteId != null) {
      return pedidos.filter((p: any) => {
        const items = Array.isArray(p.items) ? p.items : []
        return items.some(
          (it: any) => Number(it?.mercadoria?.feirante_id) === Number(admin.feiranteId),
        )
      })
    }
    return []
  }, [admin, pedidos])

  const filtrados = visiveis.filter((p) => filtro === 'Todos' || p.status === filtro)

  const corBorda = (status: string) => STATUS_MAP[status]?.text ?? '#E0E0E0'

  const formatarData = (d: string) => {
    if (!d) return ''
    try { return new Date(d).toLocaleString('pt-BR') } catch { return d }
  }

  function alternarSelecao(id: number, podeSelecionar: boolean) {
    if (!podeSelecionar) return
    setSelecionados((prev) => {
      const novo = new Set(prev)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  function limparSelecao() {
    setSelecionados(new Set())
  }

  function selecionarTodosVisiveis() {
    const ids = filtrados
      .filter((p) => p.status === 'EM_PREPARACAO')
      .map((p) => Number(p.id))
    setSelecionados(new Set(ids))
  }

  function criarRotaComSelecionados() {
    if (selecionados.size === 0) return
    const ids = Array.from(selecionados).join(',')
    router.push(`/admin/rotas/nova?pedidos=${ids}` as any)
  }

  // Quantos dos visíveis podem ser selecionados (status EM_PREPARACAO)
  const totalSelecionaveis = filtrados.filter((p) => p.status === 'EM_PREPARACAO').length

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtrosScroll}
        contentContainerStyle={styles.filtros}
      >
        {FILTROS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filtroBtn, filtro === f && styles.filtroBtnAtivo]}
            onPress={() => setFiltro(f)}
          >
            <Text style={[styles.filtroText, filtro === f && styles.filtroTextAtivo]}>
              {f === 'Todos' ? 'Todos' : (STATUS_MAP[f]?.label ?? f)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Dica quando há pedidos selecionáveis e nenhum está marcado */}
      {totalSelecionaveis > 0 && selecionados.size === 0 && (
        <View style={styles.dica}>
          <Ionicons name="information-circle-outline" size={16} color="#92400E" />
          <Text style={styles.dicaText}>
            Toque no círculo dos pedidos "Em Preparação" para criar uma rota com eles.
          </Text>
          <TouchableOpacity onPress={selecionarTodosVisiveis}>
            <Text style={styles.dicaLink}>Marcar todos</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#255336" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtrados}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.lista,
            selecionados.size > 0 && { paddingBottom: 100 },
          ]}
          renderItem={({ item }) => {
            const id = Number(item.id)
            const podeSelecionar = item.status === 'EM_PREPARACAO'
            const sel = selecionados.has(id)
            return (
              <View style={[styles.card, { borderLeftColor: corBorda(item.status) }]}>
                {/* Checkbox lateral só pra EM_PREPARACAO */}
                <TouchableOpacity
                  style={styles.checkboxArea}
                  onPress={() => alternarSelecao(id, podeSelecionar)}
                  disabled={!podeSelecionar}
                >
                  <View
                    style={[
                      styles.checkbox,
                      sel && styles.checkboxSel,
                      !podeSelecionar && styles.checkboxDisab,
                    ]}
                  >
                    {sel && <Ionicons name="checkmark" size={16} color="#FFF" />}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cardCorpo}
                  onPress={() => router.push(`/admin/pedidos/${item.id}` as any)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardTopo}>
                    <Text style={styles.pedidoId}>Pedido #{item.id}</Text>
                    <Text style={styles.pedidoValor}>
                      R$ {Number(item.valor_total || item.total || 0).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.cardMeio}>
                    <Text style={styles.pedidoCliente}>
                      {item.usuario?.nome ?? item.usuario_id ?? '—'}
                    </Text>
                    <StatusBadge status={item.status ?? 'PENDENTE'} />
                  </View>
                  <Text style={styles.pedidoMeta}>
                    {(item.items ?? item.itens ?? []).length} itens ·{' '}
                    {formatarData(item.createdAt ?? item.created_at ?? item.data)}
                  </Text>
                </TouchableOpacity>
              </View>
            )
          }}
        />
      )}

      {/* Barra fixa inferior — só quando há seleção */}
      {selecionados.size > 0 && (
        <View style={styles.barraInferior}>
          <View style={{ flex: 1 }}>
            <Text style={styles.barraTitulo}>
              {selecionados.size} pedido{selecionados.size > 1 ? 's' : ''} selecionado
              {selecionados.size > 1 ? 's' : ''}
            </Text>
            <TouchableOpacity onPress={limparSelecao}>
              <Text style={styles.barraLink}>Limpar seleção</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.barraBotao}
            onPress={criarRotaComSelecionados}
          >
            <Ionicons name="map" size={18} color="#FFF" />
            <Text style={styles.barraBotaoText}>Criar rota</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7E4' },
  filtrosScroll: { maxHeight: 68, flexGrow: 0 },
  filtros: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    alignItems: 'center',
  },
  filtroBtn: {
    borderWidth: 1,
    borderColor: '#255336',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  filtroBtnAtivo: { backgroundColor: '#255336' },
  filtroText: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    color: '#255336',
    lineHeight: 18,
    includeFontPadding: false,
  },
  filtroTextAtivo: { color: '#FFFFFF' },

  dica: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  dicaText: { flex: 1, fontSize: 12, color: '#92400E' },
  dicaLink: {
    fontSize: 12,
    color: '#92400E',
    fontFamily: 'Poppins-SemiBold',
    textDecorationLine: 'underline',
  },

  lista: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 1,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  checkboxArea: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#255336',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSel: { backgroundColor: '#255336' },
  checkboxDisab: { borderColor: '#DDD', backgroundColor: '#F5F5F5' },

  cardCorpo: { flex: 1, paddingVertical: 14, paddingRight: 14, paddingLeft: 0 },
  cardTopo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  pedidoId: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#255336' },
  pedidoValor: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#255336' },
  cardMeio: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  pedidoCliente: { fontSize: 14, fontFamily: 'Poppins-Regular', color: '#333333' },
  pedidoMeta: { fontSize: 12, fontFamily: 'Poppins-Regular', color: '#999999' },

  barraInferior: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  barraTitulo: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#255336' },
  barraLink: { fontSize: 12, color: '#666', textDecorationLine: 'underline', marginTop: 2 },
  barraBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#255336',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  barraBotaoText: { color: '#FFF', fontFamily: 'Poppins-SemiBold', fontSize: 14 },
})
