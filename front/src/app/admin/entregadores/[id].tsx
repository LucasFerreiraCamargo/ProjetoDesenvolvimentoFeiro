import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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
import { entregadoresService } from '../../../services/entregadores'

export default function EntregadorDetalhe() {
  useAdminGuard(2)
  const { id } = useLocalSearchParams<{ id: string }>()
  const isNovo = id === 'novo'
  useAdminTitulo(isNovo ? 'Novo Entregador' : 'Editar Entregador')
  const { admin } = useAdmin()
  const router = useRouter()

  const [loading, setLoading] = useState(!isNovo)
  const [saving, setSaving] = useState(false)
  const [feirantes, setFeirantes] = useState<any[]>([])

  // Form
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [veiculo, setVeiculo] = useState<'' | 'moto' | 'carro' | 'bicicleta' | 'a_pe'>('')
  const [placa, setPlaca] = useState('')
  const [ativo, setAtivo] = useState(true)
  // Só superadmin (3) escolhe; feirante (2) deixa o backend forçar.
  const [feiranteId, setFeiranteId] = useState<number | null>(null)

  // Carrega feirantes só pra superadmin
  useEffect(() => {
    if (!admin?.token) return
    if (admin.nivel === 3) {
      adminFetch('/feirantes', undefined, admin.token)
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setFeirantes(Array.isArray(data) ? data : []))
        .catch(() => setFeirantes([]))
    }
  }, [admin?.token, admin?.nivel])

  // Carrega entregador existente
  useEffect(() => {
    if (isNovo || !admin?.token) return
    let cancelado = false
    ;(async () => {
      setLoading(true)
      try {
        const e = await entregadoresService.buscarPorId(admin.token, Number(id))
        if (cancelado) return
        setNome(e.nome ?? '')
        setEmail(e.email ?? '')
        setTelefone(e.telefone ?? '')
        setVeiculo((e.veiculo as any) ?? '')
        setPlaca(e.placa ?? '')
        setAtivo(e.ativo)
        setFeiranteId(e.feirante_id ?? null)
      } catch (err: any) {
        Alert.alert('Erro', err?.message ?? 'Não foi possível carregar entregador')
      } finally {
        if (!cancelado) setLoading(false)
      }
    })()
    return () => {
      cancelado = true
    }
  }, [id, isNovo, admin?.token])

  async function salvar() {
    if (!admin?.token) return

    // Validações
    if (!nome || nome.trim().length < 2) {
      Alert.alert('Atenção', 'Informe o nome (mínimo 2 caracteres).')
      return
    }
    const telefoneLimpo = telefone.replace(/\D/g, '')
    if (telefoneLimpo.length < 10 || telefoneLimpo.length > 11) {
      Alert.alert('Atenção', 'Telefone deve ter 10 ou 11 dígitos (com DDD).')
      return
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Atenção', 'E-mail inválido.')
      return
    }

    const payload: any = {
      nome: nome.trim(),
      telefone: telefoneLimpo,
      ativo,
    }
    if (email.trim()) payload.email = email.trim()
    if (veiculo) payload.veiculo = veiculo
    if (placa.trim()) payload.placa = placa.trim().toUpperCase()
    // Superadmin pode escolher feirante; feirante nível 2 deixa o backend resolver
    if (admin.nivel === 3 && feiranteId != null) {
      payload.feirante_id = feiranteId
    }

    setSaving(true)
    try {
      if (isNovo) {
        await entregadoresService.criar(admin.token, payload)
      } else {
        await entregadoresService.atualizar(admin.token, Number(id), payload)
      }
      router.back()
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e?.message ?? 'Falha desconhecida')
    } finally {
      setSaving(false)
    }
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
        <View style={styles.gap}>
          <FormInput label="Nome *" value={nome} onChangeText={setNome} placeholder="Ex: João Silva" autoCapitalize="words" />
          <FormInput
            label="Telefone *"
            value={telefone}
            onChangeText={setTelefone}
            placeholder="51998765432"
            keyboardType="phone-pad"
            maxLength={11}
          />
          <FormInput
            label="E-mail (opcional)"
            value={email}
            onChangeText={setEmail}
            placeholder="entregador@email.com"
            keyboardType="email-address"
          />

          {/* Veículo: chips */}
          <View>
            <Text style={styles.label}>Veículo</Text>
            <View style={styles.chipsRow}>
              {(
                [
                  { v: 'moto', label: 'Moto', icon: 'bicycle' },
                  { v: 'carro', label: 'Carro', icon: 'car' },
                  { v: 'bicicleta', label: 'Bicicleta', icon: 'bicycle-outline' },
                  { v: 'a_pe', label: 'A pé', icon: 'walk' },
                ] as { v: typeof veiculo; label: string; icon: any }[]
              ).map((opt) => {
                const sel = veiculo === opt.v
                return (
                  <TouchableOpacity
                    key={opt.v}
                    style={[styles.chip, sel && styles.chipAtivo]}
                    onPress={() => setVeiculo(sel ? '' : opt.v)}
                  >
                    <Ionicons name={opt.icon} size={16} color={sel ? '#FFF' : '#255336'} />
                    <Text style={[styles.chipText, sel && styles.chipTextAtivo]}>{opt.label}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
            <Text style={styles.help}>Toque novamente pra limpar.</Text>
          </View>

          <FormInput
            label="Placa (opcional)"
            value={placa}
            onChangeText={setPlaca}
            placeholder="ABC1D23"
            autoCapitalize="characters"
            maxLength={8}
          />

          {/* Picker de feirante — só superadmin (nível 3) */}
          {admin?.nivel === 3 && (
            <View>
              <Text style={styles.label}>Vincular a Feirante (opcional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.tabRow}>
                  <TouchableOpacity
                    style={[styles.tab, feiranteId == null && styles.tabAtivo]}
                    onPress={() => setFeiranteId(null)}
                  >
                    <Text
                      style={[styles.tabText, feiranteId == null && styles.tabTextoAtivo]}
                    >
                      Independente
                    </Text>
                  </TouchableOpacity>
                  {feirantes.map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      style={[styles.tab, feiranteId === f.id && styles.tabAtivo]}
                      onPress={() => setFeiranteId(f.id)}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          feiranteId === f.id && styles.tabTextoAtivo,
                        ]}
                      >
                        {f.nome}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <Text style={styles.help}>
                Independente = não pertence a um feirante específico.
              </Text>
            </View>
          )}

          {/* Aviso para feirante */}
          {admin?.nivel === 2 && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color="#92400E" />
              <Text style={styles.infoText}>
                Este entregador será vinculado ao seu feirante automaticamente.
              </Text>
            </View>
          )}

          {/* Ativo */}
          <View style={styles.linhaAtivo}>
            <View>
              <Text style={styles.label}>Entregador ativo</Text>
              <Text style={styles.help}>
                Quando inativo, não aparece pra ser atribuído a novas rotas.
              </Text>
            </View>
            <Switch
              value={ativo}
              onValueChange={setAtivo}
              trackColor={{ false: '#DDD', true: '#A7D8B5' }}
              thumbColor={ativo ? '#255336' : '#999'}
            />
          </View>

          <ActionButton
            label={isNovo ? 'Cadastrar' : 'Salvar Alterações'}
            onPress={salvar}
            loading={saving}
          />
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
  help: { fontSize: 12, color: '#666', fontStyle: 'italic', marginTop: 4 },

  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#255336',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  chipAtivo: { backgroundColor: '#255336' },
  chipText: { fontSize: 12, color: '#255336', fontWeight: '600' },
  chipTextAtivo: { color: '#FFFFFF' },

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

  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  infoText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 17 },

  linhaAtivo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FFF9',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8F5E8',
  },
})
