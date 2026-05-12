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
    // Validações que batem com o cestaSchema da API:
    // nome.min(3), preco.positive(), feirante_id.number(), imagem.url() (se enviada)
    if (!nome || nome.length < 3) {
      alert('O nome da cesta deve ter pelo menos 3 caracteres')
      return
    }
    const precoNum = Number(preco)
    if (Number.isNaN(precoNum) || precoNum <= 0) {
      alert('Informe um preço válido (maior que zero)')
      return
    }
    if (feiranteId == null || Number.isNaN(Number(feiranteId))) {
      alert(
        admin!.nivel >= 3
          ? 'Selecione um feirante para a cesta'
          : 'Sua conta não está vinculada a um feirante. Peça ao admin para associar.'
      )
      return
    }
    // imagem é opcional, mas se enviada precisa ser URL válida
    if (imagemUrl && !/^https?:\/\//i.test(imagemUrl)) {
      alert('A imagem precisa ser uma URL começando com http(s)://, ou deixe em branco')
      return
    }

    setSaving(true)

    // Monta payload omitindo campos opcionais quando vazios (Zod rejeita "" em z.string().url())
    const payload: any = {
      nome,
      preco: precoNum,
      feirante_id: Number(feiranteId),
      mercadorias: mercSelecionadas,
    }
    if (desconto) payload.desconto = desconto
    if (emojiVal) payload.emoji = emojiVal
    if (categoria) payload.categoria = categoria
    if (imagemUrl) payload.imagem = imagemUrl

    console.log('[Cesta.salvar] enviando:', payload)

    try {
      const body = JSON.stringify(payload)
      const res = isNovo
        ? await adminFetch('/cestas', { method: 'POST', body }, admin!.token)
        : await adminFetch(`/cestas/${id}`, { method: 'PUT', body }, admin!.token)
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        console.warn('[Cesta.salvar] API respondeu erro:', {
          status: res.status,
          body: data,
        })
        if (res.status === 401 || res.status === 403) {
          alert('Sua sessão expirou ou você não tem permissão. Faça login novamente.')
          return
        }
        alert(formataErroApi(data) || `Erro ${res.status} ao salvar`)
        return
      }

      console.log('[Cesta.salvar] OK:', data)
      router.back()
    } catch (e: any) {
      console.error('[Cesta.salvar] Exceção:', e)
      alert(e?.message ? `Erro ao salvar cesta: ${e.message}` : 'Erro ao salvar cesta')
    } finally {
      setSaving(false)
    }
  }

  /**
   * Formata respostas de erro da API (Zod fieldErrors, ZodError, Prisma ou string).
   * - POST /cestas devolve { erro: { nome: [...], imagem: [...] } } (fieldErrors)
   * - Outras rotas devolvem { erro: ZodError } com `issues[]`
   */
  function formataErroApi(data: any): string {
    if (!data) return ''
    const raw = data.erro ?? data.error ?? data.message ?? data
    if (!raw) return ''
    if (typeof raw === 'string') return raw

    // Formato Zod com .flatten().fieldErrors: { campo: ["msg1", "msg2"] }
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const linhas: string[] = []
      for (const campo of Object.keys(raw)) {
        const v = raw[campo]
        if (Array.isArray(v) && v.length) {
          linhas.push(`${campo}: ${v.join(', ')}`)
        } else if (typeof v === 'string') {
          linhas.push(`${campo}: ${v}`)
        }
      }
      if (linhas.length) return linhas.join('\n')
    }

    // ZodError completo com issues[]
    if (Array.isArray(raw?.issues)) {
      return raw.issues
        .map((i: any) => `${(i.path ?? []).join('.') || 'campo'}: ${i.message}`)
        .join('\n')
    }

    if (typeof raw?.message === 'string') return raw.message

    try {
      return JSON.stringify(raw, null, 2)
    } catch {
      return String(raw)
    }
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
