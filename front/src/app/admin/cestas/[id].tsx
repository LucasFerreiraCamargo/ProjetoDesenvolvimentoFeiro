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

export default function CestaDetalhe() {
  // Feirante (2) e Superadmin (3) podem acessar
  useAdminGuard(2)
  const { id } = useLocalSearchParams<{ id: string }>()
  useAdminTitulo(id === 'novo' ? 'Nova Cesta' : 'Editar Cesta')
  const isNovo = id === 'novo'
  const { admin } = useAdmin()
  const router = useRouter()

  const [loading, setLoading] = useState(!isNovo)
  const [saving, setSaving] = useState(false)
  const [feirantes, setFeirantes] = useState<any[]>([])
  const [mercadoriasDispo, setMercadoriasDispo] = useState<any[]>([])

  const [nome, setNome] = useState('')
  const [preco, setPreco] = useState('')
  const [desconto, setDesconto] = useState('')
  const [emojiVal, setEmojiVal] = useState('')
  const [categoria, setCategoria] = useState('')
  const [imagemUrl, setImagemUrl] = useState('')
  const [feiranteId, setFeiranteId] = useState<number | null>(null)
  const [mercSelecionadas, setMercSelecionadas] = useState<number[]>([])

  useEffect(() => {
    // Só Superadmin (3) precisa do picker de feirante
    if (admin!.nivel >= 3) fetchFeirantes()
    if (!isNovo) fetchCesta()
    else {
      // Feirante (2) usa o próprio id e já carrega suas mercadorias
      if (admin!.nivel === 2) {
        setFeiranteId(admin!.feiranteId ?? null)
        fetchMercadorias(admin!.feiranteId)
      }
    }
  }, [id])

  async function fetchFeirantes() {
    try {
      const res = await adminFetch('/feirantes', undefined, admin!.token)
      const data = await res.json()
      setFeirantes(Array.isArray(data) ? data : [])
    } catch {}
  }

  async function fetchMercadorias(fId?: number | null) {
    if (!fId) return
    try {
      const res = await adminFetch(`/mercadorias/feirantes/${fId}`, undefined, admin!.token)
      const data = await res.json()
      setMercadoriasDispo(Array.isArray(data) ? data : [])
    } catch {}
  }

  async function fetchCesta() {
    setLoading(true)
    try {
      const res = await adminFetch(`/cestas/${id}`, undefined, admin!.token)
      const data = await res.json()
      setNome(data.nome ?? '')
      setPreco(String(data.preco ?? ''))
      setDesconto(data.desconto ?? '')
      setEmojiVal(data.emoji ?? '')
      setCategoria(data.categoria ?? '')
      setImagemUrl(data.imagem ?? '')
      setFeiranteId(data.feirante_id ?? null)
      const ids = (data.mercadorias ?? []).map((m: any) => m.id)
      setMercSelecionadas(ids)
      await fetchMercadorias(data.feirante_id)
    } catch { alert('Erro ao carregar cesta') }
    setLoading(false)
  }

  function toggleMercadoria(mercId: number) {
    setMercSelecionadas((prev) =>
      prev.includes(mercId) ? prev.filter((x) => x !== mercId) : [...prev, mercId]
    )
  }

  async function salvar() {
    if (!nome || !preco) { alert('Nome e preço são obrigatórios'); return }
    setSaving(true)
    try {
      const body = JSON.stringify({
        nome, preco: Number(preco), desconto, emoji: emojiVal,
        categoria, imagem: imagemUrl, feirante_id: feiranteId,
        mercadorias: mercSelecionadas,
      })
      const res = isNovo
        ? await adminFetch('/cestas', { method: 'POST', body }, admin!.token)
        : await adminFetch(`/cestas/${id}`, { method: 'PUT', body }, admin!.token)
      const data = await res.json()
      if (!res.ok) { alert(data.erro || data.error || 'Erro ao salvar'); return }
      router.back()
    } catch { alert('Erro ao salvar cesta') }
    setSaving(false)
  }

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#255336" /></View>
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.gap}>
          <FormInput label="Nome da Cesta" value={nome} onChangeText={setNome} />
          <FormInput label="Preço (R$)" value={preco} onChangeText={setPreco} keyboardType="numeric" />
          <FormInput label="Desconto" value={desconto} onChangeText={setDesconto} placeholder="ex: 10% OFF" />
          <FormInput label="Emoji" value={emojiVal} onChangeText={setEmojiVal} placeholder="🧺" maxLength={2} />
          <FormInput label="Categoria" value={categoria} onChangeText={setCategoria} placeholder="ex: Semanal" />
          <FormInput label="URL da Imagem" value={imagemUrl} onChangeText={setImagemUrl} placeholder="https://..." />

          {/* Picker de feirante: só Superadmin (3) escolhe */}
          {admin!.nivel >= 3 && (
            <View>
              <Text style={styles.label}>Feirante</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.tabRow}>
                  {feirantes.map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      style={[styles.tab, feiranteId === f.id && styles.tabAtivo]}
                      onPress={() => {
                        setFeiranteId(f.id)
                        fetchMercadorias(f.id)
                      }}
                    >
                      <Text style={[styles.tabText, feiranteId === f.id && styles.tabTextoAtivo]}>
                        {f.nome}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {mercadoriasDispo.length > 0 && (
            <View>
              <Text style={styles.label}>Mercadorias da Cesta</Text>
              {mercadoriasDispo.map((m: any) => {
                const sel = mercSelecionadas.includes(m.id)
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.mercItem, sel && styles.mercItemSel]}
                    onPress={() => toggleMercadoria(m.id)}
                  >
                    <Text style={styles.mercCheck}>{sel ? '☑️' : '☐'}</Text>
                    <Text style={styles.mercNome}>{m.emoji ?? ''} {m.nome}</Text>
                    <Text style={styles.mercPreco}>R$ {Number(m.preco).toFixed(2)}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}

          <ActionButton label="Salvar Cesta" onPress={salvar} loading={saving} />
        </View>
      </View>
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
  },
  gap: { gap: 16 },
  label: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#333333', marginBottom: 8 },
  tabRow: { flexDirection: 'row', gap: 8 },
  tab: {
    borderWidth: 1,
    borderColor: '#255336',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  tabAtivo: { backgroundColor: '#255336' },
  tabText: { fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#255336' },
  tabTextoAtivo: { color: '#FFFFFF' },
  mercItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  mercItemSel: { backgroundColor: '#F9FFF9' },
  mercCheck: { fontSize: 18 },
  mercNome: { flex: 1, fontSize: 14, fontFamily: 'Poppins-Regular', color: '#333333' },
  mercPreco: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#255336' },
})
