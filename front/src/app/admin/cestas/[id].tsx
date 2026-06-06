import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Image,
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
import type { CategoriaCesta } from '../../../types/api'

type TipoDesconto = 'nenhum' | 'percentual' | 'valor'

// Imagem padrão exibida no preview quando a cesta não tem foto.
// IMPORTANTE: salve um PNG quadrado em assets/images/cesta-padrao.png pra que apareça.
const IMAGEM_PADRAO_CESTA = require('../../../../assets/images/cesta-padrao.png')

/** Categorias do enum CategoriaCesta com labels apresentáveis. */
const CATEGORIAS_CESTA: { value: CategoriaCesta; label: string }[] = [
  { value: 'SEMANAL', label: 'Semanal' },
  { value: 'QUINZENAL', label: 'Quinzenal' },
  { value: 'MENSAL', label: 'Mensal' },
  { value: 'FIT', label: 'Fit' },
  { value: 'ORGANICA', label: 'Orgânica' },
  { value: 'CAFE_DA_MANHA', label: 'Café da manhã' },
  { value: 'SOPAO', label: 'Sopão' },
  { value: 'FESTA', label: 'Festa' },
  { value: 'OUTRA', label: 'Outra' },
]

// ────────── Helpers de desconto ──────────

/** Formata R$ no padrão brasileiro (R$ 12,34). */
function formatBRL(n: number): string {
  if (!Number.isFinite(n)) return 'R$ 0,00'
  return `R$ ${n.toFixed(2).replace('.', ',')}`
}

/** Aplica o desconto sobre a soma e devolve o preço final (nunca negativo). */
function calcularPrecoFinal(soma: number, tipo: TipoDesconto, valor: number): number {
  if (soma <= 0) return 0
  if (tipo === 'percentual' && valor > 0) {
    return Math.max(0, soma - (soma * valor) / 100)
  }
  if (tipo === 'valor' && valor > 0) {
    return Math.max(0, soma - valor)
  }
  return soma
}

/**
 * Converte o estado interno (tipo + valor + soma) em um NÚMERO em R$ — que é o
 * formato salvo no banco (coluna Decimal). Quando o tipo é percentual, calcula
 * o abatimento sobre a soma das mercadorias.
 *
 * Retorna undefined se não há desconto válido (a API recebe o campo omitido).
 */
function serializarDescontoEmValor(
  tipo: TipoDesconto,
  valor: string,
  somaItens: number
): number | undefined {
  const num = Number(String(valor).replace(',', '.'))
  if (!Number.isFinite(num) || num <= 0 || tipo === 'nenhum') return undefined
  if (tipo === 'percentual') {
    if (somaItens <= 0) return undefined // sem itens não dá pra calcular o %
    return Number(((somaItens * num) / 100).toFixed(2))
  }
  return Number(num.toFixed(2))
}

/**
 * Lê o desconto vindo da API (idealmente number, mas tolerante a string legada
 * tipo "10% OFF" ou "R$ 5,00 OFF") e devolve tipo + valor pra UI.
 *
 * Após a migração do banco para Decimal, o caminho feliz é receber um número
 * direto (ou string numérica do Prisma) — vira sempre `tipo: 'valor'`.
 */
function parsearDescontoApi(raw: unknown): {
  tipo: TipoDesconto
  valor: string
} {
  if (raw == null || raw === '') return { tipo: 'nenhum', valor: '' }

  // Caminho novo: number ou string numérica ("10.50") vinda do Decimal
  const num = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'))
  if (Number.isFinite(num)) {
    return num > 0
      ? { tipo: 'valor', valor: num.toFixed(2) }
      : { tipo: 'nenhum', valor: '' }
  }

  // Compatibilidade com dados legados em string
  if (typeof raw === 'string') {
    const pct = raw.match(/(\d+(?:[.,]\d+)?)\s*%/)
    if (pct) return { tipo: 'percentual', valor: pct[1].replace(',', '.') }
    const rs = raw.match(/R\$\s*(\d+(?:[.,]\d+)?)/i)
    if (rs) return { tipo: 'valor', valor: rs[1].replace(',', '.') }
  }
  return { tipo: 'nenhum', valor: '' }
}

// ────────── Componente ──────────

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
  // Desconto é par estruturado para UX (% ou R$). Persistido SEMPRE como
  // R$ no banco — a conversão de % para R$ acontece no momento do salvar.
  const [tipoDesconto, setTipoDesconto] = useState<TipoDesconto>('nenhum')
  const [valorDescontoInput, setValorDescontoInput] = useState('')
  const [categoria, setCategoria] = useState<CategoriaCesta | ''>('')
  const [imagemUrl, setImagemUrl] = useState('')
  const [feiranteId, setFeiranteId] = useState<number | null>(null)
  const [mercSelecionadas, setMercSelecionadas] = useState<number[]>([])

  // Soma dos preços das mercadorias selecionadas (preço "de cadastro" / valor de mercado)
  const somaItens = useMemo(() => {
    return mercadoriasDispo
      .filter((m: any) => mercSelecionadas.includes(m.id))
      .reduce((acc: number, m: any) => acc + Number(m.preco ?? 0), 0)
  }, [mercadoriasDispo, mercSelecionadas])

  // Preço numérico digitado (pode estar vazio)
  const precoNum = useMemo(() => {
    const n = Number(String(preco).replace(',', '.'))
    return Number.isFinite(n) ? n : 0
  }, [preco])

  // Diferença entre a soma e o preço final (positivo = desconto efetivo, negativo = ágio)
  const diferenca = somaItens - precoNum
  const precoAcimaDeMercado = precoNum > 0 && precoNum > somaItens && somaItens > 0

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

  // ────────── Foto da cesta ──────────

  /** Converte o asset do image-picker num data URI base64 (string padrão do front). */
  function resultadoParaDataUri(asset: ImagePicker.ImagePickerAsset): string | null {
    if (!asset?.base64) return null
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
      if (dataUri) setImagemUrl(dataUri)
      else alert('Não foi possível ler a imagem.')
    } catch (e: any) {
      console.error('[Cesta.tirarFoto] Exceção:', e)
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
      if (dataUri) setImagemUrl(dataUri)
      else alert('Não foi possível ler a imagem.')
    } catch (e: any) {
      console.error('[Cesta.escolherDaGaleria] Exceção:', e)
      alert(`Erro ao abrir galeria: ${e?.message ?? e}`)
    }
  }

  function removerFoto() {
    setImagemUrl('')
  }

  async function fetchCesta() {
    setLoading(true)
    try {
      const res = await adminFetch(`/cestas/${id}`, undefined, admin!.token)
      const data = await res.json()
      setNome(data.nome ?? '')
      setPreco(String(data.preco ?? ''))
      const parsed = parsearDescontoApi(data.desconto)
      setTipoDesconto(parsed.tipo)
      setValorDescontoInput(parsed.valor)
      // Categoria só é aceita se bater com algum valor do enum (defensa contra dados legados).
      const catRaw = data.categoria
      const catValida = CATEGORIAS_CESTA.find((c) => c.value === catRaw)
      setCategoria(catValida ? catValida.value : '')
      setImagemUrl(data.imagem ?? '')
      setFeiranteId(data.feirante_id ?? null)
      const ids = (data.mercadorias ?? []).map((m: any) => m.id)
      setMercSelecionadas(ids)
      await fetchMercadorias(data.feirante_id)
    } catch { alert('Erro ao carregar cesta') }
    setLoading(false)
  }

  // ────────── Sincronização desconto ↔ preço ──────────

  /** Quando o usuário marca/desmarca uma mercadoria, recalcula preço mantendo o desconto. */
  function toggleMercadoria(mercId: number) {
    const novas = mercSelecionadas.includes(mercId)
      ? mercSelecionadas.filter((x) => x !== mercId)
      : [...mercSelecionadas, mercId]
    setMercSelecionadas(novas)

    const novaSoma = mercadoriasDispo
      .filter((m: any) => novas.includes(m.id))
      .reduce((acc: number, m: any) => acc + Number(m.preco ?? 0), 0)

    const valorDesc = Number(String(valorDescontoInput).replace(',', '.')) || 0
    const novoPreco = calcularPrecoFinal(novaSoma, tipoDesconto, valorDesc)
    setPreco(novoPreco > 0 ? novoPreco.toFixed(2) : '')
  }

  /** Usuário alterou o valor do desconto. Recalcula o preço final. */
  function handleDescontoValor(novoValor: string) {
    setValorDescontoInput(novoValor)
    const num = Number(String(novoValor).replace(',', '.')) || 0
    // Se digitou um número e ainda está em "nenhum", assume "valor" como default
    const tipoEfetivo: TipoDesconto = tipoDesconto === 'nenhum' && num > 0 ? 'valor' : tipoDesconto
    if (tipoEfetivo !== tipoDesconto) setTipoDesconto(tipoEfetivo)
    if (somaItens > 0) {
      setPreco(calcularPrecoFinal(somaItens, tipoEfetivo, num).toFixed(2))
    }
  }

  /** Usuário alternou entre "%", "R$" ou "Sem desconto". Recalcula preço. */
  function handleTipoDesconto(novo: TipoDesconto) {
    setTipoDesconto(novo)
    if (novo === 'nenhum') {
      setValorDescontoInput('')
      if (somaItens > 0) setPreco(somaItens.toFixed(2))
      return
    }
    const valor = Number(String(valorDescontoInput).replace(',', '.')) || 0
    if (somaItens > 0) {
      setPreco(calcularPrecoFinal(somaItens, novo, valor).toFixed(2))
    }
  }

  /**
   * Usuário editou o PREÇO manualmente. Vamos calcular o desconto implícito,
   * mantendo o tipo (% ou R$) atualmente selecionado.
   */
  function handlePrecoManual(novo: string) {
    setPreco(novo)
    const num = Number(String(novo).replace(',', '.'))
    if (!Number.isFinite(num) || somaItens <= 0) return

    if (num >= somaItens) {
      // Sem desconto (ou ágio, se for >)
      if (tipoDesconto !== 'nenhum') setTipoDesconto('nenhum')
      if (valorDescontoInput) setValorDescontoInput('')
      return
    }
    // Há desconto efetivo. Mantém o tipo selecionado.
    const diff = somaItens - num
    if (tipoDesconto === 'percentual') {
      const pct = (diff / somaItens) * 100
      setValorDescontoInput(pct.toFixed(0))
    } else {
      // 'valor' OU 'nenhum' → vai pra 'valor' automaticamente
      if (tipoDesconto === 'nenhum') setTipoDesconto('valor')
      setValorDescontoInput(diff.toFixed(2))
    }
  }

  // ────────── Salvar ──────────

  async function salvar() {
    if (!nome || nome.length < 3) {
      alert('O nome da cesta deve ter pelo menos 3 caracteres')
      return
    }
    const precoNumLocal = Number(String(preco).replace(',', '.'))
    if (Number.isNaN(precoNumLocal) || precoNumLocal <= 0) {
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
    // Imagem pode ser URL http(s) OU data URI (foto da câmera/galeria em base64).
    if (imagemUrl && !/^https?:\/\//i.test(imagemUrl) && !/^data:image\//i.test(imagemUrl)) {
      alert('A imagem precisa ser uma URL http(s) ou uma foto da câmera/galeria.')
      return
    }

    setSaving(true)

    const payload: any = {
      nome,
      preco: precoNumLocal,
      feirante_id: Number(feiranteId),
      mercadorias: mercSelecionadas,
    }
    const descontoNum = serializarDescontoEmValor(tipoDesconto, valorDescontoInput, somaItens)
    if (descontoNum != null && descontoNum > 0) payload.desconto = descontoNum
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
        console.warn('[Cesta.salvar] API respondeu erro:', { status: res.status, body: data })
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

  function formataErroApi(data: any): string {
    if (!data) return ''
    const raw = data.erro ?? data.error ?? data.message ?? data
    if (!raw) return ''
    if (typeof raw === 'string') return raw

    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const linhas: string[] = []
      for (const campo of Object.keys(raw)) {
        const v = raw[campo]
        if (Array.isArray(v) && v.length) linhas.push(`${campo}: ${v.join(', ')}`)
        else if (typeof v === 'string') linhas.push(`${campo}: ${v}`)
      }
      if (linhas.length) return linhas.join('\n')
    }
    if (Array.isArray(raw?.issues)) {
      return raw.issues
        .map((i: any) => `${(i.path ?? []).join('.') || 'campo'}: ${i.message}`)
        .join('\n')
    }
    if (typeof raw?.message === 'string') return raw.message
    try { return JSON.stringify(raw, null, 2) } catch { return String(raw) }
  }

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#255336" /></View>
  }

  // Texto auxiliar embaixo do input do desconto
  const descontoHelp = (() => {
    if (somaItens <= 0) return 'Selecione mercadorias para calcular o desconto.'
    const valor = Number(String(valorDescontoInput).replace(',', '.')) || 0
    if (tipoDesconto === 'nenhum' || valor <= 0) return 'Sem desconto aplicado.'
    if (tipoDesconto === 'percentual') {
      const abatimento = (somaItens * valor) / 100
      return `${valor}% de ${formatBRL(somaItens)} = abatimento de ${formatBRL(abatimento)}`
    }
    return `Abatimento fixo de ${formatBRL(valor)} sobre ${formatBRL(somaItens)}`
  })()

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.gap}>
          <FormInput label="Nome da Cesta" value={nome} onChangeText={setNome} />

          {/* ───── Mercadorias ───── */}
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
                    <Text style={styles.mercPreco}>{formatBRL(Number(m.preco))}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}

          {/* ───── Bloco de Preço & Desconto ───── */}
          <View style={styles.precoBloco}>
            <Text style={styles.label}>Desconto</Text>

            {/* Toggle de tipo do desconto */}
            <View style={styles.toggleRow}>
              {(['nenhum', 'percentual', 'valor'] as TipoDesconto[]).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.toggleBtn, tipoDesconto === opt && styles.toggleBtnAtivo]}
                  onPress={() => handleTipoDesconto(opt)}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      tipoDesconto === opt && styles.toggleTextAtivo,
                    ]}
                  >
                    {opt === 'nenhum' ? 'Sem desconto' : opt === 'percentual' ? '% percentual' : 'R$ valor'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {tipoDesconto !== 'nenhum' && (
              <View style={{ marginTop: 12 }}>
                <FormInput
                  label={tipoDesconto === 'percentual' ? 'Valor do desconto (%)' : 'Valor do desconto (R$)'}
                  value={valorDescontoInput}
                  onChangeText={handleDescontoValor}
                  placeholder={tipoDesconto === 'percentual' ? 'ex: 10' : 'ex: 5,00'}
                  keyboardType="numeric"
                />
              </View>
            )}

            <Text style={styles.helpText}>{descontoHelp}</Text>

            {/* Preço final (editável) */}
            <View style={{ marginTop: 16 }}>
              <FormInput
                label="Preço final da cesta (R$)"
                value={preco}
                onChangeText={handlePrecoManual}
                keyboardType="numeric"
                placeholder="ex: 89,90"
              />
            </View>

            {/* ───── Resumo visual ───── */}
            <View style={styles.resumoCard}>
              <View style={styles.resumoLinha}>
                <Text style={styles.resumoLabel}>Soma dos itens</Text>
                <Text style={styles.resumoValor}>{formatBRL(somaItens)}</Text>
              </View>
              {diferenca > 0 && precoNum > 0 && (
                <View style={styles.resumoLinha}>
                  <Text style={styles.resumoLabel}>Desconto aplicado</Text>
                  <Text style={[styles.resumoValor, styles.resumoDesconto]}>
                    − {formatBRL(diferenca)}
                  </Text>
                </View>
              )}
              <View style={[styles.resumoLinha, styles.resumoTotal]}>
                <Text style={styles.resumoTotalLabel}>Preço final</Text>
                <Text style={styles.resumoTotalValor}>
                  {precoNum > 0 ? formatBRL(precoNum) : '—'}
                </Text>
              </View>
            </View>

            {precoAcimaDeMercado && (
              <View style={styles.warningBox}>
                <Text style={styles.warningTitle}>⚠ Preço acima do valor de mercado</Text>
                <Text style={styles.warningBody}>
                  O preço final ({formatBRL(precoNum)}) está acima da soma dos itens (
                  {formatBRL(somaItens)}). Verifique se isso é mesmo intencional.
                </Text>
              </View>
            )}
          </View>

          {/* ───── Categoria (chips do enum CategoriaCesta) ───── */}
          <View>
            <Text style={styles.label}>Categoria</Text>
            <View style={styles.categoriaGrid}>
              {CATEGORIAS_CESTA.map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.catChip, categoria === c.value && styles.catChipAtivo]}
                  onPress={() => setCategoria(categoria === c.value ? '' : c.value)}
                >
                  <Text style={[styles.catChipText, categoria === c.value && styles.catChipTextAtivo]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.helpText}>Selecione uma categoria ou toque novamente para limpar.</Text>
          </View>

          {/* ───── Foto da cesta ───── */}
          <View>
            <Text style={styles.label}>Foto da Cesta</Text>

            {/* Preview: foto enviada > imagem padrão local */}
            <View style={styles.fotoPreviewWrapper}>
              <Image
                source={imagemUrl ? { uri: imagemUrl } : IMAGEM_PADRAO_CESTA}
                style={styles.fotoPreview}
                resizeMode="cover"
                onError={() => console.warn('[Cesta] Nao foi possivel renderizar a foto')}
              />
              {imagemUrl ? (
                <TouchableOpacity
                  style={styles.fotoRemoveBtn}
                  onPress={removerFoto}
                  accessibilityLabel="Remover foto"
                >
                  <Ionicons name="close-circle" size={28} color="#EF4444" />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.fotoBotoesRow}>
              <TouchableOpacity
                style={styles.fotoBotao}
                onPress={tirarFoto}
                accessibilityLabel="Tirar foto da cesta"
              >
                <Ionicons name="camera-outline" size={22} color="#255336" />
                <Text style={styles.fotoBotaoText}>Camera</Text>
              </TouchableOpacity>
              <View style={{ width: 12 }} />
              <TouchableOpacity
                style={styles.fotoBotao}
                onPress={escolherDaGaleria}
                accessibilityLabel="Escolher foto da galeria"
              >
                <Ionicons name="images-outline" size={22} color="#255336" />
                <Text style={styles.fotoBotaoText}>Galeria</Text>
              </TouchableOpacity>
            </View>

            <FormInput
              label="...ou cole uma URL de imagem"
              value={imagemUrl?.startsWith('data:') ? '' : imagemUrl}
              onChangeText={setImagemUrl}
              placeholder="https://..."
              autoCapitalize="none"
            />
          </View>

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

  // Bloco preco/desconto
  precoBloco: {
    backgroundColor: '#F9FFF9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8F5E8',
  },
  toggleRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  toggleBtn: {
    borderWidth: 1,
    borderColor: '#255336',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  toggleBtnAtivo: { backgroundColor: '#255336' },
  toggleText: { fontSize: 12, color: '#255336', fontWeight: '600' },
  toggleTextAtivo: { color: '#FFFFFF' },
  helpText: { marginTop: 10, fontSize: 12, color: '#666666', fontStyle: 'italic' },

  // Card resumo
  resumoCard: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  resumoLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  resumoLabel: { fontSize: 13, color: '#666666' },
  resumoValor: { fontSize: 14, color: '#333333', fontWeight: '500' },
  resumoDesconto: { color: '#E74C3C' },
  resumoTotal: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  resumoTotalLabel: { fontSize: 14, color: '#255336', fontWeight: '700' },
  resumoTotalValor: { fontSize: 18, color: '#255336', fontWeight: '700' },

  // Aviso
  warningBox: {
    marginTop: 14,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  warningTitle: { fontSize: 13, fontWeight: '700', color: '#92400E', marginBottom: 4 },
  warningBody: { fontSize: 12, color: '#92400E', lineHeight: 17 },
  warningSub: { marginTop: 6, fontSize: 11, color: '#92400E', fontStyle: 'italic' },

  // Categoria chips
  categoriaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    borderWidth: 1,
    borderColor: '#255336',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  catChipAtivo: { backgroundColor: '#255336' },
  catChipText: { fontSize: 12, color: '#255336', fontWeight: '600' },
  catChipTextAtivo: { color: '#FFFFFF' },

  // Foto
  fotoPreviewWrapper: {
    position: 'relative',
    alignSelf: 'center',
    width: 180,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F0F8F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  fotoPreview: { width: '100%', height: '100%' },
  fotoRemoveBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  fotoBotoesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  fotoBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#255336',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  fotoBotaoText: { fontSize: 13, color: '#255336', fontWeight: '600' },
})
