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
import FormInput from '../../../components/admin/FormInput'
import StatusBadge from '../../../components/admin/StatusBadge'
import { useAdmin, useAdminGuard, useAdminTitulo } from '../../../contexts/AdminContext'
import { adminFetch } from '../../../utils/adminApi'

export default function FeiraDetalhe() {
  useAdminGuard(3)
  const { id } = useLocalSearchParams<{ id: string }>()
  useAdminTitulo(id === 'novo' ? 'Nova Feira' : 'Editar Feira')
  const isNovo = id === 'novo'
  const { admin } = useAdmin()
  const router = useRouter()

  const [loading, setLoading] = useState(!isNovo)
  const [saving, setSaving] = useState(false)

  const [nome, setNome] = useState('')
  const [endereco, setEndereco] = useState('')
  const [horario, setHorario] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [status, setStatus] = useState<'Aberto' | 'Fechado'>('Aberto')
  const [imagem, setImagem] = useState('')
  const [feirantes, setFeirantes] = useState<any[]>([])

  useEffect(() => {
    if (!isNovo) fetchFeira()
  }, [id])

  async function fetchFeira() {
    setLoading(true)
    try {
      const res = await adminFetch(`/feiras/${id}`, undefined, admin!.token)
      const data = await res.json()
      setNome(data.nome ?? '')
      setEndereco(data.endereco ?? '')
      setHorario(data.horario ?? '')
      setLatitude(String(data.latitude ?? ''))
      setLongitude(String(data.longitude ?? ''))
      setStatus(data.status ?? 'Aberto')
      setImagem(data.imagem ?? '')
      setFeirantes(data.feirantes ?? [])
    } catch {
      alert('Erro ao carregar feira')
    }
    setLoading(false)
  }

  async function salvar() {
    if (!nome) { alert('Nome é obrigatório'); return }
    setSaving(true)
    try {
      const body = JSON.stringify({ nome, endereco, horario, latitude, longitude, status, imagem })
      const res = isNovo
        ? await adminFetch('/feiras', { method: 'POST', body }, admin!.token)
        : await adminFetch(`/feiras/${id}`, { method: 'PUT', body }, admin!.token)
      const data = await res.json()
      if (!res.ok) { alert(data.erro || data.error || 'Erro ao salvar'); return }
      router.back()
    } catch {
      alert('Erro ao salvar feira')
    }
    setSaving(false)
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
      <View style={styles.card}>
        <View style={styles.formGap}>
          <FormInput label="Nome da Feira" value={nome} onChangeText={setNome} />
          <FormInput label="Endereço" value={endereco} onChangeText={setEndereco} />
          <FormInput label="Horário" value={horario} onChangeText={setHorario} placeholder="7h às 14h" />
          <FormInput label="Latitude" value={latitude} onChangeText={setLatitude} keyboardType="numeric" />
          <FormInput label="Longitude" value={longitude} onChangeText={setLongitude} keyboardType="numeric" />

          <View>
            <Text style={styles.label}>Status</Text>
            <View style={styles.tabRow}>
              {(['Aberto', 'Fechado'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.tab, status === s && styles.tabAtivo]}
                  onPress={() => setStatus(s)}
                >
                  <Text style={[styles.tabText, status === s && styles.tabTextoAtivo]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <FormInput label="URL da Imagem" value={imagem} onChangeText={setImagem} placeholder="https://..." />

          <ActionButton label="Salvar Feira" onPress={salvar} loading={saving} />
        </View>
      </View>

      {!isNovo && feirantes.length > 0 && (
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Feirantes desta Feira</Text>
          {feirantes.map((f: any) => (
            <View key={f.id} style={styles.feiranteCard}>
              <Text style={styles.feiranteNome}>{f.nome}</Text>
              <View style={styles.feiranteBase}>
                <Text style={styles.feiranteBanca}>{f.banca}</Text>
                <StatusBadge status={f.status ?? 'Fechado'} />
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7E4' },
  content: { padding: 16, paddingBottom: 32 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 16,
  },
  formGap: { gap: 16 },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
    marginBottom: 8,
  },
  tabRow: { flexDirection: 'row', gap: 8 },
  tab: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#255336',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabAtivo: { backgroundColor: '#255336' },
  tabText: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#255336' },
  tabTextoAtivo: { color: '#FFFFFF' },
  secao: { marginBottom: 16 },
  secaoTitulo: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
    marginBottom: 12,
  },
  feiranteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 1,
  },
  feiranteNome: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
    marginBottom: 4,
  },
  feiranteBase: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feiranteBanca: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666666',
  },
})
