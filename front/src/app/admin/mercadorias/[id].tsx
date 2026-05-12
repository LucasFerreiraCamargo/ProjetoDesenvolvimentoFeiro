import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import ActionButton from '../../../components/admin/ActionButton'
import FormInput from '../../../components/admin/FormInput'
import { useAdmin, useAdminGuard, useAdminTitulo } from '../../../contexts/AdminContext'
import { adminFetch } from '../../../utils/adminApi'

const CATEGORIAS = [
  'FRUTAS',
  'LEGUMES',
  'VERDURAS',
  'TEMPEROS',
  'OVOS',
  'ORGANICOS',
  'CARNES',
  'PEIXES',
  'LATICINIOS',
  'GRAOS',
]
const UNIDADES = ['UN', 'KG', 'CX']

// ─── Indicador de estoque ─────────────────────────────────────────────────────
function EstoqueIndicador({
  atual,
  minimo,
  maximo,
}: {
  atual: number
  minimo: number
  maximo: number
}) {
  if (maximo <= 0) return null
  const pct = Math.min(Math.max(atual / maximo, 0), 1)
  const cor =
    atual <= 0
      ? '#EF4444'
      : atual <= minimo
      ? '#F97316'
      : pct <= 0.4
      ? '#F59E0B'
      : '#10B981'
  const label =
    atual <= 0
      ? 'Sem estoque'
      : atual <= minimo
      ? 'Estoque crítico!'
      : pct <= 0.4
      ? 'Estoque baixo'
      : 'Estoque saudável'

  return (
    <View style={estStyles.container}>
      <View style={estStyles.topo}>
        <Text style={estStyles.label}>Nível de estoque</Text>
        <Text style={[estStyles.status, { color: cor }]}>{label}</Text>
      </View>
      <View style={estStyles.track}>
        <View style={[estStyles.fill, { width: `${pct * 100}%`, backgroundColor: cor }]} />
      </View>
      <View style={estStyles.legenda}>
        <Text style={estStyles.legendaText}>Mín: {minimo}</Text>
        <Text style={estStyles.legendaText}>Atual: {atual}</Text>
        <Text style={estStyles.legendaText}>Máx: {maximo}</Text>
      </View>
    </View>
  )
}

const estStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 12,
    gap: 8,
  },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#333333' },
  status: { fontSize: 12, fontFamily: 'Poppins-SemiBold' },
  track: {
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: { height: 8, borderRadius: 4 },
  legenda: { flexDirection: 'row', justifyContent: 'space-between' },
  legendaText: { fontSize: 11, fontFamily: 'Poppins-Regular', color: '#999999' },
})

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function MercadoriaDetalhe() {
  // Convenção: 1=Cliente, 2=Feirante, 3=Superadmin. Bloqueia cliente.
  useAdminGuard(2)
  const { id } = useLocalSearchParams<{ id: string }>()
  useAdminTitulo(id === 'novo' ? 'Nova Mercadoria' : 'Editar Mercadoria')
  const isNovo = id === 'novo'
  const { admin } = useAdmin()
  const router = useRouter()

  const [loading, setLoading] = useState(!isNovo)
  const [saving, setSaving] = useState(false)
  const [feirantes, setFeirantes] = useState<any[]>([])

  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [preco, setPreco] = useState('')
  const [emPromocao, setEmPromocao] = useState(false)
  const [precoPromocional, setPrecoPromocional] = useState('')
  const [quantidade, setQuantidade] = useState('')
  const [estoqueMinimo, setEstoqueMinimo] = useState('5')
  const [estoqueMaximo, setEstoqueMaximo] = useState('100')
  const [emoji, setEmoji] = useState('')
  const [categoria, setCategoria] = useState('FRUTAS')
  const [unidade, setUnidade] = useState('KG')
  const [destaque, setDestaque] = useState(false)
  const [foto, setFoto] = useState('')
  const [feiranteId, setFeiranteId] = useState<number | null>(null)

  useEffect(() => {
    // Só superadmin (3) precisa do picker de feirante. Feirante (2) usa o próprio id.
    if (admin!.nivel >= 3) fetchFeirantes()
    if (!isNovo) fetchMercadoria()
    else if (admin!.nivel === 2) setFeiranteId(admin!.feiranteId ?? null)
  }, [id])

  async function fetchFeirantes() {
    try {
      const res = await adminFetch('/feirantes', undefined, admin!.token)
      const data = await res.json()
      setFeirantes(Array.isArray(data) ? data : [])
    } catch (e) {
      console.warn('[Mercadoria.fetchFeirantes] Falha:', e)
    }
  }

  async function fetchMercadoria() {
    setLoading(true)
    try {
      const res = await adminFetch(`/mercadorias/${id}`, undefined, admin!.token)
      const data = await res.json()
      if (!res.ok) {
        console.warn('[Mercadoria.fetchMercadoria] API respondeu erro:', {
          status: res.status,
          body: data,
        })
        alert('Erro ao carregar mercadoria')
        return
      }
      setNome(data.nome ?? '')
      setDescricao(data.descricao ?? '')
      setPreco(String(data.preco ?? ''))
      // Se vier preco_promocional do banco, ativa o toggle de promoção
      if (data.preco_promocional != null) {
        setEmPromocao(true)
        setPrecoPromocional(String(data.preco_promocional))
      } else {
        setEmPromocao(false)
        setPrecoPromocional('')
      }
      setQuantidade(String(data.quantidade ?? ''))
      setEstoqueMinimo(String(data.estoque_minimo ?? 5))
      setEstoqueMaximo(String(data.estoque_maximo ?? 100))
      setEmoji(data.emoji ?? '')
      setCategoria(data.categoria ?? 'FRUTAS')
      setUnidade(data.unidade ?? 'KG')
      setDestaque(!!data.destaque)
      setFoto(data.foto ?? '')
      setFeiranteId(data.feirante_id ?? null)
    } catch (e) {
      console.error('[Mercadoria.fetchMercadoria] Exceção:', e)
      alert('Erro ao carregar mercadoria')
    } finally {
      setLoading(false)
    }
  }

  async function salvar() {
    if (!nome || !preco) { alert('Nome e preço são obrigatórios'); return }
    const qtd = Number(quantidade)
    const min = Number(estoqueMinimo)
    const max = Number(estoqueMaximo)
    if (max > 0 && min > max) { alert('Estoque mínimo não pode ser maior que o máximo'); return }

    // Validações que o Zod da API exige (preco, quantidade são z.number(), feirante_id é z.number())
    if (Number.isNaN(qtd)) { alert('Quantidade inválida'); return }
    const precoNum = Number(preco)
    if (Number.isNaN(precoNum) || precoNum <= 0) { alert('Preço inválido'); return }
    if (feiranteId == null || Number.isNaN(Number(feiranteId))) {
      alert('Selecione um feirante para a mercadoria')
      return
    }

    // Promoção: só envia preco_promocional se o toggle estiver ligado E valor for válido
    let precoPromoNum: number | null = null
    if (emPromocao) {
      const n = Number(precoPromocional)
      if (Number.isNaN(n) || n <= 0) {
        alert('Preço promocional inválido')
        return
      }
      if (n >= precoNum) {
        alert('O preço promocional deve ser menor que o preço normal')
        return
      }
      precoPromoNum = n
    }

    setSaving(true)
    const payload = {
      nome,
      descricao,
      preco: precoNum,
      preco_promocional: precoPromoNum,
      quantidade: qtd,
      estoque_minimo: min,
      estoque_maximo: max,
      emoji,
      categoria,
      unidade,
      destaque,
      foto,
      feirante_id: Number(feiranteId),
    }
    console.log('[Mercadoria.salvar] enviando:', payload)

    try {
      const body = JSON.stringify(payload)
      const res = isNovo
        ? await adminFetch('/mercadorias', { method: 'POST', body }, admin!.token)
        : await adminFetch(`/mercadorias/${id}`, { method: 'PUT', body }, admin!.token)
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        console.warn('[Mercadoria.salvar] API respondeu com erro:', {
          status: res.status,
          body: data,
        })
        alert(formataErroApi(data) || `Erro ${res.status} ao salvar`)
        return
      }

      console.log('[Mercadoria.salvar] OK:', data)
      router.back()
    } catch (e: any) {
      console.error('[Mercadoria.salvar] Exceção:', e)
      alert(e?.message ? `Erro ao salvar mercadoria: ${e.message}` : 'Erro ao salvar mercadoria')
    } finally {
      setSaving(false)
    }
  }

  /**
   * Converte respostas de erro da API (Zod, Prisma ou string) em mensagem legível.
   * A API às vezes manda { erro: ZodError }, { error: PrismaError } ou string.
   */
  function formataErroApi(data: any): string {
    if (!data) return ''
    const raw = data.erro ?? data.error ?? data.message ?? data
    if (!raw) return ''
    if (typeof raw === 'string') return raw

    // ZodError: { issues: [{ path: [...], message: '...' }] }
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

  // ───────────────────────────────────────────────────────────────────────────
  // Captura de foto (câmera ou galeria)
  // ───────────────────────────────────────────────────────────────────────────
  function resultadoParaDataUri(asset: ImagePicker.ImagePickerAsset): string | null {
    if (!asset?.base64) return null
    // Tenta inferir o mime a partir do mimeType (Android) ou fileName.
    const mime =
      asset.mimeType ||
      (asset.fileName?.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg')
    return `data:${mime};base64,${asset.base64}`
  }

  async function tirarFoto() {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync()
      if (!perm.granted) {
        alert('Permissão da câmera negada. Habilite nas configurações do app.')
        return
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      })
      if (result.canceled) return
      const dataUri = resultadoParaDataUri(result.assets[0])
      if (dataUri) setFoto(dataUri)
      else alert('Não foi possível ler a imagem.')
    } catch (e: any) {
      console.error('[Mercadoria.tirarFoto] Exceção:', e)
      alert(`Erro ao tirar foto: ${e?.message ?? e}`)
    }
  }

  async function escolherDaGaleria() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!perm.granted) {
        alert('Permissão da galeria negada. Habilite nas configurações do app.')
        return
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      })
      if (result.canceled) return
      const dataUri = resultadoParaDataUri(result.assets[0])
      if (dataUri) setFoto(dataUri)
      else alert('Não foi possível ler a imagem.')
    } catch (e: any) {
      console.error('[Mercadoria.escolherDaGaleria] Exceção:', e)
      alert(`Erro ao abrir galeria: ${e?.message ?? e}`)
    }
  }

  function removerFoto() {
    setFoto('')
  }

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#255336" /></View>
  }

  const qtdNum = Number(quantidade) || 0
  const minNum = Number(estoqueMinimo) || 0
  const maxNum = Number(estoqueMaximo) || 0

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <View style={styles.gap}>

          {/* ── Identificação ── */}
          <Text style={styles.secao}>
            <Ionicons name="information-circle-outline" size={15} color="#255336" /> Identificação
          </Text>
          <FormInput label="Nome do produto *" value={nome} onChangeText={setNome} placeholder="Ex: Tomate cereja" />
          <FormInput
            label="Descrição"
            value={descricao}
            onChangeText={setDescricao}
            placeholder="Descreva o produto, origem, forma de cultivo..."
            multiline
            numberOfLines={3}
          />
          <FormInput label="Emoji" value={emoji} onChangeText={setEmoji} placeholder="🍅" maxLength={2} />

          {/* ── Categoria e Unidade ── */}
          <Text style={styles.secao}>
            <Ionicons name="pricetag-outline" size={15} color="#255336" /> Categoria e Unidade
          </Text>
          <View>
            <Text style={styles.label}>Categoria</Text>
            <View style={styles.tabRow}>
              {CATEGORIAS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.tab, categoria === c && styles.tabAtivo]}
                  onPress={() => setCategoria(c)}
                >
                  <Text style={[styles.tabText, categoria === c && styles.tabTextoAtivo]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View>
            <Text style={styles.label}>Unidade de venda</Text>
            <View style={styles.tabRow}>
              {UNIDADES.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.tab, unidade === u && styles.tabAtivo]}
                  onPress={() => setUnidade(u)}
                >
                  <Text style={[styles.tabText, unidade === u && styles.tabTextoAtivo]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Preço ── */}
          <Text style={styles.secao}>
            <Ionicons name="cash-outline" size={15} color="#255336" /> Preço
          </Text>
          <FormInput
            label="Preço (R$) *"
            value={preco}
            onChangeText={setPreco}
            keyboardType="numeric"
            placeholder="0,00"
          />

          {/* Toggle de promoção */}
          <View style={styles.destaqueRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Em promoção?</Text>
              <Text style={styles.destaqueHint}>
                Quando ligado, define um preço promocional menor que o normal.
              </Text>
            </View>
            <Switch
              value={emPromocao}
              onValueChange={(v) => {
                setEmPromocao(v)
                if (!v) setPrecoPromocional('')
              }}
              trackColor={{ false: '#DDD', true: '#255336' }}
              thumbColor="#FFF"
            />
          </View>

          {emPromocao && (
            <>
              <FormInput
                label="Preço promocional (R$)"
                value={precoPromocional}
                onChangeText={setPrecoPromocional}
                keyboardType="numeric"
                placeholder="0,00"
              />

              {/* Indicador do desconto calculado em tempo real */}
              {(() => {
                const p = Number(preco)
                const pp = Number(precoPromocional)
                if (Number.isNaN(p) || p <= 0) return null
                if (Number.isNaN(pp) || pp <= 0) {
                  return (
                    <Text style={styles.promoHintNeutro}>
                      Preencha o preço promocional para calcular o desconto.
                    </Text>
                  )
                }
                if (pp >= p) {
                  return (
                    <Text style={styles.promoHintInvalido}>
                      ⚠ O preço promocional precisa ser menor que R$ {p.toFixed(2)}.
                    </Text>
                  )
                }
                const pct = ((p - pp) / p) * 100
                const economia = p - pp
                return (
                  <View style={styles.promoBadgeBox}>
                    <View style={styles.promoBadgePct}>
                      <Text style={styles.promoBadgePctText}>
                        -{pct.toFixed(0)}%
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.promoBadgeLinhaCheia}>
                        De{' '}
                        <Text style={styles.promoPrecoOriginal}>
                          R$ {p.toFixed(2)}
                        </Text>{' '}
                        por{' '}
                        <Text style={styles.promoPrecoNovo}>
                          R$ {pp.toFixed(2)}
                        </Text>
                      </Text>
                      <Text style={styles.promoBadgeEconomia}>
                        Economia de R$ {economia.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                )
              })()}
            </>
          )}

          {/* ── Estoque ── */}
          <Text style={styles.secao}>
            <Ionicons name="layers-outline" size={15} color="#255336" /> Estoque
          </Text>
          <View style={styles.estoqueGrid}>
            <View style={styles.estoqueCol}>
              <FormInput
                label="Qtd. atual"
                value={quantidade}
                onChangeText={setQuantidade}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.estoqueGap} />
            <View style={styles.estoqueCol}>
              <FormInput
                label="Mínimo ⚠️"
                value={estoqueMinimo}
                onChangeText={setEstoqueMinimo}
                keyboardType="numeric"
                placeholder="5"
              />
            </View>
            <View style={styles.estoqueGap} />
            <View style={styles.estoqueCol}>
              <FormInput
                label="Máximo"
                value={estoqueMaximo}
                onChangeText={setEstoqueMaximo}
                keyboardType="numeric"
                placeholder="100"
              />
            </View>
          </View>

          {maxNum > 0 && (
            <EstoqueIndicador atual={qtdNum} minimo={minNum} maximo={maxNum} />
          )}

          {/* ── Visibilidade ── */}
          <Text style={styles.secao}>
            <Ionicons name="eye-outline" size={15} color="#255336" /> Visibilidade
          </Text>
          <View style={styles.destaqueRow}>
            <View>
              <Text style={styles.label}>Produto em destaque</Text>
              <Text style={styles.destaqueHint}>Aparece em "Promoções do Dia" na Home</Text>
            </View>
            <Switch
              value={destaque}
              onValueChange={setDestaque}
              trackColor={{ false: '#DDD', true: '#255336' }}
              thumbColor="#FFF"
            />
          </View>

          {/* ── Foto ── */}
          <Text style={styles.secao}>
            <Ionicons name="image-outline" size={15} color="#255336" /> Foto
          </Text>

          {/* Preview da foto (URL, base64 ou data URI) */}
          {foto ? (
            <View style={styles.fotoPreviewWrapper}>
              <Image
                source={{ uri: foto }}
                style={styles.fotoPreview}
                resizeMode="cover"
                onError={() =>
                  console.warn('[Mercadoria] Não foi possível renderizar a foto')
                }
              />
              <TouchableOpacity
                style={styles.fotoRemoveBtn}
                onPress={removerFoto}
                accessibilityLabel="Remover foto"
              >
                <Ionicons name="close-circle" size={28} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.fotoPlaceholder}>
              <Ionicons name="image-outline" size={32} color="#999" />
              <Text style={styles.fotoPlaceholderText}>Nenhuma foto selecionada</Text>
            </View>
          )}

          {/* Botões de captura */}
          <View style={styles.fotoBotoesRow}>
            <TouchableOpacity
              style={styles.fotoBotao}
              onPress={tirarFoto}
              accessibilityLabel="Tirar foto com a câmera"
            >
              <Ionicons name="camera-outline" size={22} color="#255336" />
              <Text style={styles.fotoBotaoText}>Câmera</Text>
            </TouchableOpacity>
            <View style={styles.fotoBotoesGap} />
            <TouchableOpacity
              style={styles.fotoBotao}
              onPress={escolherDaGaleria}
              accessibilityLabel="Escolher foto da galeria"
            >
              <Ionicons name="images-outline" size={22} color="#255336" />
              <Text style={styles.fotoBotaoText}>Galeria</Text>
            </TouchableOpacity>
          </View>

          {/* Opção alternativa: colar URL externa */}
          <FormInput
            label="...ou cole uma URL de imagem"
            value={foto?.startsWith('data:') ? '' : foto}
            onChangeText={setFoto}
            placeholder="https://..."
            autoCapitalize="none"
          />

          {/* ── Feirante (apenas superadmin pode escolher) ── */}
          {admin!.nivel >= 3 && (
            <>
              <Text style={styles.secao}>
                <Ionicons name="storefront-outline" size={15} color="#255336" /> Feirante
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.tabRow}>
                  {feirantes.map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      style={[styles.tab, feiranteId === f.id && styles.tabAtivo]}
                      onPress={() => setFeiranteId(f.id)}
                    >
                      <Text style={[styles.tabText, feiranteId === f.id && styles.tabTextoAtivo]}>
                        {f.nome}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          <ActionButton label="Salvar Mercadoria" onPress={salvar} loading={saving} />
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
  secao: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    color: '#255336',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  label: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#333333', marginBottom: 8 },
  tabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tab: {
    borderWidth: 1,
    borderColor: '#255336',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tabAtivo: { backgroundColor: '#255336' },
  tabText: { fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#255336' },
  tabTextoAtivo: { color: '#FFFFFF' },
  estoqueGrid: { flexDirection: 'row', alignItems: 'flex-start' },
  estoqueCol: { flex: 1 },
  estoqueGap: { width: 8 },
  destaqueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 16,
    gap: 12,
  },
  destaqueHint: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#999999',
    marginTop: 2,
  },
  // ── Foto: preview + botões câmera/galeria ──
  fotoPreviewWrapper: {
    alignSelf: 'center',
    position: 'relative',
  },
  fotoPreview: {
    width: 180,
    height: 180,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  fotoRemoveBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  fotoPlaceholder: {
    alignSelf: 'center',
    width: 180,
    height: 180,
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  fotoPlaceholderText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#999999',
  },
  fotoBotoesRow: {
    flexDirection: 'row',
  },
  fotoBotoesGap: {
    width: 12,
  },
  fotoBotao: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#255336',
    backgroundColor: '#FFFFFF',
  },
  fotoBotaoText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#255336',
  },
  // ── Indicador de promoção ──
  promoHintNeutro: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#999999',
    fontStyle: 'italic',
  },
  promoHintInvalido: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#DC2626',
  },
  promoBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
    padding: 12,
  },
  promoBadgePct: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  promoBadgePctText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  promoBadgeLinhaCheia: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#333333',
  },
  promoPrecoOriginal: {
    textDecorationLine: 'line-through',
    color: '#999999',
  },
  promoPrecoNovo: {
    fontFamily: 'Poppins-SemiBold',
    color: '#255336',
  },
  promoBadgeEconomia: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#92400E',
    marginTop: 2,
  },
})
