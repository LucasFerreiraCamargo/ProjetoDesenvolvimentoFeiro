import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'
import { useAdmin } from '../../../contexts/AdminContext'
import { chatSocket } from '../../../lib/chatSocket'
import { chatService } from '../../../services/chat'
import styles from './styles'

interface AdminHeaderProps {
  titulo?: string
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ titulo }) => {
  const { admin, logout } = useAdmin()
  const router = useRouter()
  const [menuAberto, setMenuAberto] = useState(false)
  // Badge global de mensagens não lidas para o feirante.
  const [naoLidas, setNaoLidas] = useState(0)

  const primeiroNome = admin?.nome?.split(' ')[0] ?? 'Admin'

  // ── Carga inicial + polling de fallback (30s) ───────────────────────────
  useEffect(() => {
    if (!admin?.token) return
    let cancelado = false
    async function carregar() {
      try {
        const r = await chatService.naoLidas(admin!.token!)
        if (!cancelado) setNaoLidas(r.total)
      } catch {
        /* silencioso */
      }
    }
    carregar()
    const interval = setInterval(carregar, 30_000)
    return () => {
      cancelado = true
      clearInterval(interval)
    }
  }, [admin?.token])

  // ── Socket: aumenta contador quando chega mensagem nova ─────────────────
  useEffect(() => {
    if (!admin?.id) return
    // O canal pessoal do feirante é `feirante:{id}`. O backend identifica
    // o id do feirante via Feirante.adminId === userLogadoId — então
    // emitimos `join:feirante` com o id do FEIRANTE, não do Usuario admin.
    // Como não temos esse id no AdminContext ainda, usamos o canal de
    // cliente como fallback (que pode ser ignorado). O servidor garante
    // que a notificação chegue na sala correta. Para resolução completa,
    // o ideal é carregar feirante.id ao logar.
    const handler = () => {
      // Recarrega contagem real do backend (mais simples que incrementar)
      if (!admin?.token) return
      chatService
        .naoLidas(admin.token)
        .then((r) => setNaoLidas(r.total))
        .catch(() => {})
    }
    chatSocket.on('chat:nova-mensagem', handler)
    return () => {
      chatSocket.off('chat:nova-mensagem', handler)
    }
  }, [admin?.id, admin?.token])

  return (
    <View style={{ zIndex: 50 }}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.leftSection}>
            <Image
              source={require('../../../../assets/images/logo.png')}
              style={styles.logoSmall}
              resizeMode="contain"
            />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>ADMIN</Text>
            </View>
          </View>

          {titulo ? <Text style={styles.titulo}>{titulo}</Text> : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* Sino com badge de mensagens não lidas. Click → /admin/conversas */}
            <TouchableOpacity
              style={sinoStyles.botao}
              onPress={() => router.push('/admin/conversas')}
              accessibilityLabel={
                naoLidas > 0
                  ? `${naoLidas} mensagens não lidas`
                  : 'Conversas'
              }
            >
              <Ionicons
                name={naoLidas > 0 ? 'notifications' : 'notifications-outline'}
                size={22}
                color={naoLidas > 0 ? '#DC2626' : '#333333'}
              />
              {naoLidas > 0 ? (
                <View style={sinoStyles.badge}>
                  <Text style={sinoStyles.badgeTexto}>
                    {naoLidas > 9 ? '9+' : naoLidas}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => setMenuAberto((v) => !v)}
            >
              <Ionicons name="person-circle-outline" size={22} color="#333333" />
              <Text style={styles.adminNome}>{primeiroNome}</Text>
              <Ionicons
                name={menuAberto ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#666666"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {menuAberto && (
        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuAberto(false)
              router.push('/admin/perfil')
            }}
          >
            <Ionicons name="person-outline" size={18} color="#255336" />
            <Text style={styles.menuText}>Meu Perfil</Text>
          </TouchableOpacity>
          <View style={styles.menuDivisor} />
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuAberto(false)
              router.replace('/home')
            }}
          >
            <Ionicons name="storefront-outline" size={18} color="#255336" />
            <Text style={styles.menuText}>Área do Cliente</Text>
          </TouchableOpacity>
          <View style={styles.menuDivisor} />
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuAberto(false)
              logout()
              router.replace('/login')
            }}
          >
            <Ionicons name="log-out-outline" size={18} color="#FF5722" />
            <Text style={[styles.menuText, { color: '#FF5722' }]}>Sair</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

// Estilos do sino + badge global de mensagens não lidas
const sinoStyles = {
  botao: {
    position: 'relative' as const,
    padding: 6,
  },
  badge: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  badgeTexto: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700' as const,
  },
}

export default AdminHeader
