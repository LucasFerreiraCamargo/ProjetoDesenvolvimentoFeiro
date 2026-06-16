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

      {/* ── Dados da banca ── */}
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

          <View style={styles.raioDestaque}>
            <Text style={styles.raioValorGrande}>{raioKm} km</Text>
            <Text style={styles.raioSub}>raio de entrega</Text>
          </View>

          <Text style={styles.label}>Selecionar raio:</Text>
          <View style={styles.raioGrid}>
            {RAIOS_KM.map((km) => (
              <TouchableOpacity
                key={km}
                style={[styles.raioBtn, raioKm === km && styles.raioBtnAtivo]}
                onPress={() => setRaioKm(km)}
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
          </View>

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
