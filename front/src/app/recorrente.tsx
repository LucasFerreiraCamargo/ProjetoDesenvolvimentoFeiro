import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Nav from "../components/Nav";
import Top from "../components/Top";

type CestaRecorrente = {
  id: string;
  nome: string;
  feirante: string;
  frequencia: string;
  entrega: string;
  itens: number;
  preco: number;
  status: "Ativa" | "Pausada";
};

const RecorrenteScreen = () => {
  const [cestas, setCestas] = useState<CestaRecorrente[]>([
    {
      id: "1",
      nome: "Kit Sopão",
      feirante: "João da Silva - Banca 23 - Feira do Lobão",
      frequencia: "Toda Segunda-feira",
      entrega: "Entrega • R$ 5,00",
      itens: 8,
      preco: 25.9,
      status: "Ativa",
    },
    {
      id: "2",
      nome: "Cesta Fit",
      feirante: "Feira do Produtor",
      frequencia: "A cada 15 dias (Quinta)",
      entrega: "Retirada no local",
      itens: 12,
      preco: 120.0,
      status: "Ativa",
    },
  ]);

  const cancelarCesta = (id: string) => {
    Alert.alert(
      "Cancelar cesta recorrente",
      "Tem certeza que deseja cancelar esta cesta recorrente?",
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim",
          style: "destructive",
          onPress: () => {
            setCestas(cestas.filter((cesta) => cesta.id !== id));
          },
        },
      ]
    );
  };

  const editarCesta = (id: string) => {
    Alert.alert("Editar cesta", "Funcionalidade em desenvolvimento!");
  };

  const adicionarNovaCesta = () => {
    router.push("/");
  };

  const renderCesta = ({ item }: { item: CestaRecorrente }) => (
    <View style={styles.cestaContainer}>
      <View style={styles.cestaHeader}>
        <Text style={styles.cestaNome}>{item.nome}</Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: item.status === "Ativa" ? "#E8F5E8" : "#FFF3E0",
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: item.status === "Ativa" ? "#4CAF50" : "#FF9800",
              },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <Text style={styles.feiranteNome}>{item.feirante}</Text>

      <View style={styles.infoRow}>
        <Ionicons name="time-outline" size={16} color="#666" />
        <Text style={styles.infoText}>{item.frequencia}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="car-outline" size={16} color="#666" />
        <Text style={styles.infoText}>{item.entrega}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="basket-outline" size={16} color="#666" />
        <Text style={styles.infoText}>
          {item.itens} itens • R$ {item.preco.toFixed(2).replace(".", ",")}
        </Text>
      </View>

      <View style={styles.botoesContainer}>
        <TouchableOpacity
          style={styles.botaoSecundario}
          onPress={() => editarCesta(item.id)}
        >
          <Text style={styles.botaoSecundarioText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.botaoCancelar}
          onPress={() => cancelarCesta(item.id)}
        >
          <Text style={styles.botaoCancelarText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Top />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Cestas Recorrentes</Text>
        <TouchableOpacity onPress={adicionarNovaCesta}>
          <Ionicons name="add" size={24} color="#4A7C59" />
        </TouchableOpacity>
      </View>

      {cestas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="repeat-outline" size={80} color="#CCC" />
          <Text style={styles.emptyText}>Nenhuma cesta recorrente</Text>
          <Text style={styles.emptySubtext}>
            Configure cestas automáticas para receber seus produtos favoritos
            regularmente
          </Text>
          <TouchableOpacity
            style={styles.adicionarButton}
            onPress={adicionarNovaCesta}
          >
            <Text style={styles.adicionarButtonText}>
              Criar Cesta Recorrente
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cestas}
          renderItem={renderCesta}
          keyExtractor={(item) => item.id}
          style={styles.lista}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listaContent}
        />
      )}

      <Nav />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7E4",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
  },
  lista: {
    flex: 1,
  },
  listaContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  cestaContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cestaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cestaNome: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    flex: 1,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Poppins-SemiBold",
  },
  feiranteNome: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginLeft: 8,
  },
  botoesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },
  botaoSecundario: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#4A7C59",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  botaoSecundarioText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#4A7C59",
  },
  botaoCancelar: {
    flex: 1,
    backgroundColor: "#FFF3F3",
    borderWidth: 1,
    borderColor: "#FF5722",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  botaoCancelarText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#FF5722",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  adicionarButton: {
    backgroundColor: "#4A7C59",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  adicionarButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
});

export default RecorrenteScreen;
