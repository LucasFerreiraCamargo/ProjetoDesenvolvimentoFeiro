/**
 * Tela: Perdas e Quebras (admin / feirante).
 *
 * Permite registrar baixa manual de estoque por perda/quebra (produto
 * estragado, danificado, vencido, etc.). Cada registro:
 *   - baixa o estoque da mercadoria na unidade-base (KG p/ PESO, UN/CX);
 *   - grava um lançamento PERDA no livro-razão (MovimentacaoEstoque).
 *
 * Endpoints:
 *   GET  /mercadorias/feirantes/:feiranteId   (lista do feirante)
 *   GET  /mercadorias                          (superadmin — todas)
 *   POST /mercadorias/:id/perda                { quantidade, motivo? }
 */

import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import React from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import ActionButton from '../../components/admin/ActionButton'
import { useAdmin, useAdminGuard, useAdminTitulo } from '../../contexts/AdminContext'
import { adminFetch } from '../../utils/adminApi'
import type { Mercadoria } from '../../types/api'

const IMAGEM_PADRAO = require('../../../assets/images/produto-padrao.png')

/** Unidade-base de estoque para exibição (kg p/ PESO, senão a própria unidade). */
function unidadeBase(m: Mercadoria): string {
  return String(m.tipo_controle).toUpperCase() === 'PESO'
    ? 'kg'
    : String(m.unidade ?? 'un').toLowerCase()
}

/** Formata o saldo respeitando a unidade (UN/CX inteiro, KG com decimais). */
function fmtSaldo(m: Mercadoria): string {
  const q = Number(m.quantidade ?? 0)
  const u = unidadeBase(m)
  const casas = u === 'kg' ? 3 : 0
  return `${q.toLocaleString('pt-BR', { maximumFractionDigits: casas })} ${u}`
}

export default function PerdasScreen() {
  useAdminGuard(2)
  useAdminTitulo('Perdas e Quebras')
  const { admin } = useAdmin()
  const router = useRouter()

  const [mercadorias, setMercadorias] = React.useState<Mercadoria[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [busca, setBusca] = React.useState('')

  // Estado do modal de registro de perda.
  const [selecionada, setSelecionada] = React.useState<Mercadoria | null>(null)
  const [qtd, setQtd] = React.useState('')
  const [motivo, setMotivo] = React.useState('')
  const [salvando, setSalvando] = React.useState(false)

  const carregar = React.useCallback(async () => {
    if (!admin?.token) return
    try {
      const path =
        admin.nivel >= 3
          ? '/mercadorias'
          : `/mercadorias/feirantes/${admin.feiranteId}`
      const res = await adminFetch(path, undefined, admin.token)
      const data = res.ok ? await res.json() : []
      setMercadorias(Array.isArray(data) ? data : [])
    } catch (e) {
      console.warn('[perdas] erro ao carregar:', e)
      setMercadorias([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [admin?.token, admin?.nivel, admin?.feiranteId])

  useFocusEffect(
    React.useCallback(() => {
      carregar()
    }, [carregar]),
  )

  function abrirModal(m: Mercadoria) {
    setSelecionada(m)
    setQtd('')
    setMotivo('')
  }

  function fecharModal() {
    if (salvando) return
    setSelecionada(null)
  }

  async function registrarPerda() {
    if (!selecionada) return
    const quantidade = Number(qtd.replace(',', '.'))
    if (!Number.isFinite(quantidade) || quantidade <= 0) {
      return
    }
    const estoque = Number(selecionada.quantidade ?? 0)
    if (quantidade > estoque) {
      return
    }

    setSalvando(true)
    try {
      const res = await adminFetch(
        `/mercadorias/${selecionada.id}/perda`,
        {
          method: 'POST',
          body: JSON.stringify({ quantidade, motivo: motivo.trim() || null }),
        },
        admin!.token,
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        console.warn('[perdas] erro API:', data)
        setSalvando(false)
        return
      }
      // Atualiza o saldo local com o saldo_posterior retornado.
      const novoSaldo = Number(data?.saldoPosterior ?? estoque - quantidade)
      setMercadorias((prev) =>
        prev.map((m) =>
          m.id === selecionada.id ? { ...m, quantidade: novoSaldo } : m,
        ),
      )
      setSelecionada(null)
    } catch (e) {
      console.error('[perdas] exceção:', e)
    } finally {
      setSalvando(false)
    }
  }

  const termo = busca.trim().toLowerCase()
  const lista = termo
    ? mercadorias.filter((m) => m.nome.toLowerCase().includes(termo))
    : mercadorias

  // Validação reativa do formulário do modal.
  const qtdNum = Number(qtd.replace(',', '.'))
  const estoqueSel = Number(selecionada?.quantidade ?? 0)
  const qtdValida = Number.isFinite(qtdNum) && qtdNum > 0 && qtdNum <= estoqueSel
  const qtdExcede = Number.isFinite(qtdNum) && qtdNum > estoqueSel

  function renderItem({ item }: { item: Mercadoria }) {
    const semEstoque = Number(item.quantidade ?? 0) <= 0
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => !semEstoque && abrirModal(item)}
        disabled={semEstoque}
      >
        <Image
          source={item.foto ? { uri: item.foto } : IMAGEM_PADRAO}
          style={styles.foto}
          resizeMode="cover"
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.nome} numberOfLines={1}>
            {item.nome}
          </Text>
          <Text style={[styles.saldo, semEstoque && styles.saldoZero]}>
            {semEstoque ? 'Sem estoque' : `Estoque: ${fmtSaldo(item)}`}
          </Text>
        </View>
        {!semEstoque && (
          <View style={styles.acaoPerda}>
            <Ionicons name="trash-bin-outline" size={16} color="#B91C1C" />
            <Text style={styles.acaoPerdaText}>Perda</Text>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color="#4A7C59" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.buscaWrap}>
        <Ionicons name="search" size={18} color="#9AA89A" />
        <TextInput
          style={styles.buscaInput}
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar mercadoria..."
          placeholderTextColor="#9AA89A"
        />
        {busca.length > 0 && (
          <TouchableOpacity onPress={() => setBusca('')}>
            <Ionicons name="close-circle" size={18} color="#9AA89A" />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={styles.relatorioLink}
        activeOpacity={0.8}
        onPress={() => router.push('/admin/relatorio-perdas')}
      >
        <Ionicons name="bar-chart-outline" size={16} color="#255336" />
        <Text style={styles.relatorioLinkText}>Relatório de perdas por período</Text>
        <Ionicons name="chevron-forward" size={16} color="#9AA89A" />
      </TouchableOpacity>

      <FlatList
        data={lista}
        keyExtractor={(m) => String(m.id)}
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
            <Ionicons name="cube-outline" size={48} color="#CBD5C2" />
            <Text style={styles.vazioTitulo}>Nenhuma mercadoria</Text>
            <Text style={styles.vazioSub}>
              Cadastre mercadorias para poder registrar perdas e quebras.
            </Text>
          </View>
        }
      />

      {/* Modal de registro de perda */}
      <Modal
        visible={selecionada !== null}
        transparent
        animationType="fade"
        onRequestClose={fecharModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIcone}>
                <Ionicons name="warning-outline" size={20} color="#B91C1C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitulo} numberOfLines={1}>
                  Registrar perda
                </Text>
                <Text style={styles.modalSub} numberOfLines={1}>
                  {selecionada?.nome}
                </Text>
              </View>
              <TouchableOpacity onPress={fecharModal} disabled={salvando}>
                <Ionicons name="close" size={22} color="#999" />
              </TouchableOpacity>
            </View>

            {selecionada && (
              <Text style={styles.modalEstoque}>
                Estoque atual: {fmtSaldo(selecionada)}
              </Text>
            )}

            <Text style={styles.label}>
              Quantidade perdida ({selecionada ? unidadeBase(selecionada) : ''})
            </Text>
            <TextInput
              style={[styles.input, qtdExcede && styles.inputErro]}
              value={qtd}
              onChangeText={setQtd}
              keyboardType="decimal-pad"
              placeholder="0,000"
              placeholderTextColor="#B8B8B8"
            />
            {qtdExcede && (
              <Text style={styles.erroTexto}>
                A quantidade não pode ser maior que o estoque.
              </Text>
            )}

            <Text style={styles.label}>Motivo (opcional)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={motivo}
              onChangeText={setMotivo}
              placeholder="Ex.: produto estragado, danificado no transporte..."
              placeholderTextColor="#B8B8B8"
              multiline
              numberOfLines={2}
            />

            <View style={{ marginTop: 16 }}>
              <ActionButton
                label="Registrar perda"
                onPress={registrarPerda}
                loading={salvando}
                variant="danger"
                icon="trash-bin-outline"
                disabled={!qtdValida}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7E4' },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  buscaWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#EAEFEA',
  },
  buscaInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#333',
    padding: 0,
  },

  relatorioLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF',
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#EAEFEA',
  },
  relatorioLinkText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#255336',
  },

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
  foto: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  nome: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    color: '#255336',
    marginBottom: 3,
  },
  saldo: { fontSize: 13, fontFamily: 'Poppins-Regular', color: '#4A7C59' },
  saldoZero: { color: '#B0B0B0' },
  acaoPerda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  acaoPerdaText: { fontSize: 12, fontFamily: 'Poppins-SemiBold', color: '#B91C1C' },

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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  modalIcone: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitulo: { fontSize: 16, fontFamily: 'Poppins-SemiBold', color: '#333' },
  modalSub: { fontSize: 13, fontFamily: 'Poppins-Regular', color: '#777' },
  modalEstoque: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#4A7C59',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    color: '#555',
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D5E0D5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: '#333',
    backgroundColor: '#F8FBF8',
  },
  inputMultiline: { minHeight: 56, textAlignVertical: 'top' },
  inputErro: { borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  erroTexto: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#B91C1C',
    marginTop: 4,
  },
})
