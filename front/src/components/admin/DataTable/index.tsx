import React, { ReactNode } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native'
import styles from './styles'

interface ColunaDef<T> {
  key: keyof T
  titulo: string
  largura?: number
  render?: (item: T) => ReactNode
}

interface DataTableProps<T> {
  dados: T[]
  colunas: ColunaDef<T>[]
  onPress?: (item: T) => void
  emptyMessage?: string
  loading?: boolean
}

function DataTable<T extends { id?: any }>({
  dados,
  colunas,
  onPress,
  emptyMessage = 'Nenhum registro encontrado',
  loading = false,
}: DataTableProps<T>) {
  if (loading) {
    return <ActivityIndicator style={styles.loading} size="large" color="#255336" />
  }

  return (
    <FlatList
      data={dados}
      keyExtractor={(item, i) => String(item.id ?? i)}
      removeClippedSubviews
      ListHeaderComponent={
        <View style={styles.header}>
          {colunas.map((col) => (
            <Text
              key={String(col.key)}
              style={[styles.headerText, col.largura ? { width: col.largura } : { flex: 1 }]}
            >
              {col.titulo}
            </Text>
          ))}
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>{emptyMessage}</Text>}
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.row, pressed && onPress ? styles.rowPressed : null]}
          onPress={onPress ? () => onPress(item) : undefined}
        >
          {colunas.map((col) => (
            <View
              key={String(col.key)}
              style={col.largura ? { width: col.largura } : { flex: 1 }}
            >
              {col.render ? (
                col.render(item)
              ) : (
                <Text style={styles.cellText}>{String(item[col.key] ?? '')}</Text>
              )}
            </View>
          ))}
        </Pressable>
      )}
    />
  )
}

export default DataTable
