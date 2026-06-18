import { Slot, usePathname } from 'expo-router'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import AdminHeader from '../../components/admin/AdminHeader'
import AdminNav from '../../components/admin/AdminNav'
import { useAdmin } from '../../contexts/AdminContext'

const rotasSemLayout = ['/admin/login']

function AdminLayoutInner() {
  const pathname = usePathname()
  const { titulo } = useAdmin()
  const semLayout = rotasSemLayout.includes(pathname)

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {!semLayout && <AdminHeader titulo={titulo || undefined} />}
      <View style={styles.content}>
        <Slot />
      </View>
      {!semLayout && <AdminNav />}
    </SafeAreaView>
  )
}

export default function AdminLayout() {
  // AdminProvider já é provido no _layout raiz (pra que telas globais como
  // /chat/[pedidoId] tenham acesso ao admin.token quando o feirante navega
  // pra fora de /admin).
  return (
    <SafeAreaProvider>
      <AdminLayoutInner />
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7E4',
  },
  content: {
    flex: 1,
  },
})
