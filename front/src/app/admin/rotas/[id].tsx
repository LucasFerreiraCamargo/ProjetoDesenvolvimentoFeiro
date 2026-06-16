import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import ActionButton from '../../../components/admin/ActionButton'
import AbrirNavegacao, {
  ParadaDestino,
} from '../../../components/admin/AbrirNavegacao'
import { useAdmin, useAdminGuard, useAdminTitulo } from '../../../contexts/AdminContext'
import { rotasService, RotaOtimizada } from '../../../services/rotas'
import type { Rota, RotaPedido } from '../../../types/api'

const COR_LINHA = '#255336'

export default function RotaDetalhe() {
  useAdminGuard(2)
  const { id } = useLocalSearchParams<{ id: string }>()
  const rotaId = Number(id)
  useAdminTitulo(`Rota #${id}`)
  const { admin } = useAdmin()
  const router = useRouter()

  const [rota, setRota] = useState<Rota | null>(null)
  const [loading, setLoading] = useState(true)
  const [agindo, setAgindo] = useState(false)
  const [otimMeta, setOtimMeta] = useState<RotaOtimizada['otimizacao'] | null>(null)

  // Navegação externa (Google Maps/Waze)
  const [navDestino, setNavDestino] = useState<ParadaDestino | null>(null)

  const carregar = useCallback(async () => {
    if (!admin?.token || !rotaId) return
    setLoading(true)
    try {
      const r = await rotasService.buscarPorId(admin.token, rotaId)
      setRota(r)
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Falha ao carregar rota')
    } finally {
      setLoading(false)
    }
  }, [admin?.token, rotaId])

  useEffect(() => {
    carregar()
  }, [carregar])

  // Coordenadas (para renderizar marcadores e polyline)
  // Endereço de entrega vem do endereço PRINCIPAL do cliente (modelo iFood).
  const coordenadas = useMemo(() => {
    if (!rota?.paradas) return []
    return rota.paradas
      .map((p) => {
        const endPrincipal = (p.pedido?.usuario as any)?.enderecos?.[0]
        return { p, endPrincipal }
      })
      .filter(
        ({ endPrincipal }) =>
          endPrincipal?.latitude != null && endPrincipal?.longitude != null,
      )
      .map(({ p, endPrincipal }) => ({
        id: p.pedido_id,
        ordem: p.ordem,
        cliente: p.pedido?.usuario?.nome ?? `Pedido #${p.pedido_id}`,
        endereco:
          [endPrincipal.endereco, endPrincipal.numero]
            .filter(Boolean)
            .join(', ') || undefined,
        latitude: endPrincipal.latitude as number,
        longitude: endPrincipal.longitude as number,
        status: p.status_parada,
      }))
  }, [rota])

  const regiaoInicial = useMemo(() => {
    if (coordenadas.length === 0) {
      // Centro default (Pelotas-RS)
      return { latitude: -31.7654, longitude: -52.3376, latitudeDelta: 0.1, longitudeDelta: 0.1 }
    }
    const lats = coordenadas.map((c) => c.latitude)
    const lngs = coordenadas.map((c) => c.longitude)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    const padding = 0.01
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(0.02, maxLat - minLat + padding * 2),
      longitudeDelta: Math.max(0.02, maxLng - minLng + padding * 2),
    }
  }, [coordenadas])

  async function otimizar() {
    if (!admin?.token || !rota) return
    setAgindo(true)
    try {
      const r = await rotasService.otimizar(admin.token, rota.id)
      setRota(r)
      setOtimMeta(r.otimizacao ?? null)
      if (r.otimizacao?.distancia_total_km != null) {
        Alert.alert(
          'Rota otimizada',
          `Distância total estimada: ${r.otimizacao.distancia_total_km.toFixed(2)} km\n` +
            `Algoritmo: ${r.otimizacao.algoritmo}\n` +
            `${r.otimizacao.iteracoes_2opt} iterações de melhoria.`,
        )
      }
    } catch (e: any) {
      Alert.alert('Erro ao otimizar', e?.message ?? 'Falha desconhecida')
    } finally {
      setAgindo(false)
    }
  }

  function iniciar() {
    if (!admin?.token || !rota) return
    Alert.alert(
      'Iniciar Rota',
      `Confirmar início? Os ${rota.paradas?.length ?? 0} pedido(s) terão o status alterado para Em Rota.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Iniciar',
          onPress: async () => {
            setAgindo(true)
            try {
              const r = await rotasService.iniciar(admin!.token, rota.id)
              setRota(r)
            } catch (e: any) {
              Alert.alert('Erro', e?.message ?? 'Falha ao iniciar')
            } finally {
              setAgindo(false)
            }
          },
        },
      ],
    )
  }

  function finalizar() {
    if (!admin?.token || !rota) return
    Alert.alert('Finalizar Rota', 'Marcar a rota como finalizada?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Finalizar',
        onPress: async () => {
          setAgindo(true)
          try {
            const r = await rotasService.finalizar(admin!.token, rota.id)
            setRota(r)
          } catch (e: any) {
            Alert.alert('Erro', e?.message ?? 'Falha ao finalizar')
          } finally {
            setAgindo(false)
          }
        },
      },
    ])
  }

  function cancelar() {
    if (!admin?.token || !rota) return
    Alert.alert(
      'Cancelar Rota',
      rota.status === 'INICIADA'
        ? 'Pedidos pendentes voltarão para "Em Preparação". Confirma?'
        : 'Confirma cancelar esta rota?',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Cancelar Rota',
          style: 'destructive',
          onPress: async () => {
            setAgindo(true)
            try {
              const r = await rotasService.cancelar(admin!.token, rota.id)
              setRota(r)
            } catch (e: any) {
              Alert.alert('Erro', e?.message ?? 'Falha ao cancelar')
            } finally {
              setAgindo(false)
            }
          },
        },
      ],
    )
  }

  async function marcarParada(parada: RotaPedido, status: 'ENTREGUE' | 'FALHA') {
    if (!admin?.token || !rota) return
    setAgindo(true)
    try {
      const r = await rotasService.atualizarParada(admin.token, rota.id, parada.pedido_id, {
        status_parada: status,
      })
      setRota(r)
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Falha ao atualizar parada')
    } finally {
      setAgindo(false)
    }
  }

  function abrirNavegacaoCompleta() {
    if (coordenadas.length === 0) {
      Alert.alert('Sem coordenadas', 'Nenhuma parada tem coordenadas válidas.')
      return
    }
    const destino: ParadaDestino = {
      latitude: coordenadas[coordenadas.length - 1].latitude,
      longitude: coordenadas[coordenadas.length - 1].longitude,
      endereco: coordenadas[coordenadas.length - 1].endereco,
      rotulo: `Última parada: ${coordenadas[coordenadas.length - 1].cliente}`,
    }
    setNavDestino(destino)
  }

  function abrirNavegacaoParada(idx: number) {
    const c = coordenadas[idx]
    setNavDestino({
      latitude: c.latitude,
      longitude: c.longitude,
      endereco: c.endereco,
      rotulo: `${idx + 1}. ${c.cliente}`,
    })
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#255336" />
      </View>
    )
  }

  if (!rota) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Rota não encontrada</Text>
      </View>
    )
  }

  const podeEditar = rota.status === 'RASCUNHO'
  const emCampo = rota.status === 'INICIADA'
  const terminada = rota.status === 'FINALIZADA' || rota.status === 'CANCELADA'

  // Waypoints pra navegação completa (todas paradas menos a última, que é o destino)
  const waypoints =
    coordenadas.length > 1
      ? coordenadas.slice(0, -1).map((c) => ({ latitude: c.latitude, longitude: c.longitude }))
      : undefined

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Mapa */}
        {coordenadas.length > 0 ? (
          <View style={styles.mapaWrap}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.mapa}
              initialRegion={regiaoInicial}
            >
              {coordenadas.map((c, idx) => (
                <Marker
                  key={c.id}
                  coordinate={{ latitude: c.latitude, longitude: c.longitude }}
                  title={`${idx + 1}. ${c.cliente}`}
                  description={c.endereco}
                  pinColor={c.status === 'ENTREGUE' ? 'green' : c.status === 'FALHA' ? 'red' : '#255336'}
                />
              ))}
              <Polyline
                coordinates={coordenadas.map((c) => ({ latitude: c.latitude, longitude: c.longitude }))}
                strokeColor={COR_LINHA}
                strokeWidth={3}
              />
            </MapView>
          </View>
        ) : (
          <View style={styles.semMapa}>
            <Ionicons name="map-outline" size={48} color="#CCC" />
            <Text style={styles.semMapaText}>
              Nenhuma parada tem coordenadas. Verifique o endereço dos clientes.
            </Text>
          </View>
        )}

        {/* Resumo da rota */}
        <View style={styles.card}>
          <Text style={styles.tituloRota}>{rota.nome || `Rota #${rota.id}`}</Text>
          <View style={styles.linha}>
            <Ionicons name="person" size={14} color="#666" />
            <Text style={styles.linhaTexto}>
              {rota.entregador?.nome ?? `Entregador #${rota.entregador_id}`}
            </Text>
            {rota.entregador?.telefone && (
              <Text style={styles.linhaTexto}> · {rota.entregador.telefone}</Text>
            )}
          </View>
          <View style={styles.linha}>
            <Ionicons name="location" size={14} color="#666" />
            <Text style={styles.linhaTexto}>
              {coordenadas.length} parada{coordenadas.length === 1 ? '' : 's'}
              {rota.foi_otimizada ? ' · ⚡ otimizada' : ''}
            </Text>
          </View>
          {otimMeta?.distancia_total_km != null && (
            <View style={styles.linha}>
              <Ionicons name="speedometer-outline" size={14} color="#666" />
              <Text style={styles.linhaTexto}>
                ~{otimMeta.distancia_total_km.toFixed(2)} km estimados
              </Text>
            </View>
          )}
        </View>

        {/* Ações principais */}
        {!terminada && (
          <View style={styles.card}>
            {podeEditar && (
              <>
                <ActionButton
                  label="Otimizar Ordem"
                  onPress={otimizar}
                  loading={agindo}
                  icon="flash"
                />
                <View style={{ height: 8 }} />
                <ActionButton
                  label="Iniciar Rota"
                  onPress={iniciar}
                  loading={agindo}
                  icon="play"
                />
              </>
            )}
            {emCampo && (
              <>
                <ActionButton
                  label="Abrir Navegação (rota completa)"
                  onPress={abrirNavegacaoCompleta}
                  icon="navigate"
                />
                <View style={{ height: 8 }} />
                <ActionButton
                  label="Finalizar Rota"
                  onPress={finalizar}
                  loading={agindo}
                  icon="checkmark-done"
                />
              </>
            )}
            <View style={{ height: 8 }} />
            <ActionButton
              label="Cancelar Rota"
              onPress={cancelar}
              loading={agindo}
              variant="danger"
              icon="close-circle-outline"
            />
          </View>
        )}

        {/* Lista de paradas */}
        <View style={styles.card}>
          <Text style={styles.secao}>Paradas em ordem</Text>
          {(rota.paradas ?? []).map((p, idx) => {
            const c = coordenadas.find((co) => co.id === p.pedido_id)
            const isEntregue = p.status_parada === 'ENTREGUE'
            const isFalha = p.status_parada === 'FALHA'
            const desabilitar = isEntregue || isFalha
            return (
              <View key={p.pedido_id} style={styles.parada}>
                <View
                  style={[
                    styles.paradaOrdem,
                    isEntregue && { backgroundColor: '#065F46' },
                    isFalha && { backgroundColor: '#DC2626' },
                  ]}
                >
                  {isEntregue ? (
                    <Ionicons name="checkmark" size={14} color="#FFF" />
                  ) : isFalha ? (
                    <Ionicons name="close" size={14} color="#FFF" />
                  ) : (
                    <Text style={styles.paradaOrdemText}>{idx + 1}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paradaCliente}>
                    {p.pedido?.usuario?.nome ?? `Cliente #${p.pedido_id}`}
                  </Text>
                  {c?.endereco && <Text style={styles.paradaEnd}>{c.endereco}</Text>}
                  <Text style={styles.paradaMeta}>Pedido #{p.pedido_id}</Text>
                  {emCampo && !desabilitar && (
                    <View style={styles.paradaAcoesLinha}>
                      <TouchableOpacity
                        style={styles.btnPequeno}
                        onPress={() => abrirNavegacaoParada(idx)}
                      >
                        <Ionicons name="navigate-outline" size={14} color="#255336" />
                        <Text style={styles.btnPequenoText}>Navegar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.btnPequeno, { borderColor: '#065F46' }]}
                        onPress={() => marcarParada(p, 'ENTREGUE')}
                      >
                        <Ionicons name="checkmark" size={14} color="#065F46" />
                        <Text style={[styles.btnPequenoText, { color: '#065F46' }]}>Entregue</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.btnPequeno, { borderColor: '#DC2626' }]}
                        onPress={() => marcarParada(p, 'FALHA')}
                      >
                        <Ionicons name="close" size={14} color="#DC2626" />
                        <Text style={[styles.btnPequenoText, { color: '#DC2626' }]}>Falha</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )
          })}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <AbrirNavegacao
        visivel={navDestino !== null}
        destino={navDestino}
        paradasIntermediarias={
          navDestino && coordenadas.length > 1 && navDestino.rotulo?.startsWith('Última parada')
            ? waypoints
            : undefined
        }
        onFechar={() => setNavDestino(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7E4' },
  content: { paddingBottom: 32 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF7E4' },

  mapaWrap: { height: 280, margin: 16, borderRadius: 12, overflow: 'hidden' },
  mapa: { flex: 1 },
  semMapa: {
    margin: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  semMapaText: { fontSize: 13, color: '#666', textAlign: 'center' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 1,
  },
  tituloRota: { fontSize: 18, fontFamily: 'Poppins-SemiBold', color: '#255336', marginBottom: 8 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  linhaTexto: { fontSize: 13, color: '#666' },
  secao: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#255336', marginBottom: 12 },

  parada: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  paradaOrdem: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#255336',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paradaOrdemText: { color: '#FFF', fontFamily: 'Poppins-SemiBold', fontSize: 13 },
  paradaCliente: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#333' },
  paradaEnd: { fontSize: 12, color: '#666', marginTop: 2 },
  paradaMeta: { fontSize: 11, color: '#999', marginTop: 2 },
  paradaAcoesLinha: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  btnPequeno: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#255336',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  btnPequenoText: { fontSize: 11, fontFamily: 'Poppins-SemiBold', color: '#255336' },
})
