/**
 * Tela: Relatório de Perdas por Período (admin / feirante).
 *
 * Agrega as baixas do tipo PERDA do livro-razão num intervalo de datas,
 * agrupadas por mercadoria, com o valor estimado da perda. Útil para o
 * feirante medir o desperdício e tomar decisões de compra/precificação.
 *
 * O valor é ESTIMADO: usa o preço-base vigente (preco_kg p/ PESO, preco p/
 * UNIDADE) e não o preço no momento exato da baixa.
 *
 * Endpoint:
 *   GET /mercadorias/relatorio/perdas?inicio=YYYY-MM-DD&fim=YYYY-MM-DD&feiranteId
 */

import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from 'expo-router'
import React from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useAdmin, useAdminGuard, useAdminTitulo } from '../../contexts/AdminContext'
import { adminFetch } from '../../utils/adminApi'

// ─── Tipos do payload do relatório ────────────────────────────────────────────
interface ItemRelatorio {
  mercadoria_id: number
  nome: string
  tipo_controle: 'PESO' | 'UNIDADE'
  unidade: string
  quantidade_perdida: number
  ocorrencias: number
  valor_estimado: number
}

interface Relatorio {
  periodo: { inicio: string | null; fim: string | null }
  total_ocorrencias: number
  total_quantidade: number
  total_valor_estimado: number
  itens: ItemRelatorio[]
}

type PresetId = 'hoje' | '7dias' | '30dias' | 'mes'

const PRESETS: { id: PresetId; label: string }[] = [
  { id: 'hoje', label: 'Hoje' },
  { id: '7dias', label: '7 dias' },
  { id: '30dias', label: '30 dias' },
  { id: 'mes', label: 'Este mês' },
]

/** Formata uma Date como YYYY-MM-DD no fuso local. */
function ymd(d: Date): string {
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/** Resolve o intervalo {inicio, fim} (YYYY-MM-DD) de um preset. */
function intervaloDoPreset(preset: PresetId): { inicio: string; fim: string } {
  const hoje = new Date()
  const fim = ymd(hoje)
  if (preset === 'hoje') return { inicio: fim, fim }
  if (preset === 'mes') {
    const primeiro = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    return { inicio: ymd(primeiro), fim }
  }
  const dias = preset === '7dias' ? 6 : 29
  const inicioData = new Date(hoje)
  inicioData.setDate(hoje.getDate() - dias)
  return { inicio: ymd(inicioData), fim }
}

/** dd/mm a partir de YYYY-MM-DD. */
function ddmm(iso: string | null): string {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

const moeda = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function RelatorioPerdasScreen() {
  useAdminGuard(2)
  useAdminTitulo('Relatório de Perdas')
  const { admin } = useAdmin()

  const [preset, setPreset] = React.useState<PresetId>('30dias')
  const [relatorio, setRelatorio] = React.useState<Relatorio | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)

  const carregar = React.useCallback(async () => {
    if (!admin?.token) return
    const { inicio, fim } = intervaloDoPreset(preset)
    const params = new URLSearchParams({ inicio, fim })
    // Feirante (nível 2) vê só as próprias perdas; superadmin vê todas.
    if (admin.nivel < 3 && admin.feiranteId != null) {
      params.set('feiranteId', String(admin.feiranteId))
    }
    try {
      const res = await adminFetch(
        `/mercadorias/relatorio/perdas?${params.toString()}`,
        undefined,
        admin.token,
      )
      const data = res.ok ? await res.json() : null
      setRelatorio(data)
    } catch (e) {
      console.warn('[relatorio-perdas] erro ao carregar:', e)
      setRelatorio(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [admin?.token, admin?.nivel, admin?.feiranteId, preset])

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true)
      carregar()
    }, [carregar]),
  )

  function unidadeDe(item: ItemRelatorio): string {
    return item.tipo_controle === 'PESO' ? 'kg' : String(item.unidade ?? 'un').toLowerCase()
  }

  function renderItem({ item }: { item: ItemRelatorio }) {
    const u = unidadeDe(item)
    const casas = u === 'kg' ? 3 : 0
    const qtd = item.quantidade_perdida.toLocaleString('pt-BR', {
      maximumFractionDigits: casas,
    })
    return (
      <View style={styles.card}>
        <View style={styles.cardIcone}>
          <Ionicons name="trash-bin-outline" size={18} color="#B91C1C" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardNome} numberOfLines={1}>
            {item.nome}
          </Text>
          <Text style={styles.cardSub}>
            {qtd} {u} perdidos · {item.ocorrencias}{' '}
            {item.ocorrencias === 1 ? 'lançamento' : 'lançamentos'}
          </Text>
        </View>
        <Text style={styles.cardValor}>{moeda(item.valor_estimado)}</Text>
      </View>
    )
  }

  const intervalo = intervaloDoPreset(preset)

  return (
    <View style={styles.container}>
      {/* Seletor de período */}
      <View style={styles.presetRow}>
        {PRESETS.map((p) => {
          const ativo = p.id === preset
          return (
            <TouchableOpacity
              key={p.id}
              style={[styles.preset, ativo && styles.presetAtivo]}
              activeOpacity={0.8}
              onPress={() => setPreset(p.id)}
            >
              <Text style={[styles.presetText, ativo && styles.presetTextAtivo]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Resumo do período */}
      {!loading && relatorio && (
        <View style={styles.resumo}>
          <View style={styles.resumoTopo}>
            <Ionicons name="calendar-outline" size={14} color="#7A8A7C" />
            <Text style={styles.resumoPeriodo}>
              {ddmm(intervalo.inicio)} – {ddmm(intervalo.fim)}
            </Text>
          </View>
          <Text style={styles.resumoValor}>{moeda(relatorio.total_valor_estimado)}</Text>
          <Text style={styles.resumoLabel}>
            valor estimado em perdas · {relatorio.total_ocorrencias}{' '}
            {relatorio.total_ocorrencias === 1 ? 'lançamento' : 'lançamentos'}
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.centro}>
          <ActivityIndicator color="#4A7C59" />
        </View>
      ) : (
        <FlatList
          data={relatorio?.itens ?? []}
          keyExtractor={(it) => String(it.mercadoria_id)}
          renderItem={renderItem}
          contentContainerStyle={styles.lista}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true)
                carregar()
              }}
              tintColor="#4A7C59"
            />
          }
          ListEmptyComponent={
            <View style={styles.vazio}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#A7F3D0" />
              <Text style={styles.vazioTitulo}>Nenhuma perda no período</Text>
              <Text style={styles.vazioSub}>
                Não há baixas por perda ou quebra registradas neste intervalo.
              </Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7E4' },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  presetRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  preset: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#EAEFEA',
    backgroundColor: '#FFF',
  },
  presetAtivo: { backgroundColor: '#255336', borderColor: '#255336' },
  presetText: { fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#4A7C59' },
  presetTextAtivo: { color: '#FFF' },

  resumo: {
    backgroundColor: '#FFF',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EAEFEA',
  },
  resumoTopo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resumoPeriodo: { fontSize: 12, fontFamily: 'Poppins-Regular', color: '#7A8A7C' },
  resumoValor: {
    fontSize: 28,
    fontFamily: 'Poppins-SemiBold',
    color: '#B91C1C',
    marginTop: 4,
  },
  resumoLabel: { fontSize: 12, fontFamily: 'Poppins-Regular', color: '#7A8A7C', marginTop: 2 },

  lista: { padding: 12, paddingBottom: 100 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EAEFEA',
  },
  cardIcone: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardNome: { fontSize: 15, fontFamily: 'Poppins-SemiBold', color: '#255336', marginBottom: 2 },
  cardSub: { fontSize: 12, fontFamily: 'Poppins-Regular', color: '#7A8A7C' },
  cardValor: { fontSize: 15, fontFamily: 'Poppins-SemiBold', color: '#B91C1C' },

  vazio: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 24 },
  vazioTitulo: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#255336',
  },
  vazioSub: {
    marginTop: 6,
    fontSize: 13,
    color: '#7A8A7C',
    textAlign: 'center',
    lineHeight: 18,
  },
})
