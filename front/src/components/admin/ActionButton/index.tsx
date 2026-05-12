import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native'
import styles from './styles'

interface ActionButtonProps {
  label: string
  onPress: () => void
  loading?: boolean
  variant?: 'primary' | 'outline' | 'danger'
  disabled?: boolean
  icon?: string
}

const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  onPress,
  loading = false,
  variant = 'primary',
  disabled = false,
  icon,
}) => {
  const isDisabled = disabled || loading

  const buttonStyle = variant === 'outline'
    ? styles.outline
    : variant === 'danger'
    ? styles.danger
    : styles.primary

  const textStyle = variant === 'outline'
    ? styles.textOutline
    : variant === 'danger'
    ? styles.textDanger
    : styles.textPrimary

  const iconColor = variant === 'outline'
    ? '#255336'
    : variant === 'danger'
    ? '#FF5722'
    : '#FFFFFF'

  return (
    <TouchableOpacity
      style={[styles.base, buttonStyle, isDisabled && styles.disabled]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <>
          {icon ? <Ionicons name={icon as any} size={20} color={iconColor} /> : null}
          <Text style={textStyle}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  )
}

export default ActionButton
