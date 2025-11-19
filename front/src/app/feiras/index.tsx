import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useApp } from "../../contexts/AppContext";

const filtrosDisponiveis = [
  "Todos",
  "Aberto",
  "Fechado",
  "Próximo",
  "Orgânico",
];

export default function FeirasScreen() {
  const [busca, setBusca] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState("Todos");
  const { state } = useApp();

  // Filtrar feiras baseado na busca e filtros
  const feirasFiltered = state.feiras.filter((feira) => {
    const matchBusca =
      feira.nome.toLowerCase().includes(busca.toLowerCase()) ||
      feira.endereco.toLowerCase().includes(busca.toLowerCase());

    const matchFiltro =
      filtroAtivo === "Todos" ||
      (filtroAtivo === "Aberto" && feira.status === "Aberto") ||
      (filtroAtivo === "Fechado" && feira.status === "Fechado") ||
      filtroAtivo === "Próximo" || // Lógica de proximidade pode ser implementada
      filtroAtivo === "Orgânico"; // Lógica para feiras orgânicas pode ser implementada

    return matchBusca && matchFiltro;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Feiras</Text>
        <TouchableOpacity>
          <Ionicons name="filter-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Busca */}
        <View style={styles.buscaContainer}>
          <View style={styles.buscaInputContainer}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.buscaInput}
              placeholder="Procure por feira ou localização..."
              placeholderTextColor="#999"
              value={busca}
              onChangeText={setBusca}
            />
          </View>
        </View>

        {/* Filtros */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtrosScroll}
          contentContainerStyle={styles.filtrosContainer}
        >
          {filtrosDisponiveis.map((filtro) => (
            <TouchableOpacity
              key={filtro}
              style={[
                styles.filtroButton,
                filtroAtivo === filtro && styles.filtroButtonAtivo,
              ]}
              onPress={() => setFiltroAtivo(filtro)}
            >
              <Text
                style={[
                  styles.filtroText,
                  filtroAtivo === filtro && styles.filtroTextAtivo,
                ]}
              >
                {filtro}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Lista de Feiras */}
        <View style={styles.feirasContainer}>
          {feirasFiltered.map((feira) => (
            <TouchableOpacity
              key={feira.id}
              style={styles.feiraCard}
              onPress={() => {
                router.push(`/feirantes/${feira.id}`);
              }}
            >
              <View style={styles.feiraHeader}>
                <Text style={styles.feiraNome}>{feira.nome}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        feira.status === "Aberto" ? "#10B981" : "#FF6B6B",
                    },
                  ]}
                >
                  <Text style={styles.statusText}>{feira.status}</Text>
                </View>
              </View>

              <Text style={styles.feiraEndereco}>{feira.endereco}</Text>

              <View style={styles.feiraDetalhes}>
                <View style={styles.feiraDetalheItem}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.feiraDetalheText}>{feira.horario}</Text>
                </View>
                <View style={styles.feiraDetalheItem}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.feiraDetalheText}>{feira.distancia}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.verMapaButton}
                onPress={(e) => {
                  e.stopPropagation();
                  router.push("/mapa");
                }}
              >
                <Ionicons name="location" size={16} color="#2D5D31" />
                <Text style={styles.verMapaButtonText}>Ver no mapa</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.navSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7E4",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "#FFF7E4",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  buscaContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  buscaInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  buscaInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  filtrosScroll: {
    marginBottom: 20,
  },
  filtrosContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filtroButton: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  filtroButtonAtivo: {
    backgroundColor: "#2D5D31",
    borderColor: "#2D5D31",
  },
  filtroText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  filtroTextAtivo: {
    color: "#FFF",
    fontWeight: "600",
  },
  feirasContainer: {
    paddingHorizontal: 20,
  },
  feiraCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  feiraHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  feiraNome: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  feiraEndereco: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  feiraDetalhes: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 16,
  },
  feiraDetalheItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  feiraDetalheText: {
    fontSize: 14,
    color: "#666",
  },
  verMapaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F8F0",
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#2D5D31",
  },
  verMapaButtonText: {
    color: "#2D5D31",
    fontSize: 14,
    fontWeight: "600",
  },
  navSpacer: {
    height: 20,
  },
});
