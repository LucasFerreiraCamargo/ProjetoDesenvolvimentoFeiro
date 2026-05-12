import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
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

export default function UsuarioDetalhe() {
  // Só Superadmin (nivel 3) gerencia usuários
  useAdminGuard(3)
  useAdminTitulo('Usuário')
  const { id } = useLocalSearchParams<{ id: string }>()
  const { admin } = useAdmin()
  const router = useRouter()

  const [usuario, setUsuario] = useState<any>(null)
  const [pedidos, setPedidos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { fetchDados() }, [id])

  async function fetchDados() {
    setLoading(true)
    try {
      const [resUser, resPedidos] = await Promise.all([
        adminFetch(`/usuarios/${id}`, undefined, admin!.token),
        adminFetch(`/pedido/usuario/${id}`, undefined, admin!.token),
      ])
      if (resUser.ok) setUsuario(await resUser.json())
      if (resPedidos.ok) setPedidos(await resPedidos.json())
    } catch { alert('Erro ao carregar usuário') }
    setLoading(false)
  }

  async function deletar() {
    setDeleting(true)
    try {
      await adminFetch(`/usuarios/${id}`, { method: 'DELETE' }, admin!.token)
      router.back()
    } catch { alert('Erro ao excluir usuário') }
    setDeleting(false)
    setShowDelete(false)
  }

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#255336" /></View>
  }

  if (!usuario) {
    return <View style={styles.loadingContainer}><Text style={styles.erro}>Usuário não encontrado</Text></View>
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={40} color="#255336" />
          </View>
          <Text style={styles.nome}>{usuario.nome}</Text>
          <Text style={styles.email}>{usuario.email}</Text>
          {usuario.telefone ? <Text style={styles.info}>{usuario.telefone}</Text> : null}
          {usuario.endereco ? <Text style={styles.info}>{usuario.endereco}</Text> : null}
          {usuario.bairro ? <Text style={styles.info}>{usuario.bairro}</Text> : null}
        </View>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsNum}>{pedidos.length}</Text>
        <Text style={styles.statsLabel}>pedidos realizados</Text>
      </View>

      {pedidos.length > 0 && (
        <View>
          <Text style={styles.secaoTitulo}>Histórico de Pedidos</Text>
          {pedidos.map((p: any) => (
            <TouchableOpacity
              key={p.id}
              style={styles.pedidoCard}
              onPress={() => router.push(`/admin/pedidos/${p.id}` as any)}
            >
              <View style={styles.pedidoTopo}>
                <Text style={styles.pedidoId}>Pedido #{p.id}</Text>
                <Text style={styles.pedidoTotal}>R$ {Number(p.total || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.pedidoBase}>
                <Text style={styles.pedidoMeta}>{p.itens?.length ?? 0} itens</Text>
                <StatusBadge status={p.status ?? 'PENDENTE'} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {admin?.nivel === 3 && (
        <ActionButton
          label="Excluir Usuário"
          onPress={() => setShowDelete(true)}
          variant="danger"
          icon="trash-outline"
        />
      )}

      <ConfirmModal
        visible={showDelete}
        titulo="Excluir Usuário"
        mensagem="Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={deletar}
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
  avatarContainer: { alignItems: 'center' },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  nome: { fontSize: 20, fontFamily: 'Poppins-SemiBold', color: '#333333', marginBottom: 4 },
  email: { fontSize: 14, fontFamily: 'Poppins-Regular', color: '#666666', marginBottom: 2 },
  info: { fontSize: 14, fontFamily: 'Poppins-Regular', color: '#666666' },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 1,
  },
  statsNum: { fontSize: 28, fontFamily: 'Poppins-SemiBold', color: '#255336' },
  statsLabel: { fontSize: 14, fontFamily: 'Poppins-Regular', color: '#666666' },
  secaoTitulo: { fontSize: 18, fontFamily: 'Poppins-SemiBold', color: '#333333', marginBottom: 8 },
  pedidoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 1,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  pedidoTopo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  pedidoId: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#255336' },
  pedidoTotal: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#255336' },
  pedidoBase: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pedidoMeta: { fontSize: 12, fontFamily: 'Poppins-Regular', color: '#666666' },
})
