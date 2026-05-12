import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'
import { useAdmin } from '../../../contexts/AdminContext'
import styles from './styles'

interface AdminHeaderProps {
  titulo?: string
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ titulo }) => {
  const { admin, logout } = useAdmin()
  const router = useRouter()
  const [menuAberto, setMenuAberto] = useState(false)

  const primeiroNome = admin?.nome?.split(' ')[0] ?? 'Admin'

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
              // Volta para a área do cliente sem deslogar (mantém a sessão)
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
              router.replace('/admin/login')
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

export default AdminHeader
