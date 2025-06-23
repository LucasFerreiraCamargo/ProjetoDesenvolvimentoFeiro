import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feirante, useApp } from "../../contexts/AppContext";

const FeirantesScreen = () => {
  const { id } = useLocalSearchParams();
  const feiraId = Array.isArray(id) ? id[0] : id;
  const { getFeira } = useApp();

  const feira = getFeira(feiraId);
  const feirantes = feira?.feirantes || [];

  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  const categories = ["Todos", "Frutas", "Verduras", "Legumes"];

  const filteredFeirantes = feirantes.filter((feirante) => {
    const matchesSearch = feirante.nome
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesCategory =
      selectedCategory === "Todos" ||
      feirante.especialidade
        .toLowerCase()
        .includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const renderCategory = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item && styles.categoryButtonActive,
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item && styles.categoryTextActive,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderFeirante = ({ item }: { item: Feirante }) => (
    <View style={styles.feiranteCard}>
      <View style={styles.feiranteHeader}>
        <View style={styles.feiranteImageContainer}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.feiranteImage} />
          ) : (
            <View style={styles.feiranteImagePlaceholder}>
              <Text style={styles.feiranteEmoji}>{item.foto}</Text>
            </View>
          )}
        </View>

        <View style={styles.feiranteInfo}>
          <View style={styles.feiranteNameRow}>
            <Text style={styles.feiranteNome}>
              {item.nome} - {item.banca}
            </Text>
            <View
              style={[
                styles.statusBadge,
                item.status === "Aberto"
                  ? styles.statusAberto
                  : styles.statusFechado,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  item.status === "Aberto"
                    ? styles.statusTextAberto
                    : styles.statusTextFechado,
                ]}
              >
                {item.status}
              </Text>
            </View>
          </View>

          <Text style={styles.feiranteEspecialidade}>{item.especialidade}</Text>

          <View style={styles.avaliacaoContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.avaliacaoTexto}>
              {item.avaliacao} ({item.totalAvaliacoes} avaliações)
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.verProdutosButton,
            item.status === "Fechado" && styles.buttonDisabled,
          ]}
          onPress={() => router.push(`/produtos/${item.id}`)}
          disabled={item.status === "Fechado"}
        >
          <Text
            style={[
              styles.verProdutosText,
              item.status === "Fechado" && styles.buttonTextDisabled,
            ]}
          >
            Ver Produtos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.whatsappButton}>
          <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => router.push("/mapa")}
          >
            <Ionicons name="map" size={16} color="#666" />
            <Text style={styles.mapButtonText}>Mapa</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.feiraTitle}>{feira?.nome || "Feira"}</Text>
          <Text style={styles.feiraEndereco}>{feira?.endereco}</Text>
          <Text style={styles.feiraHorario}>
            Aberto hoje • {feira?.horario}
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Procure por feirante ou produto..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* Category Filters */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Feirantes List */}
      <View style={styles.content}>
        {filteredFeirantes.length > 0 ? (
          <FlatList
            data={filteredFeirantes}
            renderItem={renderFeirante}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.feirantesList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum feirante encontrado.</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7E4",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  mapButtonText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
    fontWeight: "500",
  },
  headerInfo: {
    alignItems: "flex-start",
  },
  feiraTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  feiraEndereco: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  feiraHorario: {
    fontSize: 14,
    color: "#666",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoriesList: {
    gap: 12,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  categoryButtonActive: {
    backgroundColor: "#255336",
    borderColor: "#255336",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  categoryTextActive: {
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  feirantesList: {
    paddingBottom: 100,
  },
  feiranteCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feiranteHeader: {
    flexDirection: "row",
    marginBottom: 16,
  },
  feiranteImageContainer: {
    marginRight: 12,
  },
  feiranteImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  feiranteImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  feiranteEmoji: {
    fontSize: 24,
  },
  feiranteInfo: {
    flex: 1,
  },
  feiranteNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  feiranteNome: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusAberto: {
    backgroundColor: "#E8F5E8",
  },
  statusFechado: {
    backgroundColor: "#FEE8E8",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  statusTextAberto: {
    color: "#2D7D32",
  },
  statusTextFechado: {
    color: "#D32F2F",
  },
  feiranteEspecialidade: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  avaliacaoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avaliacaoTexto: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  buttonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  verProdutosButton: {
    backgroundColor: "#255336",
  },
  buttonDisabled: {
    backgroundColor: "#E0E0E0",
  },
  verProdutosText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  buttonTextDisabled: {
    color: "#999",
  },
  whatsappButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0F8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});

export default FeirantesScreen;
