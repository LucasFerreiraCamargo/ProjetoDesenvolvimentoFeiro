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
import type { MovimentacaoEstoque, TipoMovimentacao } from '../../../types/api'
import { adminFetch } from '../../../utils/adminApi'
import { toTitleCasePtBr } from '../../../utils/texto'

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

// Pontos de maturação que um produto pode oferecer (ex.: frutas). Deve espelhar
// o enum PontoMaturacao do backend. Vazio por padrão: só aparece pro cliente
// quando o feirante seleciona ao menos um.
const PONTOS_MATURACAO: { valor: string; label: string; emoji: string }[] = [
  { valor: 'VERDE', label: 'Verde', emoji: '🟢' },
  { valor: 'AO_PONTO', label: 'Ao Ponto', emoji: '🟡' },
  { valor: 'MADURO', label: 'Maduro', emoji: '🔴' },
]

// Unidades discretas válidas para produtos controlados por UNIDADE.
const UNIDADES_DISCRETAS = ['UN', 'CX']
const UNIDADE_DISCRETA_LABEL: Record<string, string> = {
  UN: 'Unidade (UN)',
  CX: 'Caixa (CX)',
}

type TipoControle = 'PESO' | 'UNIDADE'

const round2 = (n: number) => Math.round(n * 100) / 100

// Aparência de cada tipo de movimentação no histórico (livro-razão).
const TIPO_MOV: Record<
  TipoMovimentacao,
  { label: string; icon: string; cor: string; bg: string }
> = {
  ENTRADA: { label: 'Entrada', icon: 'arrow-down-circle', cor: '#065F46', bg: '#ECFDF5' },
  ESTORNO: { label: 'Estorno', icon: 'arrow-undo', cor: '#065F46', bg: '#ECFDF5' },
  VENDA: { label: 'Venda', icon: 'cart', cor: '#1E40AF', bg: '#EFF6FF' },
  AJUSTE: { label: 'Ajuste', icon: 'options', cor: '#92400E', bg: '#FEF3C7' },
  PERDA: { label: 'Perda', icon: 'trash-bin', cor: '#B91C1C', bg: '#FEF2F2' },
}

// Formata a data/hora curta (dd/mm hh:mm) de uma movimentação.
function fmtDataHora(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const hora = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dia}/${mes} ${hora}:${min}`
}

// ─── Indicador de estoque ─────────────────────────────────────────────────────
function EstoqueIndicador({
  atual,
  minimo,
  maximo,
  unidade,
}: {
  atual: number
  minimo: number
  maximo: number
  unidade: string
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
        <Text style={estStyles.label}>Nível de estoque ({unidade})</Text>
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

  // Histórico do livro-razão (movimentações de estoque) da mercadoria.
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([])
  const [loadingMov, setLoadingMov] = useState(false)

  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')

  // ─── Controle de estoque estilo ERP ───
  // PESO    → estoque em KG; `precoKg` é a fonte da verdade. Venda por unidade
  //           é opcional e usa `pesoEstimadoUnidade` como fator de conversão.
  // UNIDADE → estoque discreto em UN/CX; `precoUnidade` é o preço.
  const [tipoControle, setTipoControle] = useState<TipoControle>('UNIDADE')
  const [precoKg, setPrecoKg] = useState('')
  const [permiteVendaUnidade, setPermiteVendaUnidade] = useState(false)
  const [pesoEstimadoUnidade, setPesoEstimadoUnidade] = useState('')
  const [precoUnidade, setPrecoUnidade] = useState('')
  const [unidadeDiscreta, setUnidadeDiscreta] = useState('UN')

  // Promoção sobre o preço principal (preco_kg em PESO, preco_unidade em UNIDADE).
  const [emPromocao, setEmPromocao] = useState(false)
  const [precoPromocional, setPrecoPromocional] = useState('')

  const [quantidade, setQuantidade] = useState('')
  const [estoqueMinimo, setEstoqueMinimo] = useState('5')
  const [estoqueMaximo, setEstoqueMaximo] = useState('100')
  const [categoria, setCategoria] = useState('FRUTAS')
  // Ponto de maturação: desligado por padrão. Quando ligado, o feirante escolhe
  // um ou mais pontos; a lista vai pro cliente. Vazio = não oferece.
  const [ofereceMaturacao, setOfereceMaturacao] = useState(false)
  const [pontosMaturacao, setPontosMaturacao] = useState<string[]>([])
  const [destaque, setDestaque] = useState(false)
  const [foto, setFoto] = useState('')
  const [feiranteId, setFeiranteId] = useState<number | null>(null)

  // Unidade-base do estoque conforme o tipo de controle.
  const unidadeEstoque = tipoControle === 'PESO' ? 'KG' : unidadeDiscreta
  // Preço principal mostrado para a forma de venda primária.
  const precoPrincipal = tipoControle === 'PESO' ? Number(precoKg) : Number(precoUnidade)

  useEffect(() => {
    // Só superadmin (3) precisa do picker de feirante. Feirante (2) usa o próprio id.
    if (admin!.nivel >= 3) fetchFeirantes()
    if (!isNovo) {
      fetchMercadoria()
      fetchMovimentacoes()
    } else if (admin!.nivel === 2) setFeiranteId(admin!.feiranteId ?? null)
  }, [id])

  async function fetchMovimentacoes() {
    setLoadingMov(true)
    try {
      const res = await adminFetch(`/mercadorias/${id}/movimentacoes`, undefined, admin!.token)
      const data = await res.json()
      setMovimentacoes(Array.isArray(data) ? data : [])
    } catch (e) {
      console.warn('[Mercadoria.fetchMovimentacoes] Falha:', e)
    } finally {
      setLoadingMov(false)
    }
  }

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

      // Reconstrói a configuração de controle a partir dos campos ERP.
      const tipo: TipoControle = data.tipo_controle === 'PESO' ? 'PESO' : 'UNIDADE'
      setTipoControle(tipo)
      setPermiteVendaUnidade(!!data.permite_venda_unidade)
      setPesoEstimadoUnidade(
        data.peso_estimado_unidade != null ? String(data.peso_estimado_unidade) : '',
      )
      setPrecoKg(data.preco_kg != null ? String(data.preco_kg) : '')
      // Em UNIDADE o preço por unidade pode estar só no campo legado `preco`.
      setPrecoUnidade(
        data.preco_unidade != null
          ? String(data.preco_unidade)
          : tipo === 'UNIDADE'
          ? String(data.preco ?? '')
          : '',
      )
      setUnidadeDiscreta(data.unidade && data.unidade !== 'KG' ? data.unidade : 'UN')

      setEmPromocao(data.preco_promocional != null)
      setPrecoPromocional(
        data.preco_promocional != null ? String(data.preco_promocional) : '',
      )

      setQuantidade(String(data.quantidade ?? ''))
      setEstoqueMinimo(String(data.estoque_minimo ?? 5))
      setEstoqueMaximo(String(data.estoque_maximo ?? 100))
      setCategoria(data.categoria ?? 'FRUTAS')
      const pontos = Array.isArray(data.pontos_maturacao) ? data.pontos_maturacao : []
      setPontosMaturacao(pontos)
      setOfereceMaturacao(pontos.length > 0)
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
    if (!nome) { alert('Nome é obrigatório'); return }
    const qtd = Number(quantidade)
    const min = Number(estoqueMinimo)
    const max = Number(estoqueMaximo)
    if (max > 0 && min > max) { alert('Estoque mínimo não pode ser maior que o máximo'); return }
    if (Number.isNaN(qtd)) { alert('Quantidade inválida'); return }
    if (feiranteId == null || Number.isNaN(Number(feiranteId))) {
      alert('Selecione um feirante para a mercadoria')
      return
    }

    // ── Validação dos preços conforme o tipo de controle ──
    let preco_kg: number | null = null
    let preco_unidade: number | null = null
    let peso_estimado_unidade: number | null = null
    const permite = tipoControle === 'PESO' && permiteVendaUnidade

    if (tipoControle === 'PESO') {
      const pk = Number(precoKg)
      if (Number.isNaN(pk) || pk <= 0) { alert('Informe um preço por KG válido'); return }
      preco_kg = pk

      if (permite) {
        const peso = Number(pesoEstimadoUnidade)
        if (Number.isNaN(peso) || peso <= 0) {
          alert('Informe o peso estimado por unidade (kg) para vender por unidade')
          return
        }
        peso_estimado_unidade = peso
        // Preço por unidade é opcional: vazio → derivado proporcional ao KG.
        if (precoUnidade.trim() !== '') {
          const pu = Number(precoUnidade)
          if (Number.isNaN(pu) || pu <= 0) { alert('Preço por unidade inválido'); return }
          preco_unidade = pu
        } else {
          preco_unidade = round2(pk * peso)
        }
      }
    } else {
      const pu = Number(precoUnidade)
      if (Number.isNaN(pu) || pu <= 0) { alert('Informe um preço por unidade válido'); return }
      preco_unidade = pu
    }

    // Preço principal (legado) = fonte da verdade da forma primária.
    const precoBase = tipoControle === 'PESO' ? (preco_kg as number) : (preco_unidade as number)

    // Promoção opcional sobre o preço principal.
    let promoNum: number | null = null
    if (emPromocao) {
      const n = Number(precoPromocional)
      if (Number.isNaN(n) || n <= 0) { alert('Preço promocional inválido'); return }
      if (n >= precoBase) {
        alert('O preço promocional deve ser menor que o preço normal')
        return
      }
      promoNum = n
    }

    // Se o feirante ligou "ponto de maturação", precisa escolher ao menos um.
    if (ofereceMaturacao && pontosMaturacao.length === 0) {
      alert('Selecione ao menos um ponto de maturação ou desative a opção')
      return
    }

    setSaving(true)
    const payload = {
      nome,
      descricao,
      tipo_controle: tipoControle,
      permite_venda_unidade: permite,
      peso_estimado_unidade,
      preco_kg,
      preco_unidade,
      // Campos primários (legados) — o backend também os deriva, mas enviamos
      // para satisfazer a validação (`preco` é obrigatório e positivo).
      preco: precoBase,
      preco_promocional: promoNum,
      unidade: tipoControle === 'PESO' ? 'KG' : unidadeDiscreta,
      quantidade: qtd,
      estoque_minimo: min,
      estoque_maximo: max,
      categoria,
      // Vazio quando a opção está desligada → produto não oferece maturação.
      pontos_maturacao: ofereceMaturacao ? pontosMaturacao : [],
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

  // Pré-visualização do preço por unidade derivado (quando o feirante não informa).
  const precoUnidadeDerivado = (() => {
    const pk = Number(precoKg)
    const peso = Number(pesoEstimadoUnidade)
    if (Number.isNaN(pk) || pk <= 0 || Number.isNaN(peso) || peso <= 0) return null
    return round2(pk * peso)
  })()

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
          <FormInput
            label="Nome do produto *"
            value={nome}
            onChangeText={setNome}
            placeholder="Ex: Tomate cereja"
            // Ao perder foco, normaliza para Title Case PT-BR ("tomate cereja" -> "Tomate Cereja").
            onBlur={() => {
              const normalizado = toTitleCasePtBr(nome)
              if (normalizado !== nome) setNome(normalizado)
            }}
          />
          <FormInput
            label="Descrição"
            value={descricao}
            onChangeText={setDescricao}
            placeholder="Descreva o produto, origem, forma de cultivo..."
            multiline
            numberOfLines={3}
          />

          {/* ── Categoria ── */}
          <Text style={styles.secao}>
            <Ionicons name="pricetag-outline" size={15} color="#255336" /> Categoria
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

          {/* ── Controle de estoque e preços ── */}
          <Text style={styles.secao}>
            <Ionicons name="cube-outline" size={15} color="#255336" /> Controle de estoque
          </Text>
          <Text style={styles.destaqueHint}>
            Como o estoque deste produto é contado e vendido.
          </Text>

          <View style={styles.tipoRow}>
            <TouchableOpacity
              style={[styles.tipoCard, tipoControle === 'PESO' && styles.tipoCardAtivo]}
              onPress={() => setTipoControle('PESO')}
            >
              <Ionicons
                name="scale-outline"
                size={22}
                color={tipoControle === 'PESO' ? '#FFFFFF' : '#255336'}
              />
              <Text style={[styles.tipoTitulo, tipoControle === 'PESO' && styles.tipoTextoAtivo]}>
                Por peso (KG)
              </Text>
              <Text style={[styles.tipoDesc, tipoControle === 'PESO' && styles.tipoTextoAtivo]}>
                Estoque em quilos. Ex.: tomate, picanha.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tipoCard, tipoControle === 'UNIDADE' && styles.tipoCardAtivo]}
              onPress={() => setTipoControle('UNIDADE')}
            >
              <Ionicons
                name="cube-outline"
                size={22}
                color={tipoControle === 'UNIDADE' ? '#FFFFFF' : '#255336'}
              />
              <Text style={[styles.tipoTitulo, tipoControle === 'UNIDADE' && styles.tipoTextoAtivo]}>
                Por unidade
              </Text>
              <Text style={[styles.tipoDesc, tipoControle === 'UNIDADE' && styles.tipoTextoAtivo]}>
                Estoque discreto. Ex.: ovos, alface, caixa.
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Configuração PESO ── */}
          {tipoControle === 'PESO' && (
            <View style={styles.configCard}>
              <FormInput
                label="Preço por KG (R$) *"
                value={precoKg}
                onChangeText={setPrecoKg}
                keyboardType="numeric"
                placeholder="0,00"
              />

              <View style={styles.destaqueRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Vender também por unidade?</Text>
                  <Text style={styles.destaqueHint}>
                    Permite que o cliente compre por peça (ex.: 1 picanha). O estoque
                    continua em KG e é reservado pelo peso estimado.
                  </Text>
                </View>
                <Switch
                  value={permiteVendaUnidade}
                  onValueChange={setPermiteVendaUnidade}
                  trackColor={{ false: '#DDD', true: '#255336' }}
                  thumbColor="#FFF"
                />
              </View>

              {permiteVendaUnidade && (
                <>
                  <FormInput
                    label="Peso estimado por unidade (KG) *"
                    value={pesoEstimadoUnidade}
                    onChangeText={setPesoEstimadoUnidade}
                    keyboardType="numeric"
                    placeholder="Ex: 1,300 (picanha) ou 0,120 (tomate)"
                  />
                  <FormInput
                    label="Preço por unidade (R$) — opcional"
                    value={precoUnidade}
                    onChangeText={setPrecoUnidade}
                    keyboardType="numeric"
                    placeholder={
                      precoUnidadeDerivado != null
                        ? `Deixe vazio para usar ${precoUnidadeDerivado.toFixed(2)}`
                        : '0,00'
                    }
                  />
                  {precoUnidade.trim() === '' && precoUnidadeDerivado != null && (
                    <Text style={styles.infoCalc}>
                      Preço por unidade calculado automaticamente: R$ {precoUnidadeDerivado.toFixed(2)}
                      {' '}(preço/kg × peso estimado).
                    </Text>
                  )}
                  <View style={styles.avisoBox}>
                    <Ionicons name="alert-circle-outline" size={18} color="#92400E" />
                    <Text style={styles.avisoText}>
                      O cliente verá um aviso de que o preço por unidade é estimado e pode
                      variar até 10% após a pesagem.
                    </Text>
                  </View>
                </>
              )}
            </View>
          )}

          {/* ── Configuração UNIDADE ── */}
          {tipoControle === 'UNIDADE' && (
            <View style={styles.configCard}>
              <View>
                <Text style={styles.label}>Unidade de venda</Text>
                <View style={[styles.tabRow, { marginTop: 8 }]}>
                  {UNIDADES_DISCRETAS.map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[styles.tab, unidadeDiscreta === u && styles.tabAtivo]}
                      onPress={() => setUnidadeDiscreta(u)}
                    >
                      <Text style={[styles.tabText, unidadeDiscreta === u && styles.tabTextoAtivo]}>
                        {UNIDADE_DISCRETA_LABEL[u] ?? u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <FormInput
                label="Preço por unidade (R$) *"
                value={precoUnidade}
                onChangeText={setPrecoUnidade}
                keyboardType="numeric"
                placeholder="0,00"
              />
            </View>
          )}

          {/* ── Promoção ── */}
          <View style={styles.destaqueRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Em promoção?</Text>
              <Text style={styles.destaqueHint}>
                Define um preço promocional menor que o preço principal.
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
              {(() => {
                const p = precoPrincipal
                const pp = Number(precoPromocional)
                if (Number.isNaN(p) || p <= 0) {
                  return (
                    <Text style={styles.promoHintNeutro}>
                      Informe o preço principal para calcular o desconto.
                    </Text>
                  )
                }
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
                      <Text style={styles.promoBadgePctText}>-{pct.toFixed(0)}%</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.promoBadgeLinhaCheia}>
                        De{' '}
                        <Text style={styles.promoPrecoOriginal}>R$ {p.toFixed(2)}</Text>{' '}
                        por{' '}
                        <Text style={styles.promoPrecoNovo}>R$ {pp.toFixed(2)}</Text>
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

          {/* ── Ponto de maturação ── */}
          <Text style={styles.secao}>
            <Ionicons name="leaf-outline" size={15} color="#255336" /> Ponto de maturação
          </Text>
          <View style={styles.destaqueRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Oferecer ponto de maturação?</Text>
              <Text style={styles.destaqueHint}>
                Deixe o cliente escolher o ponto na compra (ex.: frutas). Desligado,
                o produto não mostra essa opção.
              </Text>
            </View>
            <Switch
              value={ofereceMaturacao}
              onValueChange={(v) => {
                setOfereceMaturacao(v)
                if (!v) setPontosMaturacao([])
              }}
              trackColor={{ false: '#DDD', true: '#255336' }}
              thumbColor="#FFF"
            />
          </View>

          {ofereceMaturacao && (
            <View style={styles.configCard}>
              <Text style={styles.label}>Pontos disponíveis para o cliente</Text>
              <View style={styles.tabRow}>
                {PONTOS_MATURACAO.map((p) => {
                  const ativo = pontosMaturacao.includes(p.valor)
                  return (
                    <TouchableOpacity
                      key={p.valor}
                      style={[styles.tab, ativo && styles.tabAtivo]}
                      onPress={() =>
                        setPontosMaturacao((atual) =>
                          atual.includes(p.valor)
                            ? atual.filter((v) => v !== p.valor)
                            : [...atual, p.valor],
                        )
                      }
                    >
                      <Text style={[styles.tabText, ativo && styles.tabTextoAtivo]}>
                        {p.emoji} {p.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
              {pontosMaturacao.length === 0 && (
                <Text style={styles.promoHintNeutro}>
                  Selecione ao menos um ponto para o cliente poder escolher.
                </Text>
              )}
            </View>
          )}

          {/* ── Estoque ── */}
          <Text style={styles.secao}>
            <Ionicons name="layers-outline" size={15} color="#255336" /> Estoque
          </Text>
          <Text style={styles.destaqueHint}>
            A quantidade é contada em {unidadeEstoque}
            {tipoControle === 'PESO' ? ' (quilos)' : ''}.
          </Text>

          <View style={styles.estoqueGrid}>
            <View style={styles.estoqueCol}>
              <FormInput
                label={`Qtd. atual (${unidadeEstoque})`}
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
            <EstoqueIndicador atual={qtdNum} minimo={minNum} maximo={maxNum} unidade={unidadeEstoque} />
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

        {!isNovo && (
          <View style={[styles.card, styles.cardMov]}>
            <Text style={styles.movTitulo}>
              <Ionicons name="receipt-outline" size={15} color="#255336" /> Movimentações
            </Text>
            <Text style={styles.movAjuda}>Últimos lançamentos no estoque (mais recentes primeiro).</Text>

            {loadingMov ? (
              <ActivityIndicator color="#255336" style={{ marginTop: 16 }} />
            ) : movimentacoes.length === 0 ? (
              <View style={styles.movVazio}>
                <Ionicons name="file-tray-outline" size={28} color="#BBBBBB" />
                <Text style={styles.movVazioTexto}>Nenhuma movimentação registrada.</Text>
              </View>
            ) : (
              <View style={styles.movLista}>
                {movimentacoes.map((mov) => {
                  const cfg = TIPO_MOV[mov.tipo] ?? TIPO_MOV.AJUSTE
                  const delta = Number(mov.quantidade)
                  const positivo = delta >= 0
                  const sinal = positivo ? '+' : '−'
                  return (
                    <View key={mov.id} style={styles.movItem}>
                      <View style={[styles.movIcone, { backgroundColor: cfg.bg }]}>
                        <Ionicons name={cfg.icon as any} size={18} color={cfg.cor} />
                      </View>
                      <View style={styles.movInfo}>
                        <View style={styles.movLinhaTopo}>
                          <Text style={[styles.movTipo, { color: cfg.cor }]}>{cfg.label}</Text>
                          <Text style={styles.movData}>{fmtDataHora(mov.createdAt)}</Text>
                        </View>
                        {mov.motivo ? (
                          <Text style={styles.movMotivo} numberOfLines={2}>
                            {mov.motivo}
                          </Text>
                        ) : null}
                        {mov.saldo_posterior != null ? (
                          <Text style={styles.movSaldo}>
                            Saldo: {round2(Number(mov.saldo_posterior))}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={[styles.movDelta, { color: positivo ? '#065F46' : '#B91C1C' }]}>
                        {sinal}
                        {round2(Math.abs(delta))}
                      </Text>
                    </View>
                  )
                })}
              </View>
            )}
          </View>
        )}
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
  cardMov: { marginTop: 16 },
  movTitulo: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    color: '#255336',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  movAjuda: { fontSize: 12, fontFamily: 'Poppins-Regular', color: '#777777', marginTop: 4 },
  movVazio: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  movVazioTexto: { fontSize: 13, fontFamily: 'Poppins-Regular', color: '#999999' },
  movLista: { marginTop: 14, gap: 12 },
  movItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  movIcone: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  movInfo: { flex: 1 },
  movLinhaTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  movTipo: { fontSize: 13, fontFamily: 'Poppins-SemiBold' },
  movData: { fontSize: 11, fontFamily: 'Poppins-Regular', color: '#999999' },
  movMotivo: { fontSize: 12, fontFamily: 'Poppins-Regular', color: '#555555', marginTop: 2 },
  movSaldo: { fontSize: 11, fontFamily: 'Poppins-Regular', color: '#888888', marginTop: 2 },
  movDelta: { fontSize: 15, fontFamily: 'Poppins-SemiBold', minWidth: 56, textAlign: 'right' },
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
  // ── Seletor de tipo de controle ──
  tipoRow: { flexDirection: 'row', gap: 12 },
  tipoCard: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#255336',
    padding: 14,
    gap: 6,
    alignItems: 'flex-start',
  },
  tipoCardAtivo: { backgroundColor: '#255336' },
  tipoTitulo: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#255336' },
  tipoDesc: { fontSize: 11, fontFamily: 'Poppins-Regular', color: '#666666' },
  tipoTextoAtivo: { color: '#FFFFFF' },
  // ── Cartão de configuração de preço ──
  configCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 12,
    gap: 12,
  },
  infoCalc: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#255336',
  },
  avisoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
    padding: 12,
  },
  avisoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#92400E',
  },
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
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#92400E',
  },
  promoPrecoOriginal: {
    color: '#999999',
    textDecorationLine: 'line-through',
    fontFamily: 'Poppins-Regular',
  },
  promoPrecoNovo: {
    color: '#DC2626',
    fontFamily: 'Poppins-SemiBold',
  },
  promoBadgeEconomia: {
    marginTop: 4,
    fontSize: 12,
    color: '#92400E',
    fontFamily: 'Poppins-SemiBold',
  },
})
