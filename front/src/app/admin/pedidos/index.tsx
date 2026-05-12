import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
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

const FILTROS = ['Todos', 'PENDENTE', 'EM_PREPARACAO', 'EM_ANDAMENTO', 'EM_ROTA', 'ENTREGUE', 'FINALIZADO', 'CANCELADO']

export default function Pedidos() {
  // Feirante (2) e Superadmin (3) podem acessar
  useAdminGuard(2)
  useAdminTitulo('Pedidos')
  const { admin } = useAdmin()
  const router = useRouter()

  const [pedidos, setPedidos] = useState<any[]>([])
  const [filtro, setFiltro] = useState('Todos')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchPedidos() }, [])

  async function fetchPedidos() {
    setLoading(true)
    try {
      const res = await adminFetch('/pedido', undefined, admin!.token)
      const data = await res.json()
      setPedidos(Array.isArray(data) ? data : [])
    } catch { alert('Erro ao carregar pedidos') }
    setLoading(false)
  }

  const filtrados = pedidos.filter((p) => filtro === 'Todos' || p.status === filtro)

  const corBorda = (status: string) => STATUS_MAP[status]?.text ?? '#E0E0E0'

  const formatarData = (d: string) => {
    if (!d) return ''
    try { return new Date(d).toLocaleString('pt-BR') } catch { return d }
  }

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

      {loading ? (
        <ActivityIndicator size="large" color="#255336" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtrados}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { borderLeftColor: corBorda(item.status) }]}
              onPress={() => router.push(`/admin/pedidos/${item.id}` as any)}
            >
              <View style={styles.cardTopo}>
                <Text style={styles.pedidoId}>Pedido #{item.id}</Text>
                <Text style={styles.pedidoValor}>R$ {Number(item.total || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.cardMeio}>
                <Text style={styles.pedidoCliente}>
                  {item.usuario?.nome ?? item.usuario_id ?? '—'}
                </Text>
                <StatusBadge status={item.status ?? 'PENDENTE'} />
              </View>
              <Text style={styles.pedidoMeta}>
                {item.itens?.length ?? 0} itens · {formatarData(item.created_at ?? item.data)}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7E4' },
  filtrosScroll: { maxHeight: 60 },
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
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  filtroBtnAtivo: { backgroundColor: '#255336' },
  filtroText: { fontSize: 12, fontFamily: 'Poppins-SemiBold', color: '#255336' },
  filtroTextAtivo: { color: '#FFFFFF' },
  lista: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 1,
    borderLeftWidth: 4,
  },
  cardTopo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  pedidoId: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#255336' },
  pedidoValor: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#255336' },
  cardMeio: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  pedidoCliente: { fontSize: 14, fontFamily: 'Poppins-Regular', color: '#333333' },
  pedidoMeta: { fontSize: 12, fontFamily: 'Poppins-Regular', color: '#999999' },
})
