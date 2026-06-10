import React, { useState } from 'react'
import {
  Alert,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export interface ParadaDestino {
  /** Latitude do destino (cliente). */
  latitude: number
  /** Longitude do destino. */
  longitude: number
  /** Endereço textual — usado como label e fallback. */
  endereco?: string
  /** Rótulo curto (ex: "Cliente João"). */
  rotulo?: string
}

interface AbrirNavegacaoProps {
  /** Mostra/esconde o modal. */
  visivel: boolean
  onFechar: () => void
  destino: ParadaDestino | null
  /** Origem opcional. Se omitida, o app usa "minha localização atual". */
  origem?: { latitude: number; longitude: number }
  /** Múltiplas paradas opcionais — usado pra navegação tipo waypoint (Google Maps). */
  paradasIntermediarias?: { latitude: number; longitude: number }[]
}

/**
 * Modal que abre o app de navegação escolhido pelo usuário (Google Maps ou Waze)
 * via Linking — zero chamadas a APIs pagas.
 *
 * Custo total: 0 (deep link nativo).
 *
 * Estratégia:
 * - Detecta se cada app está instalado via Linking.canOpenURL.
 * - Se nenhum estiver, abre o Google Maps no navegador.
 * - Para múltiplas paradas, prefere Google Maps (Waze não suporta waypoints).
 */
const AbrirNavegacao: React.FC<AbrirNavegacaoProps> = ({
  visivel,
  onFechar,
  destino,
  origem,
  paradasIntermediarias,
}) => {
  const [abrindo, setAbrindo] = useState(false)

  if (!destino) return null

  const temWaypoints =
    Array.isArray(paradasIntermediarias) && paradasIntermediarias.length > 0

  async function abrirComUrl(url: string, nomeApp: string) {
    try {
      setAbrindo(true)
      const podeAbrir = await Linking.canOpenURL(url)
      if (!podeAbrir) {
        Alert.alert(
          `${nomeApp} não disponível`,
          `Não foi possível abrir o ${nomeApp}. Verifique se o app está instalado.`,
        )
        return
      }
      await Linking.openURL(url)
      onFechar()
    } catch (e: any) {
      Alert.alert('Erro ao abrir navegação', e?.message ?? 'Falha desconhecida')
    } finally {
      setAbrindo(false)
    }
  }

  function abrirGoogleMaps() {
    if (!destino) return
    // URL universal do Google Maps Directions
    // https://developers.google.com/maps/documentation/urls/get-started
    const params = new URLSearchParams()
    params.set('api', '1')
    params.set('destination', `${destino.latitude},${destino.longitude}`)
    params.set('travelmode', 'driving')

    if (origem) {
      params.set('origin', `${origem.latitude},${origem.longitude}`)
    }
    if (temWaypoints) {
      const wp = paradasIntermediarias!
        .map((p) => `${p.latitude},${p.longitude}`)
        .join('|')
      params.set('waypoints', wp)
    }

    const url = `https://www.google.com/maps/dir/?${params.toString()}`
    abrirComUrl(url, 'Google Maps')
  }

  function abrirWaze() {
    if (!destino) return
    // Waze não suporta waypoints — se houver, avisa.
    if (temWaypoints) {
      Alert.alert(
        'Waze não suporta múltiplas paradas',
        'Use o Google Maps para navegação com waypoints, ou abra cada parada individualmente no Waze.',
      )
      return
    }
    // Deep link universal do Waze
    // https://developers.google.com/waze/deeplinks
    const url = `https://www.waze.com/ul?ll=${destino.latitude},${destino.longitude}&navigate=yes`
    abrirComUrl(url, 'Waze')
  }

  function copiarEndereco() {
    if (!destino?.endereco) {
      Alert.alert('Sem endereço', 'Esta parada não tem endereço textual.')
      return
    }
    // Pra evitar dependência de Clipboard, mostramos no Alert pra o usuário
    // copiar manualmente. Se quiser cópia automática, instalar @react-native-clipboard.
    Alert.alert('Endereço', destino.endereco)
  }

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="fade"
      onRequestClose={onFechar}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onFechar}
      >
        <TouchableOpacity
          style={styles.modal}
          activeOpacity={1}
          onPress={() => { /* evita fechar ao clicar dentro */ }}
        >
          <View style={styles.header}>
            <Text style={styles.titulo}>Como deseja navegar?</Text>
            {destino.rotulo ? (
              <Text style={styles.subtitulo}>{destino.rotulo}</Text>
            ) : null}
            {destino.endereco ? (
              <Text style={styles.endereco}>{destino.endereco}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.opcao, styles.opcaoGoogle, abrindo && styles.opcaoDesab]}
            onPress={abrirGoogleMaps}
            disabled={abrindo}
          >
            <View style={[styles.iconCirc, { backgroundColor: '#4285F4' }]}>
              <Ionicons name="map" size={20} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.opcaoTitulo}>Google Maps</Text>
              <Text style={styles.opcaoSub}>
                {temWaypoints
                  ? `Rota completa com ${paradasIntermediarias!.length + 1} paradas`
                  : 'Navegar até esta parada'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.opcao, abrindo && styles.opcaoDesab]}
            onPress={abrirWaze}
            disabled={abrindo}
          >
            <View style={[styles.iconCirc, { backgroundColor: '#33CCFF' }]}>
              <Ionicons name="car" size={20} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.opcaoTitulo}>Waze</Text>
              <Text style={styles.opcaoSub}>Navegar até esta parada</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.opcao} onPress={copiarEndereco}>
            <View style={[styles.iconCirc, { backgroundColor: '#999' }]}>
              <Ionicons name="copy" size={18} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.opcaoTitulo}>Ver endereço</Text>
              <Text style={styles.opcaoSub}>Para copiar manualmente</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelar} onPress={onFechar}>
            <Text style={styles.cancelarText}>Cancelar</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  header: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    marginBottom: 16,
  },
  titulo: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#255336',
  },
  subtitulo: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  endereco: {
    marginTop: 2,
    fontSize: 13,
    color: '#666',
  },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  opcaoGoogle: { backgroundColor: '#F5F9FF', paddingHorizontal: 12 },
  opcaoDesab: { opacity: 0.5 },
  iconCirc: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opcaoTitulo: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  opcaoSub: { fontSize: 12, color: '#666' },
  cancelar: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  cancelarText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#666',
  },
})

export default AbrirNavegacao
