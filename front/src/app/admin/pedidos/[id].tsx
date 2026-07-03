import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import ActionButton from '../../../components/admin/ActionButton'
import ConfirmModal from '../../../components/admin/ConfirmModal'
import StatusBadge from '../../../components/admin/StatusBadge'
import { useAdmin, useAdminGuard, useAdminTitulo } from '../../../contexts/AdminContext'
import { adminFetch } from '../../../utils/adminApi'
import type { PedidoItem, Unidade } from '../../../types/api'

// Fallback usado quando a mercadoria não tem foto cadastrada.
const IMAGEM_PADRAO_PRODUTO = require('../../../../assets/images/produto-padrao.png')

/** Formata a quantidade respeitando a unidade da mercadoria.
 *   - UN/CX  → "2 unids" / "3 cxs"
 *   - KG     → "0,500 kg" (3 casas para refletir gramas com precisão)
 */
function formatarQuantidade(qtd: number, unidade?: Unidade | string | null): string {
  const u = String(unidade ?? 'UN').toUpperCase()
  if (u === 'KG') {
    return `${qtd.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} kg`
  }
  if (u === 'CX') {
    return `${qtd.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} ${qtd === 1 ? 'cx' : 'cxs'}`
  }
  return `${qtd.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} ${qtd === 1 ? 'unid' : 'unids'}`
}

/** Formata em moeda BRL ("R$ 12,90"). */
function fmtMoeda(v: number): string {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

// Status que aparecem nos chips de transição manual. Os terminais (CANCELADO e
// FINALIZADO) e os transitórios técnicos (EM_ANDAMENTO, ENTREGUE, RETORNANDO)
// ficam fora da escolha do admin — só PENDENTE, EM_PREPARACAO e EM_ROTA aparecem.
const STATUS_OPCOES = [
  'PENDENTE',
  'EM_PREPARACAO',
  'EM_ROTA',
]

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  EM_PREPARACAO: 'Em Prep.',
  EM_ANDAMENTO: 'Em Andamento',
  EM_ROTA: 'Em Rota',
  ENTREGUE: 'Entregue',
  RETORNANDO: 'Retornando',
  CANCELADO: 'Cancelado',
  FINALIZADO: 'Finalizado',
}

export default function PedidoDetalhe() {
  // Feirante (2) e Superadmin (3) podem acessar
  useAdminGuard(2)
  const { id } = useLocalSearchParams<{ id: string }>()
  useAdminTitulo(`Pedido #${id}`)
  const { admin } = useAdmin()
  const router = useRouter()

  const [pedido, setPedido] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [erroFetch, setErroFetch] = useState<string | null>(null)
  const [novoStatus, setNovoStatus] = useState('')
  const [atualizando, setAtualizando] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  // Pesagem: peso real digitado por item (id do item → texto do input).
  const [pesos, setPesos] = useState<Record<number, string>>({})
  const [separando, setSeparando] = useState(false)

  useEffect(() => { fetchPedido() }, [id])

  async function fetchPedido() {
    setLoading(true)
    setErroFetch(null)
    try {
      const res = await adminFetch(`/pedido/${id}`, undefined, admin!.token)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        console.warn('[Pedido.fetch] API erro:', { status: res.status, body: data })
        if (res.status === 404) setErroFetch('Pedido não encontrado')
        else if (res.status === 401 || res.status === 403)
          setErroFetch('Você não tem permissão para visualizar este pedido')
        else setErroFetch(data?.erro || `Erro ${res.status} ao carregar pedido`)
        return
      }
      // Normaliza: a API retorna `items` (inglês) por causa do schema Prisma.
      // O JSX usa `itens` — então mantemos ambos para retro-compatibilidade.
      const itens = data?.items ?? data?.itens ?? []
      setPedido({ ...data, itens, items: itens })
      setNovoStatus(data?.status ?? 'PENDENTE')
    } catch (e: any) {
      console.error('[Pedido.fetch] Exceção:', e)
      setErroFetch(`Erro de conexão: ${e?.message ?? e}`)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Envia PATCH com o status informado. Usado tanto pelos chips quanto pelos
   * botões dedicados (Finalizar / Cancelar / Reabrir).
   *
   * Importante: NÃO mostramos `alert()` de sucesso aqui — a UI já reflete a
   * mudança via banner (verde para finalizado, vermelho para cancelado) e os
   * chips são atualizados. O `alert()` global do RN bloqueava a thread JS
   * de forma inconsistente entre Android/iOS, causando o sintoma de "precisar
   * clicar duas vezes" porque o setState ficava em fila atrás do popup.
   *
   * Erros usam Alert.alert (não `alert(...)`) para ter comportamento previsível.
   */
  async function aplicarStatus(status: string): Promise<boolean> {
    setAtualizando(true)
    try {
      const res = await adminFetch(
        `/pedido/${id}`,
        { method: 'PATCH', body: JSON.stringify({ status }) },
        admin!.token,
      )
      if (res.ok) {
        setPedido((prev: any) => ({ ...prev, status }))
        setNovoStatus(status)
        return true
      }
      const data = await res.json().catch(() => ({}))
      Alert.alert(
        'Erro ao atualizar',
        data.erro || data.error || `Não foi possível atualizar o status (HTTP ${res.status}).`,
      )
      return false
    } catch (e: any) {
      console.error('[Pedido.aplicarStatus] Exceção:', e)
      Alert.alert('Erro de conexão', 'Não foi possível atualizar o status. Verifique sua internet e tente novamente.')
      return false
    } finally {
      setAtualizando(false)
    }
  }

  async function atualizarStatus() {
    await aplicarStatus(novoStatus)
  }

  /**
   * Envia os pesos reais informados para a separação. Converte vírgula em
   * ponto, ignora campos vazios/ inválidos e chama PATCH /pedido/:id/separacao.
   * Em caso de sucesso, recarrega o pedido (peso_real, separado e valor_total
   * já refletidos pela API) e limpa os inputs.
   */
  async function confirmarSeparacao() {
    const itens = Object.entries(pesos)
      .map(([itemId, txt]) => {
        const valor = Number(String(txt).replace(',', '.'))
        return { item_id: Number(itemId), peso_real: valor }
      })
      .filter((i) => Number.isFinite(i.peso_real) && i.peso_real > 0)

    if (itens.length === 0) {
      Alert.alert('Pesagem', 'Informe o peso real de ao menos um item.')
      return
    }

    setSeparando(true)
    try {
      const res = await adminFetch(
        `/pedido/${id}/separacao`,
        { method: 'PATCH', body: JSON.stringify({ itens }) },
        admin!.token,
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        Alert.alert(
          'Erro na pesagem',
          data?.detalhes || data?.erro || `Não foi possível registrar a pesagem (HTTP ${res.status}).`,
        )
        return
      }
      setPesos({})
      await fetchPedido()
      Alert.alert('Pesagem registrada', 'O estoque e o valor do pedido foram atualizados.')
    } catch (e: any) {
      console.error('[Pedido.confirmarSeparacao] Exceção:', e)
      Alert.alert('Erro de conexão', 'Não foi possível registrar a pesagem. Tente novamente.')
    } finally {
      setSeparando(false)
    }
  }

  function finalizarPedido() {
    Alert.alert(
      'Finalizar Pedido',
      'Deseja marcar esse pedido como Finalizado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Finalizar', onPress: () => aplicarStatus('FINALIZADO') },
      ],
    )
  }

  function cancelarPedido() {
    Alert.alert(
      'Cancelar Pedido',
      'Tem certeza que deseja cancelar este pedido? Esta ação é definitiva — não será possível reabrir um pedido cancelado.',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Cancelar Pedido',
          style: 'destructive',
          onPress: () => aplicarStatus('CANCELADO'),
        },
      ],
    )
  }

  function reabrirPedido() {
    Alert.alert(
      'Reabrir Pedido',
      'Tem certeza que deseja reabrir este pedido? Ele voltará para o status "Em Andamento".',
      [
        { text: 'Não', style: 'cancel' },
        { text: 'Sim, reabrir', onPress: () => aplicarStatus('EM_ANDAMENTO') },
      ],
    )
  }


  async function deletarPedido() {
    setDeleting(true)
    try {
      await adminFetch(`/pedido/${id}`, { method: 'DELETE' }, admin!.token)
      router.back()
    } catch { alert('Erro ao excluir pedido') }
    setDeleting(false)
    setShowDelete(false)
  }

  const formatarData = (d: string) => {
    if (!d) return ''
    try { return new Date(d).toLocaleString('pt-BR') } catch { return d }
  }

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#255336" /></View>
  }

  if (!pedido) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.erro}>{erroFetch || 'Pedido não encontrado'}</Text>
      </View>
    )
  }

  // Soma dos subtotais dos itens (qtd × preço_unitário). Quando o pedido
  // não tem `items` ainda, cai pro `valor_total` retornado pela API.
  const itensPedido: PedidoItem[] = (pedido.items ?? pedido.itens ?? []) as PedidoItem[]
  const somaItens = itensPedido.reduce((acc: number, item: PedidoItem) => {
    const preco = Number(item.preco_unitario ?? 0)
    const qtd = Number(item.quantidade ?? 0)
    return acc + preco * qtd
  }, 0)
  const valorPedido = Number(pedido.valor_total ?? 0)
  // Discrepância: soma calculada vs valor_total persistido no banco.
  // Tolerância de 1 centavo pra arredondamentos Decimal.
  const discrepancia =
    itensPedido.length > 0 && Math.abs(somaItens - valorPedido) > 0.01

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.pedidoTitulo}>Pedido #{pedido.id}</Text>
        <Text style={styles.pedidoData}>
          {formatarData(pedido.createdAt ?? pedido.created_at ?? pedido.data)}
        </Text>
        <StatusBadge status={pedido.status ?? 'PENDENTE'} />
      </View>

      {pedido.usuario && (() => {
        // Endereço principal do cliente para exibir como "entrega".
        // (Snapshot por pedido fica para evolução futura — por ora pega o atual.)
        const enderecoPrincipal = Array.isArray(pedido.usuario.enderecos)
          ? pedido.usuario.enderecos.find((e: any) => e.principal) ??
            pedido.usuario.enderecos[0]
          : null;
        const enderecoFormatado = enderecoPrincipal
          ? [
              `${enderecoPrincipal.endereco}${enderecoPrincipal.numero ? `, ${enderecoPrincipal.numero}` : ""}`,
              enderecoPrincipal.complemento,
              [enderecoPrincipal.bairro, enderecoPrincipal.cidade, enderecoPrincipal.uf]
                .filter(Boolean)
                .join(" • "),
              enderecoPrincipal.cep ? `CEP: ${enderecoPrincipal.cep}` : null,
            ]
              .filter(Boolean)
              .join("\n")
          : null;
        return (
        <View style={styles.card}>
          <Text style={styles.secaoTitulo}>Cliente</Text>
          <Text style={styles.campo}>Nome: {pedido.usuario.nome}</Text>
          <Text style={styles.campo}>E-mail: {pedido.usuario.email}</Text>
          {pedido.usuario.telefone ? (
            <Text style={styles.campo}>Telefone: {pedido.usuario.telefone}</Text>
          ) : null}
          {enderecoFormatado ? (
            <Text style={styles.campo}>Endereço de entrega:{"\n"}{enderecoFormatado}</Text>
          ) : null}

          {/* Chat em tempo real com o cliente — só enquanto o pedido está
              em andamento. */}
          {pedido?.status &&
            !["PENDENTE", "CANCELADO", "FINALIZADO"].includes(pedido.status) ? (
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() =>
                router.push({
                  pathname: "/chat/[pedidoId]",
                  params: { pedidoId: String(pedido.id) },
                })
              }
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubbles" size={20} color="#FFFFFF" />
              <Text style={styles.chatBtnText}>Conversar com cliente</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        );
      })()}

      {itensPedido.length > 0 && (
        <View style={styles.card}>
          <View style={styles.secaoHeaderRow}>
            <Text style={styles.secaoTitulo}>Itens do Pedido</Text>
            <Text style={styles.secaoContador}>
              {itensPedido.length}{' '}
              {itensPedido.length === 1 ? 'item' : 'itens'}
            </Text>
          </View>

          {itensPedido.map((item: PedidoItem, i: number) => {
            const merc = item.mercadoria
            const foto = merc?.foto ?? null
            const nome = merc?.nome ?? `Mercadoria #${item.mercadoria_id}`
            const unidade = merc?.unidade ?? 'UN'
            const precoUnit = Number(item.preco_unitario ?? 0)
            const qtd = Number(item.quantidade ?? 0)
            const subtotal = precoUnit * qtd
            // Sufixo de unidade pro preço unitário: "/kg" ou "/un"
            const sufixoPreco =
              String(unidade).toUpperCase() === 'KG'
                ? '/kg'
                : String(unidade).toUpperCase() === 'CX'
                ? '/cx'
                : '/un'

            return (
              <View key={i} style={styles.itemRow}>
                <Image
                  source={foto ? { uri: foto } : IMAGEM_PADRAO_PRODUTO}
                  style={styles.itemThumb}
                  resizeMode="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemNome} numberOfLines={1}>
                    {nome}
                  </Text>
                  <Text style={styles.itemQtdLinha}>
                    {formatarQuantidade(qtd, unidade)}
                  </Text>
                  <Text style={styles.itemPrecoUnit}>
                    {fmtMoeda(precoUnit)}
                    {sufixoPreco}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.itemSubtotalLabel}>Subtotal</Text>
                  <Text style={styles.itemTotal}>{fmtMoeda(subtotal)}</Text>
                </View>
              </View>
            )
          })}

          {/* Soma dos itens (computada) */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total dos itens</Text>
            <Text style={styles.totalValor}>{fmtMoeda(somaItens)}</Text>
          </View>

          {/* Aviso quando a soma calculada não bate com o `valor_total`
              persistido (defesa contra pedidos com items desatualizados). */}
          {discrepancia && (
            <View style={styles.discrepanciaBox}>
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color="#A66A00"
              />
              <Text style={styles.discrepanciaTexto}>
                A soma calculada ({fmtMoeda(somaItens)}) não bate com o valor
                registrado no pedido ({fmtMoeda(valorPedido)}). Verifique os
                itens antes de finalizar.
              </Text>
            </View>
          )}
        </View>
      )}

      {(() => {
        // Separação/pesagem: só itens controlados por PESO entram aqui.
        const itensPeso = itensPedido.filter(
          (it) => String(it.mercadoria?.tipo_controle).toUpperCase() === 'PESO',
        )
        const statusAtual: string = pedido.status ?? 'PENDENTE'
        const bloqueado = statusAtual === 'CANCELADO' || statusAtual === 'FINALIZADO'
        if (itensPeso.length === 0 || bloqueado) return null

        const fmtKg = (v: number) =>
          `${v.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} kg`
        const pendentes = itensPeso.filter((it) => !it.separado)

        return (
          <View style={styles.card}>
            <View style={styles.secaoHeaderRow}>
              <Text style={styles.secaoTitulo}>Separação / Pesagem</Text>
              <Text style={styles.secaoContador}>
                {itensPeso.length - pendentes.length}/{itensPeso.length} pesados
              </Text>
            </View>
            <Text style={styles.pesagemAjuda}>
              Pese cada item e informe o peso real. O estoque e o valor do pedido
              são corrigidos automaticamente.
            </Text>

            {itensPeso.map((it) => {
              const nome = it.mercadoria?.nome ?? `Mercadoria #${it.mercadoria_id}`
              const estimado = Number(it.peso_estimado ?? 0)
              const real = it.peso_real != null ? Number(it.peso_real) : null
              return (
                <View key={it.id} style={styles.pesagemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pesagemNome} numberOfLines={1}>
                      {nome}
                    </Text>
                    <Text style={styles.pesagemEstimado}>
                      Estimado: {fmtKg(estimado)}
                    </Text>
                  </View>
                  {it.separado && real != null ? (
                    <View style={styles.pesagemOk}>
                      <Ionicons name="checkmark-circle" size={16} color="#065F46" />
                      <Text style={styles.pesagemOkText}>{fmtKg(real)}</Text>
                    </View>
                  ) : (
                    <View style={styles.pesagemInputWrap}>
                      <TextInput
                        style={styles.pesagemInput}
                        value={pesos[it.id] ?? ''}
                        onChangeText={(t) =>
                          setPesos((prev) => ({ ...prev, [it.id]: t }))
                        }
                        keyboardType="decimal-pad"
                        placeholder={estimado ? String(estimado) : '0,000'}
                        placeholderTextColor="#B8B8B8"
                      />
                      <Text style={styles.pesagemUnidade}>kg</Text>
                    </View>
                  )}
                </View>
              )
            })}

            {pendentes.length > 0 && (
              <View style={{ marginTop: 14 }}>
                <ActionButton
                  label="Confirmar pesagem"
                  onPress={confirmarSeparacao}
                  loading={separando}
                  icon="scale-outline"
                />
              </View>
            )}
          </View>
        )
      })()}

      {(() => {
        const statusAtual: string = pedido.status ?? 'PENDENTE'
        const cancelado = statusAtual === 'CANCELADO'
        const finalizado = statusAtual === 'FINALIZADO'
        // Estados terminais bloqueiam edição de chips e o botão Finalizar.
        const bloqueado = cancelado || finalizado

        return (
          <View style={styles.card}>
            <Text style={styles.secaoTitulo}>Atualizar Status do Pedido</Text>

            {cancelado ? (
              <View style={styles.statusFinalBox}>
                <Ionicons name="close-circle" size={20} color="#B91C1C" />
                <Text style={styles.statusFinalTexto}>
                  Pedido cancelado — não pode ser reaberto.
                </Text>
              </View>
            ) : finalizado ? (
              <View style={[styles.statusFinalBox, styles.statusFinalBoxOk]}>
                <Ionicons name="checkmark-done" size={20} color="#065F46" />
                <Text style={[styles.statusFinalTexto, styles.statusFinalTextoOk]}>
                  Pedido finalizado. Você pode reabri-lo se necessário.
                </Text>
              </View>
            ) : null}

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {STATUS_OPCOES.map((s) => {
                  const ativo = novoStatus === s
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.chip,
                        ativo && styles.chipAtivo,
                        bloqueado && styles.chipBloqueado,
                      ]}
                      onPress={() => !bloqueado && setNovoStatus(s)}
                      disabled={bloqueado}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          ativo && styles.chipTextoAtivo,
                          bloqueado && styles.chipTextoBloqueado,
                        ]}
                      >
                        {STATUS_LABELS[s] ?? s}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </ScrollView>

            {!bloqueado && (
              <>
                <View style={{ marginTop: 16 }}>
                  <ActionButton
                    label="Confirmar Atualização"
                    onPress={atualizarStatus}
                    loading={atualizando}
                  />
                </View>
                <Text style={styles.aviso}>⚠️ O cliente receberá um e-mail automático</Text>
              </>
            )}

            {/* Ações terminais dedicadas */}
            <View style={styles.acoesTerminais}>
              {!bloqueado && (
                <>
                  <ActionButton
                    label="Finalizar Pedido"
                    onPress={finalizarPedido}
                    loading={atualizando}
                    icon="checkmark-done-outline"
                  />
                  <View style={{ height: 10 }} />
                  <ActionButton
                    label="Cancelar Pedido"
                    onPress={cancelarPedido}
                    loading={atualizando}
                    variant="danger"
                    icon="close-circle-outline"
                  />
                </>
              )}

              {finalizado && (
                <ActionButton
                  label="Reabrir Pedido"
                  onPress={reabrirPedido}
                  loading={atualizando}
                  icon="refresh-outline"
                />
              )}
            </View>
          </View>
        )
      })()}

      {admin?.nivel === 3 && (
        <ActionButton
          label="Excluir Pedido"
          onPress={() => setShowDelete(true)}
          variant="danger"
          icon="trash-outline"
        />
      )}

      <ConfirmModal
        visible={showDelete}
        titulo="Excluir Pedido"
        mensagem="Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={deletarPedido}
        onCancel={() => setShowDelete(false)}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7E4' },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  erro: { fontSize: 16, fontFamily: 'Poppins-Regular', color: '#999999' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 1,
  },
  pedidoTitulo: { fontSize: 22, fontFamily: 'Poppins-SemiBold', color: '#255336', marginBottom: 4 },
  pedidoData: { fontSize: 14, fontFamily: 'Poppins-Regular', color: '#666666', marginBottom: 12 },
  secaoTitulo: { fontSize: 16, fontFamily: 'Poppins-SemiBold', color: '#333333', marginBottom: 12 },
  campo: { fontSize: 14, fontFamily: 'Poppins-Regular', color: '#333333', marginBottom: 4 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  itemThumbFallback: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemEmoji: { fontSize: 24 },
  chatBtn: {
    marginTop: 12,
    backgroundColor: '#4A7C59',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chatBtnText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins-SemiBold' },
  itemNome: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#333333' },
  itemPrecoUnit: { fontSize: 12, fontFamily: 'Poppins-Regular', color: '#666666' },
  itemQtd: { fontSize: 13, fontFamily: 'Poppins-Regular', color: '#666666' },
  itemQtdLinha: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    color: '#4A7C59',
    marginBottom: 1,
  },
  itemSubtotalLabel: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  itemTotal: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#255336' },
  // Cabeçalho da seção "Itens do Pedido" com contador à direita
  secaoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  secaoContador: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#999999',
  },
  // Banner amarelo de aviso quando a soma calculada não bate com valor_total
  discrepanciaBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFF8E6',
    borderWidth: 1,
    borderColor: '#F2D88D',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  discrepanciaTexto: {
    flex: 1,
    fontSize: 12,
    color: '#7A4F00',
    lineHeight: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: { fontSize: 16, fontFamily: 'Poppins-SemiBold', color: '#333333' },
  totalValor: { fontSize: 18, fontFamily: 'Poppins-SemiBold', color: '#255336' },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipAtivo: { backgroundColor: '#255336', borderColor: '#255336' },
  chipText: { fontSize: 12, fontFamily: 'Poppins-SemiBold', color: '#666666' },
  chipTextoAtivo: { color: '#FFFFFF' },
  aviso: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#999999',
    textAlign: 'center',
    marginTop: 12,
  },
  chipBloqueado: { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0', opacity: 0.7 },
  chipTextoBloqueado: { color: '#999999' },
  statusFinalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  statusFinalBoxOk: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  statusFinalTexto: {
    fontSize: 13,
    color: '#B91C1C',
    fontFamily: 'Poppins-SemiBold',
    flex: 1,
  },
  statusFinalTextoOk: { color: '#065F46' },
  acoesTerminais: { marginTop: 16 },

  // ─────────── Separação / pesagem ───────────
  pesagemAjuda: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#7A8A7C',
    lineHeight: 16,
    marginBottom: 12,
  },
  pesagemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  pesagemNome: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
  },
  pesagemEstimado: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#999999',
    marginTop: 1,
  },
  pesagemInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#D5E0D5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8FBF8',
    minWidth: 100,
  },
  pesagemInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    color: '#255336',
    padding: 0,
    textAlign: 'right',
  },
  pesagemUnidade: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#7A8A7C',
  },
  pesagemOk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pesagemOkText: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    color: '#065F46',
  },
})
