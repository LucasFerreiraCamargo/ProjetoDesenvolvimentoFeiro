/**
 * Tela: Conversas (área admin / feirante).
 *
 * Lista todas as conversas ativas (pedidos com pelo menos 1 mensagem),
 * ordenadas pela última mensagem. Mostra preview do texto e badge de
 * não-lidas. Click no card abre `/chat/[pedidoId]`.
 */

import { Ionicons } from '@expo/vector-icons'
import { router, useFocusEffect } from 'expo-router'
import React from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import StatusBadge from '../../components/admin/StatusBadge'
import { useAdmin, useAdminGuard, useAdminTitulo } from '../../contexts/AdminContext'
import { chatService } from '../../services/chat'
import type { ChatConversa } from '../../types/api'

function formatarHora(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const hoje = new Date()
  const ehHoje = d.toDateString() === hoje.toDateString()
  if (ehHoje) {
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default function ConversasScreen() {
  useAdminGuard(2)
  useAdminTitulo('Conversas')
  const { admin } = useAdmin()

  const [conversas, setConversas] = React.useState<ChatConversa[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [busca, setBusca] = React.useState('')

  // Filtra por nome do cliente ou número do pedido. Client-side sobre a lista
  // já carregada — busca sem acento e case-insensitive.
  const conversasFiltradas = React.useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return conversas
    const semAcento = (s: string) =>
      s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    const alvo = semAcento(q)
    return conversas.filter((c) => {
      const nome = semAcento(c.pedido?.usuario?.nome ?? '')
      const pedidoId = String(c.pedido?.id ?? '')
      return nome.includes(alvo) || pedidoId.includes(q)
    })
  }, [conversas, busca])

  const carregar = React.useCallback(async () => {
    if (!admin?.token) return
    try {
      const lista = await chatService.conversas(admin.token)
      setConversas(lista)
    } catch (e) {
      console.warn('[Conversas] erro:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [admin?.token])

  useFocusEffect(
    React.useCallback(() => {
      carregar()
    }, [carregar]),
  )

  function renderItem({ item }: { item: ChatConversa }) {
    const pedidoId = item.pedido?.id
    const cliente = item.pedido?.usuario?.nome ?? 'Cliente'
    const prev = item.ultimaMensagem?.texto ?? '(sem mensagens)'
    const hora = formatarHora(item.ultimaMensagem?.createdAt ?? null)
    const naoLidas = item.naoLidas

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: '/chat/[pedidoId]',
            params: { pedidoId: String(pedidoId) },
          })
        }
        activeOpacity={0.85}
      >
        <View style={styles.avatar}>
          <Ionicons name="person" size={22} color="#255336" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.linha1}>
            <Text style={styles.nome} numberOfLines={1}>
              {cliente}
            </Text>
            <Text style={styles.hora}>{hora}</Text>
          </View>
          <View style={styles.linha2}>
            <Text
              style={[
                styles.preview,
                naoLidas > 0 && { color: '#222', fontWeight: '600' },
              ]}
              numberOfLines={1}
            >
              {prev}
            </Text>
            {naoLidas > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeTexto}>
                  {naoLidas > 9 ? '9+' : naoLidas}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.linha3}>
            <Text style={styles.pedidoLabel}>Pedido #{pedidoId}</Text>
            {item.pedido?.status ? (
              <StatusBadge status={item.pedido.status} />
            ) : null}
          </View>
        </View>
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
      <View style={styles.filtroBarra}>
        <View style={styles.busca}>
          <Ionicons name="search" size={16} color="#7A8A7C" />
          <TextInput
            style={styles.buscaInput}
            placeholder="Nome do cliente ou nº do pedido"
            placeholderTextColor="#9AA79B"
            value={busca}
            onChangeText={setBusca}
            returnKeyType="search"
            autoCorrect={false}
          />
          {busca.length > 0 ? (
            <TouchableOpacity
              onPress={() => setBusca('')}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Limpar busca"
            >
              <Ionicons name="close-circle" size={16} color="#B7C2B7" />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.botaoIa}
          onPress={() => router.push('/admin/chat-ia' as any)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Abrir assistente de IA"
        >
          <Ionicons name="sparkles" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversasFiltradas}
        keyExtractor={(c) => String(c.pedido?.id)}
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
          busca.trim() ? (
            <View style={styles.vazio}>
              <Ionicons name="search" size={44} color="#CBD5C2" />
              <Text style={styles.vazioTitulo}>Nenhum resultado</Text>
              <Text style={styles.vazioSub}>
                Nada encontrado para “{busca.trim()}”. Tente outro nome ou
                número de pedido.
              </Text>
            </View>
          ) : (
            <View style={styles.vazio}>
              <Ionicons
                name="chatbubbles-outline"
                size={48}
                color="#CBD5C2"
              />
              <Text style={styles.vazioTitulo}>Nenhuma conversa ainda</Text>
              <Text style={styles.vazioSub}>
                Quando um cliente enviar uma mensagem sobre um pedido, ela
                aparece aqui.
              </Text>
            </View>
          )
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7E4' },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  filtroBarra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
  },
  busca: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EAEFEA',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  buscaInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    paddingVertical: 0,
  },
  botaoIa: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#4A7C59',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#255336',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  lista: { padding: 12, paddingBottom: 100 },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EAEFEA',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linha1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  nome: { fontSize: 15, fontFamily: 'Poppins-SemiBold', color: '#255336', flex: 1 },
  hora: { fontSize: 11, color: '#999' },
  linha2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  preview: { flex: 1, fontSize: 13, color: '#666' },
  badge: {
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTexto: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  linha3: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pedidoLabel: { fontSize: 11, color: '#999' },
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
