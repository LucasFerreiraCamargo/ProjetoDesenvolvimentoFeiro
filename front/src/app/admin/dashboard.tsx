import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { useAdminTitulo } from '../../contexts/AdminContext'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import StatsCard from '../../components/admin/StatsCard'
import StatusBadge from '../../components/admin/StatusBadge'
import { useAdmin, useAdminGuard } from '../../contexts/AdminContext'
import { adminFetch } from '../../utils/adminApi'

export default function Dashboard() {
  // Permite feirante (2) e superadmin (3). Cliente (1) é bloqueado.
  useAdminGuard(2)
  useAdminTitulo('Dashboard')
  const { admin } = useAdmin()
  const router = useRouter()

  const [stats, setStats] = useState<any>(null)
  const [pedidosRecentes, setPedidosRecentes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const saudacao = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  // Convenção: 1=Cliente, 2=Feirante, 3=Superadmin
  const nivelLabel = (n?: number) => {
    if (n === 1) return 'Cliente'
    if (n === 2) return 'Feirante'
    return 'Superadmin'
  }

  useEffect(() => {
    if (!admin) return
    fetchDados()
  }, [admin])

  async function fetchDados() {
    setLoading(true)
    try {
      // Superadmin (nivel 3) vê visão consolidada
      if (admin!.nivel >= 3) {
        const [resStats, resCestas, resPedidos] = await Promise.all([
          adminFetch('/dashboard/stats', undefined, admin!.token),
          adminFetch('/cestas', undefined, admin!.token),
          adminFetch('/pedido', undefined, admin!.token),
        ])
        const s = resStats.ok ? await resStats.json() : {}
        const cestas = resCestas.ok ? await resCestas.json() : []
        const pedidos = resPedidos.ok ? await resPedidos.json() : []
        setStats({ ...s, totalCestas: Array.isArray(cestas) ? cestas.length : 0 })
        setPedidosRecentes(Array.isArray(pedidos) ? pedidos.slice(0, 5) : [])
      } else {
        // Feirante (nivel 2) vê apenas seus próprios dados
        const feiranteId = admin!.feiranteId
        const [resMerc, resCestas, resPedidos] = await Promise.all([
          adminFetch(`/mercadorias/feirantes/${feiranteId}`, undefined, admin!.token),
          adminFetch('/cestas', undefined, admin!.token),
          adminFetch('/pedido', undefined, admin!.token),
        ])
        const mercadorias = resMerc.ok ? await resMerc.json() : []
        const allCestas = resCestas.ok ? await resCestas.json() : []
        const allPedidos = resPedidos.ok ? await resPedidos.json() : []
        const minhasCestas = Array.isArray(allCestas)
          ? allCestas.filter((c: any) => c.feirante_id === feiranteId)
          : []
        setStats({
          totalProdutos: Array.isArray(mercadorias) ? mercadorias.length : 0,
          totalCestas: minhasCestas.length,
          totalPedidos: Array.isArray(allPedidos) ? allPedidos.length : 0,
        })
        setPedidosRecentes(Array.isArray(allPedidos) ? allPedidos.slice(0, 5) : [])
      }
    } catch (e) {
      console.warn('Erro ao carregar dashboard:', e)
    }
    setLoading(false)
  }

  if (!admin) return null

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.boasVindas}>
        <Text style={styles.boasVindasTitulo}>
          {saudacao()}, {admin.nome.split(' ')[0]}! 👋
        </Text>
        <Text style={styles.boasVindasSub}>Nível: {nivelLabel(admin.nivel)}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#255336" style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.statsGrid}>
            {admin.nivel >= 3 ? (
              <>
                <View style={styles.statsRow}>
                  <StatsCard
                    titulo="Usuários"
                    valor={stats?.totalUsuarios ?? 0}
                    icone="people"
                  />
                  <View style={styles.statsGap} />
                  <StatsCard
                    titulo="Feirantes"
                    valor={stats?.totalFeirantes ?? 0}
                    icone="storefront"
                    corIcone="#4A7C59"
                    corFundo="#E8F5E8"
                  />
                </View>
                <View style={styles.statsRow}>
                  <StatsCard
                    titulo="Pedidos"
                    valor={stats?.totalPedidos ?? 0}
                    icone="receipt"
                    corIcone="#3B82F6"
                    corFundo="#DBEAFE"
                  />
                  <View style={styles.statsGap} />
                  <StatsCard
                    titulo="Cestas"
                    valor={stats?.totalCestas ?? 0}
                    icone="basket"
                    corIcone="#F59E0B"
                    corFundo="#FEF3C7"
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.statsRow}>
                  <StatsCard
                    titulo="Produtos"
                    valor={stats?.totalProdutos ?? 0}
                    icone="leaf"
                  />
                  <View style={styles.statsGap} />
                  <StatsCard
                    titulo="Cestas"
                    valor={stats?.totalCestas ?? 0}
                    icone="basket"
                    corIcone="#F59E0B"
                    corFundo="#FEF3C7"
                  />
                </View>
                <View style={styles.statsRow}>
                  <StatsCard
                    titulo="Pedidos"
                    valor={stats?.totalPedidos ?? 0}
                    icone="receipt"
                    corIcone="#3B82F6"
                    corFundo="#DBEAFE"
                  />
                  <View style={styles.statsGap} />
                  <StatsCard
                    titulo="Avaliação"
                    valor={stats?.avaliacao ?? '—'}
                    icone="star"
                    corIcone="#F59E0B"
                    corFundo="#FEF3C7"
                  />
                </View>
              </>
            )}
          </View>

          <Text style={styles.secaoTitulo}>Pedidos Recentes</Text>
          {pedidosRecentes.length === 0 ? (
            <Text style={styles.vazio}>Nenhum pedido encontrado</Text>
          ) : (
            pedidosRecentes.map((p: any) => (
              <TouchableOpacity
                key={p.id}
                style={styles.pedidoCard}
                onPress={() => router.push(`/admin/pedidos/${p.id}` as any)}
              >
                <View style={styles.pedidoTopo}>
                  <Text style={styles.pedidoId}>Pedido #{p.id}</Text>
                  <Text style={styles.pedidoValor}>
                    R$ {Number(p.total || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.pedidoBase}>
                  <Text style={styles.pedidoCliente}>
                    {p.usuario?.nome ?? p.usuario_id ?? '—'}
                  </Text>
                  <StatusBadge status={p.status ?? 'PENDENTE'} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7E4' },
  content: { padding: 16, paddingBottom: 32 },
  boasVindas: { marginBottom: 20 },
  boasVindasTitulo: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#255336',
  },
  boasVindasSub: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#999999',
  },
  statsGrid: { gap: 12, marginBottom: 24 },
  statsRow: { flexDirection: 'row' },
  statsGap: { width: 12 },
  secaoTitulo: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
    marginBottom: 12,
  },
  vazio: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#999999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  pedidoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 1,
  },
  pedidoTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pedidoId: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#255336',
  },
  pedidoValor: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#255336',
  },
  pedidoBase: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pedidoCliente: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666666',
  },
})
