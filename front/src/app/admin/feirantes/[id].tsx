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
import { useAdmin, useAdminGuard, useAdminTitulo } from '../../../contexts/AdminContext'
import { adminFetch } from '../../../utils/adminApi'

export default function FeiranteDetalhe() {
  // Só Superadmin (nivel 3) gerencia feirantes
  useAdminGuard(3)
  const { id } = useLocalSearchParams<{ id: string }>()
  useAdminTitulo(id === 'novo' ? 'Novo Feirante' : 'Editar Feirante')
  const isNovo = id === 'novo'
  const { admin } = useAdmin()
  const router = useRouter()

  const [loading, setLoading] = useState(!isNovo)
  const [saving, setSaving] = useState(false)
  const [feiras, setFeiras] = useState<any[]>([])
  const [mercadorias, setMercadorias] = useState<any[]>([])

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [telefone, setTelefone] = useState('')
  const [endereco, setEndereco] = useState('')
  const [banca, setBanca] = useState('')
  const [especialidade, setEspecialidade] = useState('')
  const [feiraId, setFeiraId] = useState<number | null>(null)
  const [status, setStatus] = useState<'Aberto' | 'Fechado'>('Aberto')

  useEffect(() => {
    fetchFeiras()
    if (!isNovo) fetchFeirante()
  }, [id])

  async function fetchFeiras() {
    try {
      const res = await adminFetch('/feiras', undefined, admin!.token)
      const data = await res.json()
      setFeiras(Array.isArray(data) ? data : [])
    } catch {}
  }

  async function fetchFeirante() {
    setLoading(true)
    try {
      const res = await adminFetch(`/feirantes/${id}`, undefined, admin!.token)
      const data = await res.json()
      setNome(data.nome ?? '')
      setEmail(data.email ?? '')
      setTelefone(data.telefone ?? '')
      setEndereco(data.endereco ?? '')
      setBanca(data.banca ?? '')
      setEspecialidade(data.especialidade ?? '')
      setFeiraId(data.feira_id ?? null)
      setStatus(data.status ?? 'Aberto')
      setMercadorias(data.mercadorias ?? [])
    } catch { alert('Erro ao carregar feirante') }
    setLoading(false)
  }

  async function salvar() {
    if (!nome || !email) { alert('Nome e e-mail são obrigatórios'); return }
    setSaving(true)
    try {
      const body: any = { nome, email, telefone, endereco, banca, especialidade, status }
      if (feiraId) body.feira_id = feiraId
      if (isNovo || senha) body.senha = senha
      const res = isNovo
        ? await adminFetch('/feirantes', { method: 'POST', body: JSON.stringify(body) }, admin!.token)
        : await adminFetch(`/feirantes/${id}`, { method: 'PUT', body: JSON.stringify(body) }, admin!.token)
      const data = await res.json()
      if (!res.ok) { alert(data.erro || data.error || 'Erro ao salvar'); return }
      router.back()
    } catch { alert('Erro ao salvar feirante') }
    setSaving(false)
  }

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#255336" /></View>
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.gap}>
          <FormInput label="Nome completo" value={nome} onChangeText={setNome} />
          <FormInput label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <FormInput
            label={isNovo ? 'Senha' : 'Senha (deixe em branco para manter)'}
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
          />
          <FormInput label="Telefone" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
          <FormInput label="Endereço" value={endereco} onChangeText={setEndereco} />
          <FormInput label="Nome da Banca" value={banca} onChangeText={setBanca} placeholder="ex: Banca 23" />
          <FormInput label="Especialidade" value={especialidade} onChangeText={setEspecialidade} placeholder="ex: Frutas e Verduras" />

          <View>
            <Text style={styles.label}>Feira</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.tabRow}>
                {feiras.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.tab, feiraId === f.id && styles.tabAtivo]}
                    onPress={() => setFeiraId(f.id)}
                  >
                    <Text style={[styles.tabText, feiraId === f.id && styles.tabTextoAtivo]}>
                      {f.nome}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

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

          <ActionButton label="Salvar Feirante" onPress={salvar} loading={saving} />
        </View>
      </View>

      {!isNovo && mercadorias.length > 0 && (
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Mercadorias</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.mercadoriaRow}>
              {mercadorias.map((m: any) => (
                <View key={m.id} style={styles.mercadoriaCard}>
                  <Text style={styles.mercadoriaEmoji}>{m.emoji ?? '🛒'}</Text>
                  <Text style={styles.mercadoriaNome}>{m.nome}</Text>
                  <Text style={styles.mercadoriaPreco}>R$ {Number(m.preco).toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity
            style={styles.botaoAdicionar}
            onPress={() => router.push('/admin/mercadorias/novo' as any)}
          >
            <Text style={styles.botaoAdicionarText}>+ Adicionar mercadoria</Text>
          </TouchableOpacity>
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
  gap: { gap: 16 },
  label: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#333333', marginBottom: 8 },
  tabRow: { flexDirection: 'row', gap: 8 },
  tab: {
    borderWidth: 1,
    borderColor: '#255336',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tabAtivo: { backgroundColor: '#255336' },
  tabText: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#255336' },
  tabTextoAtivo: { color: '#FFFFFF' },
  secao: { marginBottom: 16 },
  secaoTitulo: { fontSize: 18, fontFamily: 'Poppins-SemiBold', color: '#333333', marginBottom: 12 },
  mercadoriaRow: { flexDirection: 'row', gap: 12 },
  mercadoriaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: 100,
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 1,
  },
  mercadoriaEmoji: { fontSize: 24, marginBottom: 4 },
  mercadoriaNome: { fontSize: 12, fontFamily: 'Poppins-SemiBold', color: '#333333', textAlign: 'center' },
  mercadoriaPreco: { fontSize: 12, fontFamily: 'Poppins-Regular', color: '#255336' },
  botaoAdicionar: { marginTop: 12 },
  botaoAdicionarText: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#255336' },
})
