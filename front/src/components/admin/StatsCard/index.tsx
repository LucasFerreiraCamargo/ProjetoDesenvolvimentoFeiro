import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Text, View } from 'react-native'
import styles from './styles'

interface StatsCardProps {
  titulo: string
  valor: string | number
  icone: string
  corIcone?: string
  corFundo?: string
}

const StatsCard: React.FC<StatsCardProps> = ({
  titulo,
  valor,
  icone,
  corIcone = '#255336',
  corFundo = '#E8F5E8',
}) => {
  return (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: corFundo }]}>
        <Ionicons name={icone as any} size={24} color={corIcone} />
      </View>
      <Text style={styles.valor}>{valor}</Text>
      <Text style={styles.titulo}>{titulo}</Text>
    </View>
  )
}

export default StatsCard
