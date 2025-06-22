import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Nav from "../../components/Nav";
import Top from "../../components/Top";

type ItemCesta = {
  id: string;
  nome: string;
  preco: number;
  unidade: string;
  quantidade: number;
  emoji: string;
};

type CestaDetalhes = {
  id: string;
  nome: string;
  preco: number;
  feirante: string;
  banca: string;
  feira: string;
  itens: ItemCesta[];
};

const cestasData: { [key: string]: CestaDetalhes } = {
  "1": {
    id: "1",
    nome: "Kit Sopão",
    preco: 25.8,
    feirante: "João da Silva",
    banca: "Banca 23",
    feira: "Feira do Lobão",
    itens: [
      {
        id: "1",
        nome: "Abobrinha",
        preco: 8.9,
        unidade: "kg",
        quantidade: 2,
        emoji: "🥒",
      },
      {
        id: "2",
        nome: "Moranga Cabotiá",
        preco: 3.5,
        unidade: "unid",
        quantidade: 1,
        emoji: "🎃",
      },
      {
        id: "3",
        nome: "Cenoura",
        preco: 3.5,
        unidade: "unid",
        quantidade: 1,
        emoji: "🥕",
      },
      {
        id: "4",
        nome: "Batata Inglesa",
        preco: 3.5,
        unidade: "unid",
        quantidade: 1,
        emoji: "🥔",
      },
      {
        id: "5",
        nome: "Brócolis",
        preco: 3.5,
        unidade: "unid",
        quantidade: 1,
        emoji: "🥦",
      },
    ],
  },
};

const CestaDetalhesScreen = () => {
  const { id } = useLocalSearchParams();
  const cestaId = Array.isArray(id) ? id[0] : id;
  const cesta = cestasData[cestaId];

  const [itens, setItens] = useState<ItemCesta[]>(cesta?.itens || []);

  const updateQuantidade = (itemId: string, novaQuantidade: number) => {
    setItens(
      itens.map((item) =>
        item.id === itemId
          ? { ...item, quantidade: Math.max(0, novaQuantidade) }
          : item
      )
    );
  };

  const adicionarCesta = () => {
    Alert.alert(
      "Cesta adicionada!",
      "A cesta foi adicionada ao seu carrinho.",
      [{ text: "OK", onPress: () => router.push("/cesta") }]
    );
  };

  const renderItem = ({ item }: { item: ItemCesta }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemEmoji}>{item.emoji}</Text>
        <View style={styles.itemInfo}>
          <Text style={styles.itemNome}>{item.nome}</Text>
          <Text style={styles.itemPreco}>
            R$ {item.preco.toFixed(2).replace(".", ",")}/{item.unidade}
          </Text>
        </View>
        <View style={styles.quantidadeContainer}>
          <TouchableOpacity
            style={styles.quantidadeButton}
            onPress={() => updateQuantidade(item.id, item.quantidade - 1)}
          >
            <Ionicons name="remove" size={20} color="#4A7C59" />
          </TouchableOpacity>
          <Text style={styles.quantidadeTexto}>{item.quantidade}</Text>
          <TouchableOpacity
            style={styles.quantidadeButton}
            onPress={() => updateQuantidade(item.id, item.quantidade + 1)}
          >
            <Ionicons name="add" size={20} color="#4A7C59" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (!cesta) {
    return (
      <View style={styles.container}>
        <Top />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Cesta não encontrada.</Text>
        </View>
        <Nav />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Top />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Detalhes da Cesta</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.cestaInfo}>
        <Text style={styles.cestaNome}>{cesta.nome}</Text>
        <Text style={styles.cestaPreco}>
          R$ {cesta.preco.toFixed(2).replace(".", ",")}
        </Text>
        <View style={styles.feiranteInfo}>
          <Ionicons name="storefront-outline" size={16} color="#666" />
          <Text style={styles.feiranteTexto}>
            {cesta.feira} - {cesta.feirante} - {cesta.banca}
          </Text>
        </View>
      </View>

      <FlatList
        data={itens}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.lista}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listaContent}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.adicionarButton}
          onPress={adicionarCesta}
        >
          <Text style={styles.adicionarButtonText}>Adicionar Cesta</Text>
        </TouchableOpacity>
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
  cestaInfo: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cestaNome: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: "#333",
    marginBottom: 8,
  },
  cestaPreco: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#4A7C59",
    marginBottom: 12,
  },
  feiranteInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  feiranteTexto: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginLeft: 8,
  },
  lista: {
    flex: 1,
  },
  listaContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  itemContainer: {
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
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemNome: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    marginBottom: 4,
  },
  itemPreco: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
  },
  quantidadeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quantidadeButton: {
    padding: 4,
  },
  quantidadeTexto: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: "center",
  },
  footer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
  },
  adicionarButton: {
    backgroundColor: "#4A7C59",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  adicionarButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
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
  },
});

export default CestaDetalhesScreen;
