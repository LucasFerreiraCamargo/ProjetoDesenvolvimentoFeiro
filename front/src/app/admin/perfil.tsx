import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useAdmin, useAdminGuard, useAdminTitulo } from '../../contexts/AdminContext'
import { adminFetch } from '../../utils/adminApi'
import { horariosService, JanelaHorario } from '../../services/horarios'
import type { HorarioFeirante, TipoHorario } from '../../types/api'

const RAIOS_KM = [1, 2, 3, 5, 7, 10, 15, 20, 30, 40, 50]
// Limites do raio de atuação. Mantém o usuário em valores razoáveis (até
// 200 km cobre quase qualquer caso real de delivery regional).
const RAIO_MIN = 1
const RAIO_MAX = 200

// Smart step — incremento varia de acordo com a magnitude atual. Evita
// ter que apertar "+" 50 vezes para sair de 50 → 100 km, mas dá precisão
// fina em valores pequenos (típicos de feirante urbano).
//   1-4 km   → ±1 km   (sintonia fina)
//   5-19 km  → ±5 km   (presets comuns)
//   20-49 km → ±10 km  (regional)
//   50-99 km → ±25 km  (longo alcance)
//   100+ km  → ±50 km  (atacado/distribuição)
function stepIncrementarRaio(km: number): number {
  if (km < 5) return 1
  if (km < 20) return 5
  if (km < 50) return 10
  if (km < 100) return 25
  return 50
}
function stepDecrementarRaio(km: number): number {
  if (km <= 5) return 1
  if (km <= 20) return 5
  if (km <= 50) return 10
  if (km <= 100) return 25
  return 50
}
const DIAS_SEMANA = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
]

// ─────────────────────────────────────────────────────────────────────────────
// Componente Accordion: header clicável + conteúdo expansível
// ─────────────────────────────────────────────────────────────────────────────

function Accordion({
  titulo,
  icone,
  resumo,
  aberto,
  onToggle,
  children,
}: {
  titulo: string
  icone: any
  resumo?: string
  aberto: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <View style={styles.acCard}>
      <TouchableOpacity
        style={styles.acHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Ionicons name={icone} size={20} color="#255336" />
        <View style={{ flex: 1 }}>
          <Text style={styles.acTitulo}>{titulo}</Text>
          {resumo ? <Text style={styles.acResumo}>{resumo}</Text> : null}
        </View>
        <Ionicons
          name={aberto ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#666"
        />
      </TouchableOpacity>
      {aberto ? <View style={styles.acConteudo}>{children}</View> : null}
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Editor de horários (reutilizado por funcionamento e entrega)
// Cada dia da semana: switch + 2 campos HH:MM. Botão salvar no fim.
// ─────────────────────────────────────────────────────────────────────────────

interface JanelaUI {
  ativo: boolean
  hora_inicio: string
  hora_fim: string
}

function diasIniciaisVazios(): JanelaUI[] {
  return Array.from({ length: 7 }, () => ({
    ativo: false,
    hora_inicio: '08:00',
    hora_fim: '18:00',
  }))
}

/** Aplica máscara HH:MM enquanto o usuário digita. */
function mascararHora(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 4)
  if (d.length <= 2) return d
  return `${d.slice(0, 2)}:${d.slice(2)}`
}

function EditorHorarios({
  feiranteId,
  token,
  tipo,
  iniciais,
  onSalvouComSucesso,
}: {
  feiranteId: number
  token: string
  tipo: TipoHorario
  iniciais: HorarioFeirante[]
  onSalvouComSucesso: (lista: HorarioFeirante[]) => void
}) {
  const [dias, setDias] = useState<JanelaUI[]>(diasIniciaisVazios())
  const [salvando, setSalvando] = useState(false)

  // Carrega valores iniciais — agrupando por dia. Se o backend tem mais de uma
  // janela no mesmo dia, pegamos a primeira (UI simplificada: 1 janela por dia).
  useEffect(() => {
    const base = diasIniciaisVazios()
    for (const h of iniciais) {
      if (h.dia_semana >= 0 && h.dia_semana <= 6) {
        base[h.dia_semana] = {
          ativo: true,
          hora_inicio: h.hora_inicio,
          hora_fim: h.hora_fim,
        }
      }
    }
    setDias(base)
  }, [iniciais])

  function atualizarDia(idx: number, patch: Partial<JanelaUI>) {
    setDias((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)),
    )
  }

  async function salvar() {
    // Valida formato HH:MM e ordem das horas
    const erros: string[] = []
    const janelas: JanelaHorario[] = []
    dias.forEach((d, idx) => {
      if (!d.ativo) return
      const re = /^([01]?\d|2[0-3]):[0-5]\d$/
      if (!re.test(d.hora_inicio) || !re.test(d.hora_fim)) {
        erros.push(`${DIAS_SEMANA[idx]}: hora em formato inválido (use HH:MM)`)
        return
      }
      if (d.hora_inicio >= d.hora_fim) {
        erros.push(`${DIAS_SEMANA[idx]}: início deve ser antes do fim`)
        return
      }
      janelas.push({
        dia_semana: idx,
        hora_inicio: d.hora_inicio,
        hora_fim: d.hora_fim,
      })
    })

    if (erros.length > 0) {
      Alert.alert('Verifique os horários', erros.join('\n'))
      return
    }

    setSalvando(true)
    try {
      const lista = await horariosService.salvarBulk(
        token,
        feiranteId,
        tipo,
        janelas,
      )
      onSalvouComSucesso(lista)
      Alert.alert('Sucesso', 'Horários salvos com sucesso!')
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Falha ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <View>
      {dias.map((d, idx) => (
        <View key={idx} style={styles.diaLinha}>
          <View style={styles.diaCabecalho}>
            <Switch
              value={d.ativo}
              onValueChange={(v) => atualizarDia(idx, { ativo: v })}
              trackColor={{ false: '#DDD', true: '#A7D8B5' }}
              thumbColor={d.ativo ? '#255336' : '#999'}
            />
            <Text style={[styles.diaNome, !d.ativo && styles.diaInativo]}>
              {DIAS_SEMANA[idx]}
            </Text>
          </View>
          {d.ativo ? (
            <View style={styles.horariosLinha}>
              <View style={styles.horarioBox}>
                <Text style={styles.horarioLabel}>Início</Text>
                <TextInput
                  style={styles.horarioInput}
                  value={d.hora_inicio}
                  onChangeText={(v) =>
                    atualizarDia(idx, { hora_inicio: mascararHora(v) })
                  }
                  keyboardType="numeric"
                  maxLength={5}
                  placeholder="08:00"
                />
              </View>
              <Text style={{ color: '#999', alignSelf: 'flex-end', paddingBottom: 8 }}>
                até
              </Text>
              <View style={styles.horarioBox}>
                <Text style={styles.horarioLabel}>Fim</Text>
                <TextInput
                  style={styles.horarioInput}
                  value={d.hora_fim}
                  onChangeText={(v) =>
                    atualizarDia(idx, { hora_fim: mascararHora(v) })
                  }
                  keyboardType="numeric"
                  maxLength={5}
                  placeholder="18:00"
                />
              </View>
            </View>
          ) : (
            <Text style={styles.diaFechado}>Fechado neste dia</Text>
          )}
        </View>
      ))}
      <TouchableOpacity
        style={[styles.salvarBtn, salvando && styles.salvarBtnDisabled]}
        onPress={salvar}
        disabled={salvando}
        activeOpacity={0.8}
      >
        {salvando ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={styles.salvarBtnText}>Salvar Horários</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tela principal
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminPerfil() {
  useAdminGuard(2)
  useAdminTitulo('Meu Perfil')
  const { admin, logout } = useAdmin()
  const router = useRouter()

  const [feirante, setFeirante] = useState<any>(null)
  const [loading, setLoading] = useState(admin?.nivel === 2)
  const [salvandoRaio, setSalvandoRaio] = useState(false)
  const [raioKm, setRaioKm] = useState(10)
  const [entregaAtiva, setEntregaAtiva] = useState(true)
  // Input para digitar um raio personalizado (km), permitindo valores fora
  // dos presets rápidos — inclusive decimais (ex: 3.5 km).
  const [mostrarInputCustom, setMostrarInputCustom] = useState(false)
  const [inputCustomRaio, setInputCustomRaio] = useState('')

  // Edição inline dos dados da banca (nome, banca, especialidade, telefone)
  const [editandoBanca, setEditandoBanca] = useState(false)
  const [salvandoBanca, setSalvandoBanca] = useState(false)
  const [bancaForm, setBancaForm] = useState({
    nome: '',
    banca: '',
    especialidade: '',
    telefone: '',
  })

  // Accordions
  const [abertoRaio, setAbertoRaio] = useState(false)
  const [abertoFunc, setAbertoFunc] = useState(false)
  const [abertoEntrega, setAbertoEntrega] = useState(false)

  // Horários carregados do backend
  const [horariosFunc, setHorariosFunc] = useState<HorarioFeirante[]>([])
  const [horariosEntrega, setHorariosEntrega] = useState<HorarioFeirante[]>([])

  const nivelLabel = (n?: number) => {
    if (n === 1) return 'Cliente'
    if (n === 2) return 'Feirante'
    return 'Superadmin'
  }

  const fetchFeirante = useCallback(async () => {
    if (!admin?.feiranteId || !admin?.token) return
    try {
      const res = await adminFetch(
        `/feirantes/${admin.feiranteId}`,
        undefined,
        admin.token,
      )
      if (res.ok) {
        const data = await res.json()
        setFeirante(data)
        if (data.raio_entrega_km) setRaioKm(Number(data.raio_entrega_km))
        if (data.entrega_ativa !== undefined) setEntregaAtiva(!!data.entrega_ativa)
        // Sincroniza o form de edição da banca com os dados da API.
        // O fetch só corre no mount/refresh, então não conflita com edição
        // ativa do usuário.
        setBancaForm({
          nome: data.nome ?? '',
          banca: data.banca ?? '',
          especialidade: data.especialidade ?? '',
          telefone: data.telefone ?? '',
        })
      }
    } catch {
      /* silencioso */
    }
  }, [admin?.feiranteId, admin?.token])

  const fetchHorarios = useCallback(async () => {
    if (!admin?.feiranteId) return
    try {
      const [func, entr] = await Promise.all([
        horariosService.listarPorFeirante(admin.feiranteId, 'FUNCIONAMENTO'),
        horariosService.listarPorFeirante(admin.feiranteId, 'ENTREGA'),
      ])
      setHorariosFunc(func)
      setHorariosEntrega(entr)
    } catch {
      /* silencioso */
    }
  }, [admin?.feiranteId])

  useEffect(() => {
    ;(async () => {
      if (admin?.nivel === 2 && admin.feiranteId) {
        await Promise.all([fetchFeirante(), fetchHorarios()])
      }
      setLoading(false)
    })()
  }, [admin?.nivel, admin?.feiranteId, fetchFeirante, fetchHorarios])

  async function salvarRaio() {
    if (!admin?.feiranteId) return
    setSalvandoRaio(true)
    try {
      const res = await adminFetch(
        `/feirantes/${admin.feiranteId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            raio_entrega_km: raioKm,
            entrega_ativa: entregaAtiva,
          }),
        },
        admin.token,
      )
      if (res.ok) {
        Alert.alert('Sucesso', 'Configurações salvas com sucesso!')
      } else {
        Alert.alert('Erro', 'Não foi possível salvar.')
      }
    } catch {
      Alert.alert('Erro', 'Falha na conexão com o servidor.')
    }
    setSalvandoRaio(false)
  }

  /**
   * Valida e aplica o raio digitado manualmente no input "Outro".
   * Aceita decimais (vírgula ou ponto), exige número positivo e respeita o
   * teto de RAIO_MAX km. Arredonda para 1 casa para evitar ruído de ponto
   * flutuante (3.50000001 → 3.5).
   */
  function aplicarRaioCustom() {
    const normalizado = inputCustomRaio.replace(',', '.').trim()
    const valor = Number(normalizado)

    if (!normalizado || Number.isNaN(valor)) {
      Alert.alert('Valor inválido', 'Digite um número em km (ex: 3.5).')
      return
    }
    if (valor <= 0) {
      Alert.alert('Valor inválido', 'O raio deve ser um número positivo.')
      return
    }
    if (valor > RAIO_MAX) {
      Alert.alert('Valor muito alto', `O raio máximo permitido é ${RAIO_MAX} km.`)
      return
    }

    setRaioKm(Math.round(valor * 10) / 10)
    setMostrarInputCustom(false)
    setInputCustomRaio('')
  }

  /**
   * Aplica máscara visual de telefone: "(11) 98765-4321" (11 dígitos)
   * ou "(11) 8765-4321" (10 dígitos). Mantém só dígitos por baixo.
   */
  function mascararTelefone(raw: string): string {
    const d = raw.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 2) return d.length ? `(${d}` : ''
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  }

  /** Valida e dispara PATCH /feirantes/:id com os campos da banca. */
  async function salvarBanca() {
    if (!admin?.feiranteId || !admin?.token) return

    const nome = bancaForm.nome.trim()
    const banca = bancaForm.banca.trim()
    const especialidade = bancaForm.especialidade.trim()
    const telefoneDigitos = bancaForm.telefone.replace(/\D/g, '')

    if (nome.length < 2) {
      Alert.alert('Validação', 'O nome deve ter pelo menos 2 caracteres.')
      return
    }
    if (telefoneDigitos.length < 10 || telefoneDigitos.length > 11) {
      Alert.alert(
        'Validação',
        'Telefone deve conter 10 ou 11 dígitos (com DDD).',
      )
      return
    }
    if (banca.length > 0 && banca.length < 2) {
      Alert.alert('Validação', 'O nome da banca está muito curto.')
      return
    }

    setSalvandoBanca(true)
    try {
      const res = await adminFetch(
        `/feirantes/${admin.feiranteId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            nome,
            banca: banca || null,
            especialidade: especialidade || null,
            telefone: telefoneDigitos,
          }),
        },
        admin.token,
      )
      if (res.ok) {
        const atualizado = await res.json()
        setFeirante((prev: any) => ({ ...(prev ?? {}), ...(atualizado ?? {}) }))
        setEditandoBanca(false)
        Alert.alert('Sucesso', 'Dados da banca atualizados!')
      } else {
        const body = await res.json().catch(() => ({}))
        Alert.alert(
          'Não foi possível salvar',
          body?.erro
            ? typeof body.erro === 'string'
              ? body.erro
              : 'Verifique os dados informados.'
            : `Erro ${res.status}`,
        )
      }
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Falha de conexão.')
    } finally {
      setSalvandoBanca(false)
    }
  }

  /** Cancela a edição e restaura os valores atuais vindos da API. */
  function cancelarEdicaoBanca() {
    if (feirante) {
      setBancaForm({
        nome: feirante.nome ?? '',
        banca: feirante.banca ?? '',
        especialidade: feirante.especialidade ?? '',
        telefone: feirante.telefone ?? '',
      })
    }
    setEditandoBanca(false)
  }

  function sair() {
    logout()
    router.replace('/login')
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#255336" />
      </View>
    )
  }

  // ───── Resumos exibidos colapsados ─────
  const resumoRaio = `${raioKm} km · ${entregaAtiva ? 'entregando' : 'retirada na feira'}`
  const diasFuncStr = horariosFunc.length
    ? `${horariosFunc.length} dia${horariosFunc.length === 1 ? '' : 's'} configurado${horariosFunc.length === 1 ? '' : 's'}`
    : 'Não configurado'
  const diasEntregaStr = horariosEntrega.length
    ? `${horariosEntrega.length} dia${horariosEntrega.length === 1 ? '' : 's'} configurado${horariosEntrega.length === 1 ? '' : 's'}`
    : 'Não configurado'

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

      {/* ── Dados da banca (editável) ── */}
      {admin?.nivel === 2 && feirante && (
        <View style={styles.card}>
          <View style={bancaStyles.headerRow}>
            <Text style={styles.secaoTitulo}>
              <Ionicons name="storefront-outline" size={16} color="#255336" />{' '}
              Dados da Banca
            </Text>
            {!editandoBanca && (
              <TouchableOpacity
                onPress={() => setEditandoBanca(true)}
                style={bancaStyles.editarBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="pencil-outline" size={14} color="#255336" />
                <Text style={bancaStyles.editarBtnTxt}>Editar</Text>
              </TouchableOpacity>
            )}
          </View>

          {editandoBanca ? (
            <>
              <Text style={bancaStyles.label}>Nome *</Text>
              <TextInput
                style={bancaStyles.input}
                value={bancaForm.nome}
                onChangeText={(t) =>
                  setBancaForm((f) => ({ ...f, nome: t }))
                }
                placeholder="Seu nome"
                editable={!salvandoBanca}
                maxLength={60}
              />

              <Text style={bancaStyles.label}>Nome da Banca</Text>
              <TextInput
                style={bancaStyles.input}
                value={bancaForm.banca}
                onChangeText={(t) =>
                  setBancaForm((f) => ({ ...f, banca: t }))
                }
                placeholder='Ex: "Banca do Seu Zé"'
                editable={!salvandoBanca}
                maxLength={100}
              />

              <Text style={bancaStyles.label}>Especialidade</Text>
              <TextInput
                style={bancaStyles.input}
                value={bancaForm.especialidade}
                onChangeText={(t) =>
                  setBancaForm((f) => ({ ...f, especialidade: t }))
                }
                placeholder="Ex: Hortifruti orgânico"
                editable={!salvandoBanca}
                maxLength={100}
              />

              <Text style={bancaStyles.label}>Telefone *</Text>
              <TextInput
                style={bancaStyles.input}
                value={bancaForm.telefone}
                onChangeText={(t) =>
                  setBancaForm((f) => ({ ...f, telefone: mascararTelefone(t) }))
                }
                placeholder="(11) 98765-4321"
                keyboardType="phone-pad"
                editable={!salvandoBanca}
                maxLength={16}
              />

              <View style={bancaStyles.botoesRow}>
                <TouchableOpacity
                  style={[
                    bancaStyles.btnCancelar,
                    salvandoBanca && { opacity: 0.5 },
                  ]}
                  onPress={cancelarEdicaoBanca}
                  disabled={salvandoBanca}
                >
                  <Text style={bancaStyles.btnCancelarTxt}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    bancaStyles.btnSalvar,
                    salvandoBanca && { opacity: 0.7 },
                  ]}
                  onPress={salvarBanca}
                  disabled={salvandoBanca}
                >
                  {salvandoBanca ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={bancaStyles.btnSalvarTxt}>Salvar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.linhaInfo}>
                <Text style={styles.infoLabel}>Nome:</Text>
                <Text style={styles.infoValor}>{feirante.nome ?? '—'}</Text>
              </View>
              <View style={styles.linhaInfo}>
                <Text style={styles.infoLabel}>Banca:</Text>
                <Text style={styles.infoValor}>{feirante.banca ?? '—'}</Text>
              </View>
              <View style={styles.linhaInfo}>
                <Text style={styles.infoLabel}>Especialidade:</Text>
                <Text style={styles.infoValor}>
                  {feirante.especialidade ?? '—'}
                </Text>
              </View>
              <View style={styles.linhaInfo}>
                <Text style={styles.infoLabel}>Telefone:</Text>
                <Text style={styles.infoValor}>
                  {feirante.telefone
                    ? mascararTelefone(feirante.telefone)
                    : '—'}
                </Text>
              </View>
              <View style={styles.linhaInfo}>
                <Text style={styles.infoLabel}>Feira:</Text>
                <Text style={styles.infoValor}>
                  {feirante.feira?.nome ?? '—'}
                </Text>
              </View>
              {feirante.avaliacao ? (
                <View style={styles.linhaInfo}>
                  <Text style={styles.infoLabel}>Avaliação:</Text>
                  <Text style={styles.infoValor}>
                    ⭐ {Number(feirante.avaliacao).toFixed(1)}
                  </Text>
                </View>
              ) : null}
            </>
          )}
        </View>
      )}

      {/* ── Accordion: Raio de Atuação ── */}
      {admin?.nivel === 2 && (
        <Accordion
          titulo="Raio de Atuação"
          icone="locate-outline"
          resumo={resumoRaio}
          aberto={abertoRaio}
          onToggle={() => setAbertoRaio((v) => !v)}
        >
          <Text style={styles.raioDescricao}>
            Defina a distância máxima que você atende entregas. Clientes fora desta área não verão sua banca para delivery.
          </Text>

          {/* Destaque do valor + stepper (− / +). O smart step ajusta o
              incremento conforme a magnitude — fino em valores pequenos,
              grosso em valores grandes. Sem cap externo: feirante pode
              chegar até RAIO_MAX km. */}
          <View style={styles.raioDestaque}>
            <View style={styles.raioStepperRow}>
              <TouchableOpacity
                style={[
                  styles.raioStepperBtn,
                  raioKm <= RAIO_MIN && styles.raioStepperBtnDisabled,
                ]}
                onPress={() =>
                  setRaioKm((cur) =>
                    Math.max(RAIO_MIN, cur - stepDecrementarRaio(cur))
                  )
                }
                disabled={raioKm <= RAIO_MIN}
                accessibilityLabel="Diminuir raio"
                accessibilityRole="button"
                activeOpacity={0.7}
              >
                <Ionicons
                  name="remove"
                  size={26}
                  color={raioKm <= RAIO_MIN ? '#BBBBBB' : '#255336'}
                />
              </TouchableOpacity>

              <View style={styles.raioStepperValor}>
                <Text style={styles.raioValorGrande}>{raioKm} km</Text>
                <Text style={styles.raioSub}>raio de entrega</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.raioStepperBtn,
                  raioKm >= RAIO_MAX && styles.raioStepperBtnDisabled,
                ]}
                onPress={() =>
                  setRaioKm((cur) =>
                    Math.min(RAIO_MAX, cur + stepIncrementarRaio(cur))
                  )
                }
                disabled={raioKm >= RAIO_MAX}
                accessibilityLabel="Aumentar raio"
                accessibilityRole="button"
                activeOpacity={0.7}
              >
                <Ionicons
                  name="add"
                  size={26}
                  color={raioKm >= RAIO_MAX ? '#BBBBBB' : '#255336'}
                />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.label}>Valores rápidos:</Text>
          <View style={styles.raioGrid}>
            {RAIOS_KM.map((km) => (
              <TouchableOpacity
                key={km}
                style={[styles.raioBtn, raioKm === km && styles.raioBtnAtivo]}
                onPress={() => {
                  setRaioKm(km)
                  setMostrarInputCustom(false)
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.raioBtnText,
                    raioKm === km && styles.raioBtnTextoAtivo,
                  ]}
                >
                  {km} km
                </Text>
              </TouchableOpacity>
            ))}

            {/* Botão "+" — abre input inline para um raio personalizado,
                permitindo valores fora dos presets (inclusive decimais). */}
            <TouchableOpacity
              style={[
                styles.raioBtnCustom,
                mostrarInputCustom && styles.raioBtnCustomAtivo,
              ]}
              onPress={() => {
                setMostrarInputCustom((v) => !v)
                // Pré-preenche com o valor atual para facilitar o ajuste.
                setInputCustomRaio(String(raioKm))
              }}
              accessibilityLabel="Digitar outro valor de raio"
              accessibilityRole="button"
              activeOpacity={0.8}
            >
              <Ionicons
                name="add"
                size={16}
                color={mostrarInputCustom ? '#FFFFFF' : '#255336'}
              />
              <Text
                style={[
                  styles.raioBtnText,
                  mostrarInputCustom && styles.raioBtnTextoAtivo,
                ]}
              >
                Outro
              </Text>
            </TouchableOpacity>
          </View>

          {/* Input inline para o raio personalizado */}
          {mostrarInputCustom && (
            <View style={styles.raioCustomRow}>
              <TextInput
                style={styles.raioCustomInput}
                value={inputCustomRaio}
                onChangeText={setInputCustomRaio}
                keyboardType="decimal-pad"
                placeholder="Ex: 3.5"
                placeholderTextColor="#999999"
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={aplicarRaioCustom}
                autoFocus
              />
              <Text style={styles.raioCustomUnidade}>km</Text>
              <TouchableOpacity
                style={styles.raioCustomConfirmar}
                onPress={aplicarRaioCustom}
                accessibilityLabel="Aplicar raio digitado"
                accessibilityRole="button"
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.entregaToggle,
              entregaAtiva && styles.entregaToggleAtivo,
            ]}
            onPress={() => setEntregaAtiva((v) => !v)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={entregaAtiva ? 'bicycle' : 'bicycle-outline'}
              size={20}
              color={entregaAtiva ? '#255336' : '#999'}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.entregaToggleText,
                  entregaAtiva && { color: '#255336' },
                ]}
              >
                {entregaAtiva ? 'Entrega ativa' : 'Entrega desativada'}
              </Text>
              <Text style={styles.entregaToggleSub}>
                {entregaAtiva
                  ? 'Você faz entregas no raio definido'
                  : 'Somente retirada na feira'}
              </Text>
            </View>
            <View
              style={[styles.togglePill, entregaAtiva && styles.togglePillAtivo]}
            >
              <View
                style={[styles.toggleThumb, entregaAtiva && styles.toggleThumbAtivo]}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.salvarBtn, salvandoRaio && styles.salvarBtnDisabled]}
            onPress={salvarRaio}
            disabled={salvandoRaio}
            activeOpacity={0.8}
          >
            {salvandoRaio ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.salvarBtnText}>Salvar configurações</Text>
            )}
          </TouchableOpacity>
        </Accordion>
      )}

      {/* ── Accordion: Horário de Funcionamento ── */}
      {admin?.nivel === 2 && admin.feiranteId && (
        <Accordion
          titulo="Horário de Funcionamento"
          icone="time-outline"
          resumo={diasFuncStr}
          aberto={abertoFunc}
          onToggle={() => setAbertoFunc((v) => !v)}
        >
          <Text style={styles.raioDescricao}>
            Dias e horários em que você aceita pedidos pelo app.
          </Text>
          <EditorHorarios
            feiranteId={admin.feiranteId}
            token={admin.token}
            tipo="FUNCIONAMENTO"
            iniciais={horariosFunc}
            onSalvouComSucesso={setHorariosFunc}
          />
        </Accordion>
      )}

      {/* ── Accordion: Horário de Entrega ── */}
      {admin?.nivel === 2 && admin.feiranteId && (
        <Accordion
          titulo="Horário de Entrega"
          icone="bicycle-outline"
          resumo={diasEntregaStr}
          aberto={abertoEntrega}
          onToggle={() => setAbertoEntrega((v) => !v)}
        >
          <Text style={styles.raioDescricao}>
            Dias e horários em que você realiza entregas. Cestas recorrentes só poderão ser criadas em dias que você entrega.
          </Text>
          <EditorHorarios
            feiranteId={admin.feiranteId}
            token={admin.token}
            tipo="ENTREGA"
            iniciais={horariosEntrega}
            onSalvouComSucesso={setHorariosEntrega}
          />
        </Accordion>
      )}

      {/* ── Botão sair ── */}
      <TouchableOpacity style={styles.sairButton} onPress={sair} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={24} color="#FF5722" />
        <Text style={styles.sairTexto}>Sair da conta</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7E4' },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
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

  // Card genérico (dados da banca)
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
  label: { fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#333333', marginTop: 8 },

  // Accordion
  acCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 1,
    overflow: 'hidden',
  },
  acHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  acTitulo: { fontSize: 16, fontFamily: 'Poppins-SemiBold', color: '#333333' },
  acResumo: { fontSize: 12, fontFamily: 'Poppins-Regular', color: '#666' },
  acConteudo: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 4,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },

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
    paddingHorizontal: 12,
  },
  raioStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  raioStepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#255336',
    // Sombra leve para destacar do fundo verde do destaque
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  raioStepperBtnDisabled: {
    borderColor: '#DDDDDD',
    backgroundColor: '#F5F5F5',
    shadowOpacity: 0,
    elevation: 0,
  },
  raioStepperValor: {
    alignItems: 'center',
    flex: 1,
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
  raioBtnCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#255336',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  raioBtnCustomAtivo: {
    backgroundColor: '#255336',
    borderStyle: 'solid',
  },
  raioCustomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  raioCustomInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#255336',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#255336',
    backgroundColor: '#FFFFFF',
  },
  raioCustomUnidade: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    color: '#4A7C59',
  },
  raioCustomConfirmar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#255336',
    alignItems: 'center',
    justifyContent: 'center',
  },

  entregaToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: 8,
  },
  entregaToggleAtivo: { borderColor: '#A7D8B5', backgroundColor: '#F8FDF9' },
  entregaToggleText: { fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#999' },
  entregaToggleSub: { fontSize: 12, fontFamily: 'Poppins-Regular', color: '#666' },
  togglePill: {
    width: 38,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DDD',
    padding: 2,
    justifyContent: 'center',
  },
  togglePillAtivo: { backgroundColor: '#255336' },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFF',
  },
  toggleThumbAtivo: { alignSelf: 'flex-end' },

  salvarBtn: {
    backgroundColor: '#255336',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  salvarBtnDisabled: { backgroundColor: '#A0A0A0' },
  salvarBtnText: { color: '#FFF', fontSize: 14, fontFamily: 'Poppins-SemiBold' },

  // Editor de Horários
  diaLinha: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  diaCabecalho: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  diaNome: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    flex: 1,
  },
  diaInativo: { color: '#999' },
  diaFechado: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#999',
    marginTop: 6,
    marginLeft: 60,
  },
  horariosLinha: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 10,
    marginLeft: 60,
  },
  horarioBox: { flex: 1 },
  horarioLabel: { fontSize: 11, color: '#666', marginBottom: 4 },
  horarioInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FAFAFA',
    textAlign: 'center',
  },

  // Botão sair
  sairButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FFE0E0',
    gap: 8,
  },
  sairTexto: { fontSize: 16, fontFamily: 'Poppins-SemiBold', color: '#FF5722' },
})

// Estilos específicos do card "Dados da Banca" — separados pra não poluir
// o StyleSheet principal e deixar claro qual variante (visualização x edição)
// está sendo afetada.
const bancaStyles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#255336',
    backgroundColor: '#E8F9F1',
  },
  editarBtnTxt: {
    fontSize: 12,
    color: '#255336',
    fontFamily: 'Poppins-SemiBold',
  },
  label: {
    fontSize: 12,
    color: '#7A8A7C',
    marginTop: 10,
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FFF',
  },
  botoesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  btnCancelar: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CFD8CF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  btnCancelarTxt: {
    color: '#7A8A7C',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  btnSalvar: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#255336',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSalvarTxt: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
})
