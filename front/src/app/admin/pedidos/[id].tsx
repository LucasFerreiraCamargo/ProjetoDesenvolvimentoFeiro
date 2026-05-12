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

const STATUS_OPCOES = [
  'PENDENTE',
  'EM_PREPARACAO',
  'EM_ANDAMENTO',
  'EM_ROTA',
  'ENTREGUE',
  'RETORNANDO',
  'CANCELADO',
]

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  EM_PREPARACAO: 'Em Prep.',
  EM_ANDAMENTO: 'Em Andamento',
  EM_ROTA: 'Em Rota',
  ENTREGUE: 'Entregue',
  RETORNANDO: 'Retornando',
  CANCELADO: 'Cancelado',
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

  async function atualizarStatus() {
    setAtualizando(true)
    try {
      const res = await adminFetch(`/pedido/${id}`, { method: 'PATCH', body: JSON.stringify({ status: novoStatus }) }, admin!.token)
      if (res.ok) {
        setPedido((prev: any) => ({ ...prev, status: novoStatus }))
        alert('Status atualizado com sucesso!')
      } else {
        const data = await res.json()
        alert(data.erro || data.error || 'Erro ao atualizar status')
      }
    } catch { alert('Erro ao atualizar status') }
    setAtualizando(false)
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

      {pedido.usuario && (
        <View style={styles.card}>
          <Text style={styles.secaoTitulo}>Cliente</Text>
          <Text style={styles.campo}>Nome: {pedido.usuario.nome}</Text>
          <Text style={styles.campo}>E-mail: {pedido.usuario.email}</Text>
          {pedido.usuario.telefone ? (
            <Text style={styles.campo}>Telefone: {pedido.usuario.telefone}</Text>
          ) : null}
          {pedido.usuario.endereco ? (
            <Text style={styles.campo}>Endereço: {pedido.usuario.endereco}</Text>
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
      )}

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

      <View style={styles.card}>
        <Text style={styles.secaoTitulo}>Atualizar Status do Pedido</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {STATUS_OPCOES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, novoStatus === s && styles.chipAtivo]}
                onPress={() => setNovoStatus(s)}
              >
                <Text style={[styles.chipText, novoStatus === s && styles.chipTextoAtivo]}>
                  {STATUS_LABELS[s] ?? s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <View style={{ marginTop: 16 }}>
          <ActionButton label="Confirmar Atualização" onPress={atualizarStatus} loading={atualizando} />
        </View>
        <Text style={styles.aviso}>⚠️ O cliente receberá um e-mail automático</Text>
      </View>

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
  whatsappBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
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
})
