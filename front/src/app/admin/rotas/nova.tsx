import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import ActionButton from '../../../components/admin/ActionButton'
import FormInput from '../../../components/admin/FormInput'
import { useAdmin, useAdminGuard, useAdminTitulo } from '../../../contexts/AdminContext'
import { adminFetch } from '../../../utils/adminApi'
import { entregadoresService } from '../../../services/entregadores'
import { rotasService } from '../../../services/rotas'
import type { Entregador } from '../../../types/api'

interface PedidoSelecionado {
  id: number
  cliente: string
  endereco: string
  bairro?: string
  valor: number
}

export default function NovaRota() {
  useAdminGuard(2)
  useAdminTitulo('Nova Rota')
  const { admin } = useAdmin()
  const router = useRouter()
  const { pedidos: pedidosParam } = useLocalSearchParams<{ pedidos?: string }>()

  const idsIniciais = useMemo<number[]>(() => {
    if (!pedidosParam) return []
    return String(pedidosParam)
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0)
  }, [pedidosParam])

  const [carregandoPedidos, setCarregandoPedidos] = useState(true)
  const [pedidos, setPedidos] = useState<PedidoSelecionado[]>([])
  const [entregadores, setEntregadores] = useState<Entregador[]>([])
  const [entregadorId, setEntregadorId] = useState<number | null>(null)
  const [nome, setNome] = useState('')
  const [salvando, setSalvando] = useState(false)

  // Carrega entregadores ativos
  useEffect(() => {
    if (!admin?.token) return
    entregadoresService
      .listar(admin.token, { ativo: true })
      .then((data) => {
        setEntregadores(data)
        // Pré-seleciona o primeiro se só houver um
        if (data.length === 1) setEntregadorId(data[0].id)
      })
      .catch((e) => Alert.alert('Erro', e?.message ?? 'Falha ao carregar entregadores'))
  }, [admin?.token])

  // Carrega detalhes dos pedidos selecionados (pra mostrar nome/endereço)
  useEffect(() => {
    if (!admin?.token || idsIniciais.length === 0) {
      setCarregandoPedidos(false)
      return
    }
    let cancelado = false
    ;(async () => {
      try {
        setCarregandoPedidos(true)
        const promessas = idsIniciais.map((id) =>
          adminFetch(`/pedido/${id}`, undefined, admin.token).then((r) =>
            r.ok ? r.json() : null,
          ),
        )
        const resultados = await Promise.all(promessas)
        if (cancelado) return
        const mapeados: PedidoSelecionado[] = resultados
          .filter((p) => p && p.id)
          .map((p: any) => {
            // Endereço de entrega vem do endereço PRINCIPAL do cliente.
            const endPrincipal =
              Array.isArray(p.usuario?.enderecos)
                ? p.usuario.enderecos.find((e: any) => e.principal) ??
                  p.usuario.enderecos[0]
                : null
            return {
              id: Number(p.id),
              cliente: p.usuario?.nome ?? `Cliente #${p.usuario_id ?? p.id}`,
              endereco: endPrincipal
                ? [endPrincipal.endereco, endPrincipal.numero]
                    .filter(Boolean)
                    .join(', ') || 'Sem endereço cadastrado'
                : 'Sem endereço cadastrado',
              bairro: endPrincipal?.bairro || undefined,
              valor: Number(p.valor_total ?? p.total ?? 0),
            }
          })
        setPedidos(mapeados)
      } catch (e: any) {
        Alert.alert('Erro', e?.message ?? 'Falha ao carregar detalhes dos pedidos')
      } finally {
        if (!cancelado) setCarregandoPedidos(false)
      }
    })()
    return () => {
      cancelado = true
    }
  }, [admin?.token, idsIniciais])

  function moverParaCima(idx: number) {
    if (idx <= 0) return
    setPedidos((prev) => {
      const novo = [...prev]
      ;[novo[idx - 1], novo[idx]] = [novo[idx], novo[idx - 1]]
      return novo
    })
  }

  function moverParaBaixo(idx: number) {
    setPedidos((prev) => {
      if (idx >= prev.length - 1) return prev
      const novo = [...prev]
      ;[novo[idx + 1], novo[idx]] = [novo[idx], novo[idx + 1]]
      return novo
    })
  }

  function removerPedido(idx: number) {
    setPedidos((prev) => prev.filter((_, i) => i !== idx))
  }

  async function salvar(opts: { iniciar: boolean }) {
    if (!admin?.token) return

    if (!entregadorId) {
      Alert.alert('Atenção', 'Selecione um entregador.')
      return
    }
    if (pedidos.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos um pedido para a rota.')
      return
    }

    setSalvando(true)
    try {
      // 1. Cria a rota em rascunho com a ordem manual atual
      const rotaCriada = await rotasService.criar(admin.token, {
        nome: nome.trim() || undefined,
        entregador_id: entregadorId,
        pedido_ids: pedidos.map((p) => p.id),
      })

      // 2. Se pediu pra iniciar, dispara PATCH /iniciar
      if (opts.iniciar) {
        await rotasService.iniciar(admin.token, rotaCriada.id)
      }

      // 3. Navega pro detalhe da rota
      router.replace(`/admin/rotas/${rotaCriada.id}` as any)
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e?.message ?? 'Falha desconhecida')
    } finally {
      setSalvando(false)
    }
  }

  if (carregandoPedidos) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#255336" />
        <Text style={{ marginTop: 12, color: '#666' }}>Carregando pedidos...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.secao}>
          <Ionicons name="information-circle-outline" size={15} color="#255336" /> Dados da Rota
        </Text>

        <FormInput
          label="Nome (opcional)"
          value={nome}
          onChangeText={setNome}
          placeholder="Ex: Rota Centro - Manhã"
          autoCapitalize="words"
        />

        <Text style={styles.label}>Entregador *</Text>
        {entregadores.length === 0 ? (
          <View style={styles.aviso}>
            <Ionicons name="warning-outline" size={18} color="#92400E" />
            <View style={{ flex: 1 }}>
              <Text style={styles.avisoText}>
                Nenhum entregador ativo cadastrado.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/admin/entregadores/novo' as any)}
              >
                <Text style={styles.avisoLink}>Cadastrar entregador →</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tabRow}>
              {entregadores.map((e) => (
                <TouchableOpacity
                  key={e.id}
                  style={[styles.tab, entregadorId === e.id && styles.tabAtivo]}
                  onPress={() => setEntregadorId(e.id)}
                >
                  <Ionicons
                    name={
                      e.veiculo === 'moto'
                        ? 'bicycle'
                        : e.veiculo === 'carro'
                        ? 'car'
                        : 'person'
                    }
                    size={14}
                    color={entregadorId === e.id ? '#FFF' : '#255336'}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      entregadorId === e.id && styles.tabTextoAtivo,
                    ]}
                  >
                    {e.nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.secao}>
          <Ionicons name="location-outline" size={15} color="#255336" /> Paradas ({pedidos.length})
        </Text>
        <Text style={styles.helpTopo}>
          Use as setas para ordenar manualmente. Você poderá otimizar
          automaticamente na próxima tela.
        </Text>

        {pedidos.length === 0 ? (
          <View style={styles.vazio}>
            <Ionicons name="basket-outline" size={48} color="#CCC" />
            <Text style={styles.vazioText}>
              Nenhum pedido selecionado. Volte e selecione pedidos em "Em Preparação".
            </Text>
          </View>
        ) : (
          pedidos.map((p, idx) => (
            <View key={p.id} style={styles.parada}>
              <View style={styles.paradaOrdem}>
                <Text style={styles.paradaOrdemText}>{idx + 1}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.paradaCliente}>{p.cliente}</Text>
                <Text style={styles.paradaEnd}>
                  {p.endereco}
                  {p.bairro ? ` · ${p.bairro}` : ''}
                </Text>
                <Text style={styles.paradaMeta}>
                  Pedido #{p.id} · R$ {p.valor.toFixed(2)}
                </Text>
              </View>

              <View style={styles.paradaAcoes}>
                <TouchableOpacity
                  style={styles.btnIcone}
                  onPress={() => moverParaCima(idx)}
                  disabled={idx === 0}
                >
                  <Ionicons
                    name="chevron-up"
                    size={18}
                    color={idx === 0 ? '#CCC' : '#255336'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnIcone}
                  onPress={() => moverParaBaixo(idx)}
                  disabled={idx === pedidos.length - 1}
                >
                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={idx === pedidos.length - 1 ? '#CCC' : '#255336'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnIcone, { borderColor: '#DC2626' }]}
                  onPress={() => removerPedido(idx)}
                >
                  <Ionicons name="close" size={18} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.botoes}>
        <ActionButton
          label="Salvar como Rascunho"
          onPress={() => salvar({ iniciar: false })}
          loading={salvando}
        />
        <View style={{ height: 10 }} />
        <ActionButton
          label="Salvar e Iniciar Rota"
          onPress={() => salvar({ iniciar: true })}
          loading={salvando}
          icon="play"
        />
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7E4' },
  content: { padding: 16, paddingBottom: 32 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF7E4' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  secao: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#255336',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    marginBottom: 8,
    marginTop: 8,
  },
  helpTopo: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
  },

  tabRow: { flexDirection: 'row', gap: 8 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#255336',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  tabAtivo: { backgroundColor: '#255336' },
  tabText: { fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#255336' },
  tabTextoAtivo: { color: '#FFFFFF' },

  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  avisoText: { fontSize: 13, color: '#92400E' },
  avisoLink: {
    marginTop: 4,
    fontSize: 12,
    color: '#92400E',
    fontFamily: 'Poppins-SemiBold',
    textDecorationLine: 'underline',
  },

  vazio: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  vazioText: { fontSize: 13, color: '#999', textAlign: 'center' },

  parada: {
    flexDirection: 'row',
    alignItems: 'center',
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
  paradaOrdemText: {
    color: '#FFF',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
  },
  paradaCliente: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#333' },
  paradaEnd: { fontSize: 12, color: '#666', marginTop: 2 },
  paradaMeta: { fontSize: 11, color: '#999', marginTop: 2 },
  paradaAcoes: { flexDirection: 'row', gap: 4 },
  btnIcone: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#255336',
    alignItems: 'center',
    justifyContent: 'center',
  },

  botoes: { marginTop: 8 },
})
