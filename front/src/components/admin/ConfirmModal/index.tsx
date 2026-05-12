import React from 'react'
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from 'react-native'
import styles from './styles'

interface ConfirmModalProps {
  visible: boolean
  titulo: string
  mensagem: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  confirmLabel?: string
  confirmVariant?: 'primary' | 'danger'
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  titulo,
  mensagem,
  onConfirm,
  onCancel,
  loading = false,
  confirmLabel = 'Confirmar',
  confirmVariant = 'primary',
}) => {
  const confirmBg = confirmVariant === 'danger' ? '#DC2626' : '#255336'

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.titulo}>{titulo}</Text>
          <Text style={styles.mensagem}>{mensagem}</Text>
          <View style={styles.botoes}>
            <TouchableOpacity style={styles.botaoCancelar} onPress={onCancel} disabled={loading}>
              <Text style={styles.textoCancelar}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.botaoConfirmar, { backgroundColor: confirmBg }]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.textoConfirmar}>{confirmLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default ConfirmModal
