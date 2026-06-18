import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import ActionButton from '../../../components/admin/ActionButton'
import ConfirmModal from '../../../components/admin/ConfirmModal'
import StatusBadge from '../../../components/admin/StatusBadge'
import { useAdmin, useAdminGuard, useAdminTitulo } from '../../../contexts/AdminContext'
import { adminFetch } from '../../../utils/adminApi'

/**
 * Converte um telefone do banco (pode vir com máscara) num número
 * pronto pra ser usado em wa.me. Retorna null se não houver dígitos suficientes.
 * Assume Brasil (55) quando vier sem código do país.
 */
function normalizaTelefoneParaWhatsapp(tel?: string | null): string | null {
  if (!tel) return null
  const digitos = String(tel).replace(/\D/g, '')
  if (digitos.length < 10) return null // muito curto pra ser fixo+DDD válido
  // Se já tem código de país (55), mantém. Senão prefixa.
  if (digitos.startsWith('55') && digitos.length >= 12) return digitos
  return `55${digitos}`
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

  async function abrirWhatsapp() {
    const telefone = normalizaTelefoneParaWhatsapp(pedido?.usuario?.telefone)
    if (!telefone) {
      Alert.alert('Telefone indisponível', 'Este cliente não tem telefone cadastrado.')
      return
    }
    const nomeCliente = pedido?.usuario?.nome ?? 'cliente'
    const saudacao = `Olá ${nomeCliente}, aqui é do Feirô. Estou entrando em contato sobre o seu pedido #${pedido.id}.`
    const mensagem = encodeURIComponent(saudacao)
    const url = `https://wa.me/${telefone}?text=${mensagem}`
    try {
      const podeAbrir = await Linking.canOpenURL(url)
      if (!podeAbrir) {
        Alert.alert(
          'WhatsApp indisponível',
          'Não foi possível abrir o WhatsApp neste dispositivo.'
        )
        return
      }
      await Linking.openURL(url)
    } catch (e) {
      console.warn('[Pedido] Falha ao abrir WhatsApp:', e)
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.')
    }
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

  const total =
    pedido.itens?.reduce((acc: number, item: any) => {
      return (
        acc +
        Number(item.preco || item.preco_unitario || 0) *
          Number(item.quantidade || 1)
      )
    }, 0) ??
    Number(pedido.valor_total ?? pedido.total ?? 0)

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

          {/* Botão WhatsApp: só aparece se o cliente tem telefone válido */}
          {normalizaTelefoneParaWhatsapp(pedido.usuario.telefone) ? (
            <TouchableOpacity
              style={styles.whatsappBtn}
              onPress={abrirWhatsapp}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
              <Text style={styles.whatsappBtnText}>Falar pelo WhatsApp</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        );
      })()}

      {pedido.itens && pedido.itens.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.secaoTitulo}>Itens do Pedido</Text>
          {pedido.itens.map((item: any, i: number) => {
            const foto = item.mercadoria?.foto || item.foto || null
            const emoji = item.mercadoria?.emoji ?? item.emoji ?? null
            return (
              <View key={i} style={styles.itemRow}>
                {/* Miniatura: foto se houver, senão emoji do produto, senão ícone genérico */}
                {foto ? (
                  <Image
                    source={{ uri: foto }}
                    style={styles.itemThumb}
                    resizeMode="cover"
                  />
                ) : emoji ? (
                  <View style={styles.itemThumbFallback}>
                    <Text style={styles.itemEmoji}>{emoji}</Text>
                  </View>
                ) : (
                  <View style={styles.itemThumbFallback}>
                    <Ionicons name="leaf-outline" size={22} color="#999" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemNome}>
                    {item.mercadoria?.nome ?? item.nome ?? '—'}
                  </Text>
                  <Text style={styles.itemPrecoUnit}>
                    R$ {Number(item.preco || item.preco_unitario || 0).toFixed(2)}/
                    {item.unidade ?? 'un'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.itemQtd}>{item.quantidade ?? 1}x</Text>
                  <Text style={styles.itemTotal}>
                    R${' '}
                    {(
                      Number(item.preco || item.preco_unitario || 0) *
                      Number(item.quantidade || 1)
                    ).toFixed(2)}
                  </Text>
                </View>
              </View>
            )
          })}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValor}>R$ {total.toFixed(2)}</Text>
          </View>
        </View>
      )}

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
  whatsappBtn: {
    marginTop: 12,
    backgroundColor: '#25D366',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
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
  whatsappBtnText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins-SemiBold' },
  itemNome: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#333333' },
  itemPrecoUnit: { fontSize: 12, fontFamily: 'Poppins-Regular', color: '#666666' },
  itemQtd: { fontSize: 13, fontFamily: 'Poppins-Regular', color: '#666666' },
  itemTotal: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#255336' },
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
})
