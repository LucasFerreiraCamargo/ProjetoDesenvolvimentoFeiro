import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Top from "../../components/Top";
import Nav from "../../components/Nav";

type Feirante = {
  id: string;
  nome: string;
  banca: string;
  avaliacao: number;
  totalAvaliacoes: number;
  foto: string;
  especialidade: string;
};

const feirantesPorFeira: { [key: string]: Feirante[] } = {
  "1": [
    {
      id: "1",
      nome: "João da Silva",
      banca: "Banca 23",
      avaliacao: 4.8,
      totalAvaliacoes: 234,
      foto: "👨‍🌾",
      especialidade: "Frutas e Verduras",
    },
    {
      id: "2",
      nome: "Maria Santos",
      banca: "Banca 15",
      avaliacao: 4.6,
      totalAvaliacoes: 189,
      foto: "👩‍🌾",
      especialidade: "Legumes Orgânicos",
    },
    {
      id: "3",
      nome: "Pedro Oliveira",
      banca: "Banca 8",
      avaliacao: 4.9,
      totalAvaliacoes: 156,
      foto: "👨‍🌾",
      especialidade: "Peixes e Frutos do Mar",
    },
  ],
  "2": [
    {
      id: "4",
      nome: "Ana Costa",
      banca: "Banca 12",
      avaliacao: 4.7,
      totalAvaliacoes: 98,
      foto: "👩‍🌾",
      especialidade: "Flores e Plantas",
    },
  ],
};

const FeirantesScreen = () => {
  const { id } = useLocalSearchParams();
  const feiraId = Array.isArray(id) ? id[0] : id;
  const feirantes = feirantesPorFeira[feiraId] || [];

  const renderFeirante = ({ item }: { item: Feirante }) => (
    <TouchableOpacity
      style={styles.feiranteCard}
      onPress={() => router.push(`/produtos/${item.id}` as any)}
    >
      <View style={styles.feiranteHeader}>
        <Text style={styles.feiranteFoto}>{item.foto}</Text>
        <View style={styles.feiranteInfo}>
          <Text style={styles.feiranteNome}>{item.nome}</Text>
          <Text style={styles.feiranteBanca}>
            {item.banca} • {item.especialidade}
          </Text>
          <View style={styles.avaliacaoContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.avaliacaoTexto}>
              {item.avaliacao} ({item.totalAvaliacoes} avaliações)
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.whatsappButton}>
        <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
        <Text style={styles.whatsappText}>Falar com feirante</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const nomesFeiras: { [key: string]: string } = {
    "1": "Feira Central",
    "2": "Feira do Lobão",
    "3": "Feira Vila Mariana",
    "4": "Feira Pinheiros",
  };

  return (
    <View style={styles.container}>
      <Top />
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>{nomesFeiras[feiraId] || "Feira"}</Text>
          <TouchableOpacity onPress={() => router.push("/mapa")}>
            <Ionicons name="share-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {feirantes.length > 0 ? (
          <FlatList
            data={feirantes}
            renderItem={renderFeirante}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.feirantesList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Nenhum feirante encontrado para esta feira.
            </Text>
          </View>
        )}
      </View>
      <Nav />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7E4",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
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
    marginBottom: 12,
  },
  feiranteFoto: {
    fontSize: 48,
    marginRight: 16,
  },
  feiranteInfo: {
    flex: 1,
  },
  feiranteNome: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    marginBottom: 4,
  },
  feiranteBanca: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginBottom: 8,
  },
  avaliacaoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avaliacaoTexto: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginLeft: 4,
  },
  whatsappButton: {
    backgroundColor: "#25D366",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  whatsappText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#666",
    textAlign: "center",
  },
});

export default FeirantesScreen;
