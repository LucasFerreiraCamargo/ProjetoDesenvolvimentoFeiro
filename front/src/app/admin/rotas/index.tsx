import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useAdmin, useAdminGuard, useAdminTitulo } from '../../../contexts/AdminContext'
import { rotasService } from '../../../services/rotas'
import type { Rota, StatusRota } from '../../../types/api'

const FILTROS: ('Todos' | StatusRota)[] = [
  'Todos',
  'RASCUNHO',
  'INICIADA',
  'FINALIZADA',
  'CANCELADA',
]

const STATUS_INFO: Record<StatusRota, { label: string; cor: string; corBg: string }> = {
  RASCUNHO:   { label: 'Rascunho',   cor: '#92400E', corBg: '#FEF3C7' },
  INICIADA:   { label: 'Em campo',   cor: '#5B21B6', corBg: '#EDE9FE' },
  FINALIZADA: { label: 'Finalizada', cor: '#065F46', corBg: '#D1FAE5' },
  CANCELADA:  { label: 'Cancelada',  cor: '#DC2626', corBg: '#FEE2E2' },
}

export default function RotasLista() {
  useAdminGuard(2)
  useAdminTitulo('Rotas')
  const { admin } = useAdmin()
  const router = useRouter()

  const [rotas, setRotas] = useState<Rota[]>([])
  const [filtro, setFiltro] = useState<'Todos' | StatusRota>('Todos')
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    if (!admin?.token) return
    setLoading(true)
    try {
      const lista = await rotasService.listar(admin.token)
      setRotas(lista)
    } catch (e: any) {
      alert(e?.message ?? 'Erro ao carregar rotas')
    } finally {
      setLoading(false)
    }
  }, [admin?.token])

  useFocusEffect(
    useCallback(() => {
      carregar()
    }, [carregar]),
  )

  const filtradas = rotas.filter((r) => filtro === 'Todos' || r.status === filtro)

  function formataData(d?: string | null) {
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
              {f === 'Todos' ? 'Todas' : STATUS_INFO[f].label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color="#255336" style={{ marginTop: 40 }} />
      ) : filtradas.length === 0 ? (
        <View style={styles.vazio}>
          <Ionicons name="map-outline" size={48} color="#CCC" />
          <Text style={styles.vazioText}>
            {rotas.length === 0
              ? 'Nenhuma rota criada ainda.'
              : 'Nenhuma rota neste filtro.'}
          </Text>
          <Text style={styles.vazioHint}>
            Crie uma rota selecionando pedidos em "Em Preparação" na tela de Pedidos.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtradas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => {
            const info = STATUS_INFO[item.status]
            const paradas = item._count?.paradas ?? item.paradas?.length ?? 0
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/admin/rotas/${item.id}` as any)}
              >
                <View style={styles.cardTopo}>
                  <Text style={styles.titulo}>
                    {item.nome || `Rota #${item.id}`}
                  </Text>
                  <View style={[styles.tag, { backgroundColor: info.corBg }]}>
                    <Text style={[styles.tagText, { color: info.cor }]}>{info.label}</Text>
                  </View>
                </View>

                <View style={styles.linha}>
                  <Ionicons name="person" size={14} color="#666" />
                  <Text style={styles.linhaTexto}>
                    {item.entregador?.nome ?? 'Entregador #' + item.entregador_id}
                  </Text>
                </View>

                <View style={styles.linha}>
                  <Ionicons name="location" size={14} color="#666" />
                  <Text style={styles.linhaTexto}>
                    {paradas} parada{paradas === 1 ? '' : 's'}
                    {item.foi_otimizada ? ' · ⚡ otimizada' : ''}
                  </Text>
                </View>

                <View style={styles.linha}>
                  <Ionicons name="time-outline" size={14} color="#666" />
                  <Text style={styles.linhaTexto}>
                    {item.data_inicio
                      ? `Iniciada em ${formataData(item.data_inicio)}`
                      : `Criada em ${formataData(item.createdAt)}`}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7E4' },
  filtrosScroll: { maxHeight: 60 },
  filtros: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, alignItems: 'center' },
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
    marginBottom: 10,
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 1,
  },
  cardTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titulo: { flex: 1, fontSize: 15, fontFamily: 'Poppins-SemiBold', color: '#255336' },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: { fontSize: 11, fontFamily: 'Poppins-SemiBold' },

  linha: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  linhaTexto: { fontSize: 13, color: '#666' },

  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  vazioText: { fontSize: 14, color: '#666', textAlign: 'center' },
  vazioHint: { fontSize: 12, color: '#999', textAlign: 'center', fontStyle: 'italic' },
})
