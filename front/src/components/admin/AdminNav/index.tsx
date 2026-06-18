import { Ionicons } from '@expo/vector-icons'
import { usePathname, useRouter } from 'expo-router'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAdmin } from '../../../contexts/AdminContext'
import styles from './styles'

// Convenção: 1=Cliente, 2=Feirante, 3=Superadmin
// (Cliente nem deveria entrar na área admin — o useAdminGuard já bloqueia.)

// Menu do Feirante (nivel 2): gerencia o próprio catálogo, pedidos, entregadores e rotas.
const navFeirante = [
  { name: 'Painel', icon: 'grid', route: '/admin/dashboard' },
  { name: 'Pedidos', icon: 'receipt', route: '/admin/pedidos' },
  { name: 'Conversas', icon: 'chatbubbles', route: '/admin/conversas' },
  { name: 'Rotas', icon: 'map', route: '/admin/rotas' },
  { name: 'Produtos', icon: 'leaf', route: '/admin/mercadorias' },
  { name: 'Cestas', icon: 'basket', route: '/admin/cestas' },
  { name: 'Perfil', icon: 'person', route: '/admin/perfil' },
]

// Menu do Superadmin (nivel 3): visão geral + gestão de feirantes/feiras/usuários/rotas.
const navSuperadmin = [
  { name: 'Painel', icon: 'grid', route: '/admin/dashboard' },
  { name: 'Pedidos', icon: 'receipt', route: '/admin/pedidos' },
  { name: 'Conversas', icon: 'chatbubbles', route: '/admin/conversas' },
  { name: 'Rotas', icon: 'map', route: '/admin/rotas' },
  { name: 'Feirantes', icon: 'storefront', route: '/admin/feirantes' },
  { name: 'Feiras', icon: 'location', route: '/admin/feiras' },
  { name: 'Usuários', icon: 'people', route: '/admin/usuarios' },
]

const AdminNav: React.FC = () => {
  const { admin } = useAdmin()
  const router = useRouter()
  const pathname = usePathname()

  const nivel = admin?.nivel ?? 1
  // nivel 3 = Superadmin → menu de superadmin
  // nivel 2 = Feirante (default seguro) → menu de feirante
  // nivel 1 = Cliente → não deveria estar aqui; usa menu de feirante por garantia
  const items = nivel >= 3 ? navSuperadmin : navFeirante

  return (
    <SafeAreaView edges={['bottom']} style={styles.nav}>
      <View style={styles.div}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.navItem}
            onPress={() => router.push(item.route as any)}
          >
            <Ionicons
              name={item.icon as any}
              size={24}
              color={pathname.startsWith(item.route) ? '#255336' : '#666'}
            />
            <Text
              style={[
                styles.navText,
                { color: pathname.startsWith(item.route) ? '#255336' : '#666' },
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  )
}

export default AdminNav
