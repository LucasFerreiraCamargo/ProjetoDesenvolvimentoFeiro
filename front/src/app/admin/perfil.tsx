import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useAdmin, useAdminGuard, useAdminTitulo } from '../../contexts/AdminContext'
import { adminFetch } from '../../utils/adminApi'

const RAIOS_KM = [1, 2, 3, 5, 7, 10, 15, 20, 30, 40, 50]

export default function AdminPerfil() {
  // Feirante (2) e Superadmin (3) podem acessar
  useAdminGuard(2)
  useAdminTitulo('Meu Perfil')
  const { admin, logout } = useAdmin()
  const router = useRouter()

  const [feirante, setFeirante] = useState<any>(null)
  // Loading inicia true se o admin é Feirante (vai carregar dados da banca)
  const [loading, setLoading] = useState(admin?.nivel === 2)
  const [salvandoRaio, setSalvandoRaio] = useState(false)
  const [raioKm, setRaioKm] = useState(10)
  const [entregaAtiva, setEntregaAtiva] = useState(true)

  // Convenção: 1=Cliente, 2=Feirante, 3=Superadmin
  const nivelLabel = (n?: number) => {
    if (n === 1) return 'Cliente'
    if (n === 2) return 'Feirante'
    return 'Superadmin'
  }

  useEffect(() => {
    // Só Feirante (nivel 2) tem banca para carregar
    if (admin?.nivel === 2 && admin.feiranteId) {
      fetchFeirante()
    }
  }, [admin])

  async function fetchFeirante() {
    try {
      const res = await adminFetch(`/feirantes/${admin!.feiranteId}`, undefined, admin!.token)
      if (res.ok) {
        const data = await res.json()
        setFeirante(data)
        if (data.raio_entrega_km) setRaioKm(Number(data.raio_entrega_km))
        if (data.entrega_ativa !== undefined) setEntregaAtiva(!!data.entrega_ativa)
      }
    } catch {}
    setLoading(false)
  }

  async function salvarRaio() {
    if (!admin?.feiranteId) return
    setSalvandoRaio(true)
    try {
      const res = await adminFetch(
        `/feirantes/${admin.feiranteId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ raio_entrega_km: raioKm, entrega_ativa: entregaAtiva }),
        },
        admin.token
      )
      if (res.ok) {
        Alert.alert('Sucesso', 'Raio de atuação salvo com sucesso!')
      } else {
        Alert.alert('Erro', 'Não foi possível salvar o raio de atuação.')
      }
    } catch {
      Alert.alert('Erro', 'Falha na conexão com o servidor.')
    }
    setSalvandoRaio(false)
  }

  function sair() {
    logout()
    router.replace('/admin/login')
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#255336" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── Card do usuário ── */}
      <View style={styles.usuarioCard}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={40} color="#255336" />
        </View>
        <Text style={styles.nome}>{admin?.nome}</Text>
        <Text style={styles.email}>{admin?.email}</Text>
        <View style={styles.nivelBadge}>
          <Text style={styles.nivelText}>{nivelLabel(admin?.nivel)}</Text>
        </View>
      </View>

      {/* ── Dados da banca (somente feirante: nivel 2) ── */}
      {admin?.nivel === 2 && feirante && (
        <View style={styles.card}>
          <Text style={styles.secaoTitulo}>
            <Ionicons name="storefront-outline" size={16} color="#255336" /> Dados da Banca
          </Text>
          <View style={styles.linhaInfo}>
            <Text style={styles.infoLabel}>Banca:</Text>
            <Text style={styles.infoValor}>{feirante.banca ?? '—'}</Text>
          </View>
          <View style={styles.linhaInfo}>
            <Text style={styles.infoLabel}>Especialidade:</Text>
            <Text style={styles.infoValor}>{feirante.especialidade ?? '—'}</Text>
          </View>
          <View style={styles.linhaInfo}>
            <Text style={styles.infoLabel}>Feira:</Text>
            <Text style={styles.infoValor}>{feirante.feira?.nome ?? '—'}</Text>
          </View>
          {feirante.avaliacao ? (
            <View style={styles.linhaInfo}>
              <Text style={styles.infoLabel}>Avaliação:</Text>
              <Text style={styles.infoValor}>⭐ {Number(feirante.avaliacao).toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* ── Raio de atuação (somente feirante: nivel 2) ── */}
      {admin?.nivel === 2 && (
        <View style={styles.card}>
          <Text style={styles.secaoTitulo}>
            <Ionicons name="locate-outline" size={16} color="#255336" /> Raio de Atuação
          </Text>
          <Text style={styles.raioDescricao}>
            Defina a distância máxima que você atende entregas. Clientes fora desta área não verão sua banca como disponível para delivery.
          </Text>

          {/* Raio atual em destaque */}
          <View style={styles.raioDestaque}>
            <Text style={styles.raioValorGrande}>{raioKm} km</Text>
            <Text style={styles.raioSub}>raio de entrega</Text>
          </View>

          {/* Seleção de raio por botões */}
          <Text style={styles.label}>Selecionar raio:</Text>
          <View style={styles.raioGrid}>
            {RAIOS_KM.map((km) => (
              <TouchableOpacity
                key={km}
                style={[styles.raioBtn, raioKm === km && styles.raioBtnAtivo]}
                onPress={() => setRaioKm(km)}
                activeOpacity={0.8}
              >
                <Text style={[styles.raioBtnText, raioKm === km && styles.raioBtnTextoAtivo]}>
                  {km} km
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Legenda visual de alcance */}
          <View style={styles.raioLegenda}>
            <Ionicons name="information-circle-outline" size={14} color="#999" />
            <Text style={styles.raioLegendaText}>
              {raioKm <= 3
                ? 'Alcance local — bairro próximo à feira'
                : raioKm <= 10
                ? 'Alcance médio — bairros vizinhos'
                : raioKm <= 25
                ? 'Alcance amplo — cidade inteira'
                : 'Alcance regional — cidades próximas'}
            </Text>
          </View>

          {/* Toggle de entrega ativa */}
          <TouchableOpacity
            style={[styles.entregaToggle, entregaAtiva && styles.entregaToggleAtivo]}
            onPress={() => setEntregaAtiva((v) => !v)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={entregaAtiva ? 'bicycle' : 'bicycle-outline'}
              size={20}
              color={entregaAtiva ? '#255336' : '#999'}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.entregaToggleText, entregaAtiva && { color: '#255336' }]}>
                {entregaAtiva ? 'Entrega ativa' : 'Entrega desativada'}
              </Text>
              <Text style={styles.entregaToggleSub}>
                {entregaAtiva ? 'Você faz entregas no raio definido' : 'Somente retirada na feira'}
              </Text>
            </View>
            <View style={[styles.togglePill, entregaAtiva && styles.togglePillAtivo]}>
              <View style={[styles.toggleThumb, entregaAtiva && styles.toggleThumbAtivo]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.salvarBtn, salvandoRaio && styles.salvarBtnDisabled]}
            onPress={salvarRaio}
            disabled={salvandoRaio}
            activeOpacity={0.8}
          >
            {salvandoRaio
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Text style={styles.salvarBtnText}>Salvar configurações</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* ── Botão sair ── */}
      <TouchableOpacity style={styles.sairButton} onPress={sair} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={24} color="#FF5722" />
        <Text style={styles.sairTexto}>Sair da conta</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7E4' },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Card usuário
  usuarioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 1,
  },
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
  email: { fontSize: 14, fontFamily: 'Poppins-Regular', color: '#666666', marginBottom: 8 },
  nivelBadge: {
    backgroundColor: '#E8F5E8',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  nivelText: { fontSize: 12, fontFamily: 'Poppins-SemiBold', color: '#255336' },

  // Cards genéricos
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    gap: 12,
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 1,
  },
  secaoTitulo: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
  },
  linhaInfo: { flexDirection: 'row', gap: 8 },
  infoLabel: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#333333' },
  infoValor: { fontSize: 14, fontFamily: 'Poppins-Regular', color: '#666666', flex: 1 },
  label: { fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#333333' },

  // Raio de atuação
  raioDescricao: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#666666',
    lineHeight: 20,
  },
  raioDestaque: {
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    paddingVertical: 16,
  },
  raioValorGrande: {
    fontSize: 40,
    fontFamily: 'Poppins-SemiBold',
    color: '#255336',
    lineHeight: 48,
  },
  raioSub: { fontSize: 13, fontFamily: 'Poppins-Regular', color: '#4A7C59' },
  raioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  raioBtn: {
    borderWidth: 1,
    borderColor: '#255336',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  raioBtnAtivo: { backgroundColor: '#255336' },
  raioBtnText: { fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#255336' },
  raioBtnTextoAtivo: { color: '#FFFFFF' },
  raioLegenda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 10,
  },
  raioLegendaText: { fontSize: 12, fontFamily: 'Poppins-Regular', color: '#666666', flex: 1 },

  // Toggle entrega
  entregaToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#FAFAFA',
  },
  entregaToggleAtivo: { borderColor: '#255336', backgroundColor: '#F0FAF4' },
  entregaToggleText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#999999',
  },
  entregaToggleSub: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#999999',
    marginTop: 2,
  },
  togglePill: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DDD',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  togglePillAtivo: { backgroundColor: '#255336' },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    elevation: 2,
  },
  toggleThumbAtivo: { alignSelf: 'flex-end' },

  // Botão salvar
  salvarBtn: {
    backgroundColor: '#255336',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  salvarBtnDisabled: { opacity: 0.6 },
  salvarBtnText: { fontSize: 15, fontFamily: 'Poppins-SemiBold', color: '#FFFFFF' },

  // Sair
  sairButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3F3',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE0E0',
    gap: 8,
  },
  sairTexto: { fontSize: 16, fontFamily: 'Poppins-SemiBold', color: '#FF5722' },
})
