import React from 'react'
import { Text, View } from 'react-native'
import styles from './styles'

type StatusPedido =
  | 'PENDENTE'
  | 'EM_PREPARACAO'
  | 'EM_ANDAMENTO'
  | 'EM_ROTA'
  | 'ENTREGUE'
  | 'RETORNANDO'
  | 'CANCELADO'
type StatusLoja = 'Aberto' | 'Fechado'

interface StatusBadgeProps {
  status: StatusPedido | StatusLoja | string
}

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  PENDENTE:      { bg: '#FEF3C7', text: '#92400E', label: 'Pendente' },
  EM_PREPARACAO: { bg: '#DBEAFE', text: '#1E40AF', label: 'Em Preparação' },
  EM_ANDAMENTO:  { bg: '#EDE9FE', text: '#5B21B6', label: 'Em Andamento' },
  EM_ROTA:       { bg: '#F3E8FF', text: '#7E22CE', label: 'Em Rota' },
  ENTREGUE:      { bg: '#D1FAE5', text: '#065F46', label: 'Entregue' },
  RETORNANDO:    { bg: '#FFEDD5', text: '#C2410C', label: 'Retornando' },
  CANCELADO:     { bg: '#FEE2E2', text: '#DC2626', label: 'Cancelado' },
  Aberto:        { bg: '#d1fae5', text: '#047857', label: 'Aberto' },
  Fechado:       { bg: '#fee2e2', text: '#dc2626', label: 'Fechado' },
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = STATUS_MAP[status] ?? { bg: '#F3F4F6', text: '#333333', label: status }

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  )
}

export { STATUS_MAP }
export default StatusBadge
