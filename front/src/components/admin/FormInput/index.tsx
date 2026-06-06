import React from 'react'
import { KeyboardTypeOptions, Text, TextInput, TextInputProps, View } from 'react-native'
import styles from './styles'

interface FormInputProps {
  label: string
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  secureTextEntry?: boolean
  keyboardType?: KeyboardTypeOptions
  editable?: boolean
  error?: string
  multiline?: boolean
  numberOfLines?: number
  maxLength?: number
  /**
   * Controla a capitalizacao automatica do TextInput.
   * Default: "none" (mantem comportamento historico do componente).
   */
  autoCapitalize?: TextInputProps['autoCapitalize']
  /** Callback disparado ao perder foco - util para normalizar texto digitado. */
  onBlur?: TextInputProps['onBlur']
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  editable = true,
  error,
  multiline,
  numberOfLines,
  maxLength,
  autoCapitalize = 'none',
  onBlur,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : null,
          !editable ? styles.inputDisabled : null,
          multiline ? { minHeight: 80, textAlignVertical: 'top' } : null,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999999"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        editable={editable}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        onBlur={onBlur}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  )
}

export default FormInput
