import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Nav from "../../components/Nav";

type ItemCesta = {
  id: string;
  nome: string;
  preco: number;
  unidade: string;
  quantidade: number;
  imagem: string;
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
    nome: "Cesta Semanal Família",
    preco: 89.9,
    feirante: "João da Silva",
    banca: "Banca 23",
    feira: "Feira do Lobão",
    itens: [
      {
        id: "1",
        nome: "Tomate Italiano",
        preco: 5.99,
        unidade: "kg",
        quantidade: 2,
        imagem:
          "https://images.unsplash.com/photo-1546470427-227a3d7baa1b?w=100&h=100&fit=crop&crop=center",
      },
      {
        id: "2",
        nome: "Alface Crespa",
        preco: 2.5,
        unidade: "unid",
        quantidade: 3,
        imagem:
          "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=100&h=100&fit=crop&crop=center",
      },
      {
        id: "3",
        nome: "Cenoura Orgânica",
        preco: 4.2,
        unidade: "kg",
        quantidade: 1,
        imagem:
          "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=100&h=100&fit=crop&crop=center",
      },
      {
        id: "4",
        nome: "Batata Doce",
        preco: 3.8,
        unidade: "kg",
        quantidade: 1,
        imagem:
          "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=100&h=100&fit=crop&crop=center",
      },
      {
        id: "5",
        nome: "Cebola Roxa",
        preco: 3.2,
        unidade: "kg",
        quantidade: 1,
        imagem:
          "https://images.unsplash.com/photo-1508747703725-719777637510?w=100&h=100&fit=crop&crop=center",
      },
      {
        id: "6",
        nome: "Brócolis",
        preco: 4.5,
        unidade: "unid",
        quantidade: 2,
        imagem:
          "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=100&h=100&fit=crop&crop=center",
      },
      {
        id: "7",
        nome: "Couve-flor",
        preco: 3.9,
        unidade: "unid",
        quantidade: 1,
        imagem:
          "https://images.unsplash.com/photo-1568584711271-0e4e2d6e4119?w=100&h=100&fit=crop&crop=center",
      },
      {
        id: "8",
        nome: "Abobrinha",
        preco: 2.8,
        unidade: "kg",
        quantidade: 1,
        imagem:
          "https://images.unsplash.com/photo-1601470982266-89ee3e0f9ce4?w=100&h=100&fit=crop&crop=center",
      },
    ],
  },
  "2": {
    id: "2",
    nome: "Cesta Premium",
    preco: 119.9,
    feirante: "Maria Santos",
    banca: "Banca 15",
    feira: "Feira Central",
    itens: [
      {
        id: "1",
        nome: "Tomate Orgânico",
        preco: 12.0,
        unidade: "kg",
        quantidade: 1,
        imagem:
          "https://images.unsplash.com/photo-1546470427-227a3d7baa1b?w=100&h=100&fit=crop&crop=center",
      },
      {
        id: "2",
        nome: "Alface Americana Orgânica",
        preco: 4.5,
        unidade: "unid",
        quantidade: 2,
        imagem:
          "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=100&h=100&fit=crop&crop=center",
      },
      {
        id: "3",
        nome: "Rúcula Premium",
        preco: 6.0,
        unidade: "maço",
        quantidade: 2,
        imagem:
          "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=100&h=100&fit=crop&crop=center",
      },
      {
        id: "4",
        nome: "Espinafre Baby",
        preco: 8.5,
        unidade: "maço",
        quantidade: 1,
        imagem:
          "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=100&h=100&fit=crop&crop=center",
      },
      {
        id: "5",
        nome: "Cogumelos Shiitake",
        preco: 15.0,
        unidade: "kg",
        quantidade: 1,
        imagem:
          "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=100&h=100&fit=crop&crop=center",
      },
      {
        id: "6",
        nome: "Pimentão Orgânico Mix",
        preco: 9.8,
        unidade: "kg",
        quantidade: 1,
        imagem:
          "https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba?w=100&h=100&fit=crop&crop=center",
      },
    ],
  },
  "kit-sopao": {
    id: "kit-sopao",
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
        imagem:
          "https://images.unsplash.com/photo-1601470982266-89ee3e0f9ce4?w=100&h=100&fit=crop&crop=center",
      },
      {
        id: "2",
        nome: "Moranga Cabotiá",
        preco: 3.5,
        unidade: "unid",
        quantidade: 1,
        imagem:
          "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=100&h=100&fit=crop&crop=center",
      },
      {
        id: "3",
        nome: "Cenoura",
        preco: 3.5,
        unidade: "unid",
        quantidade: 1,
        imagem:
          "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=100&h=100&fit=crop&crop=center",
      },
      {
        id: "4",
        nome: "Batata Inglesa",
        preco: 3.5,
        unidade: "unid",
        quantidade: 1,
        imagem:
          "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=100&h=100&fit=crop&crop=center",
      },
      {
        id: "5",
        nome: "Brócolis",
        preco: 3.5,
        unidade: "unid",
        quantidade: 1,
        imagem:
          "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=100&h=100&fit=crop&crop=center",
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
      <Image
        source={{ uri: item.imagem }}
        style={styles.itemImagem}
        resizeMode="cover"
      />
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
          <Ionicons name="remove" size={18} color="#2D5D31" />
        </TouchableOpacity>
        <Text style={styles.quantidadeTexto}>{item.quantidade}</Text>
        <TouchableOpacity
          style={styles.quantidadeButton}
          onPress={() => updateQuantidade(item.id, item.quantidade + 1)}
        >
          <Ionicons name="add" size={18} color="#2D5D31" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!cesta) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Cesta não encontrada.</Text>
        </View>
        <Nav />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#FFF7E4",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  cestaInfo: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cestaNome: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  cestaPreco: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2D5D31",
    marginBottom: 12,
  },
  feiranteInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  feiranteTexto: {
    fontSize: 14,
    color: "#666",
  },
  lista: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listaContent: {
    paddingBottom: 20,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  itemImagem: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemNome: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  itemPreco: {
    fontSize: 14,
    color: "#666",
  },
  quantidadeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quantidadeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0F8F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2D5D31",
  },
  quantidadeTexto: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    minWidth: 20,
    textAlign: "center",
  },
  footer: {
    padding: 20,
    backgroundColor: "#FFF7E4",
  },
  adicionarButton: {
    backgroundColor: "#2D5D31",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  adicionarButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
});

export default CestaDetalhesScreen;
