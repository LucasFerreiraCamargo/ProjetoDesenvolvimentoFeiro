import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Nav from "../../components/Nav";
import Top from "../../components/Top";

type Produto = {
  id: string;
  nome: string;
  preco: string;
  unidade: string;
  estoque: string;
  emoji: string;
  quantidade?: number;
};

type Cesta = {
  id: string;
  nome: string;
  itens: number;
  preco: string;
  desconto?: string;
  emoji: string;
};

const produtosPorFeirante: {
  [key: string]: { produtos: Produto[]; cestas: Cesta[] };
} = {
  "1": {
    produtos: [
      {
        id: "1",
        nome: "Tomate Italiano",
        preco: "8,90",
        unidade: "kg",
        estoque: "12kg",
        emoji: "🍅",
        quantidade: 1,
      },
      {
        id: "2",
        nome: "Alface Crespa",
        preco: "3,50",
        unidade: "unid",
        estoque: "20un",
        emoji: "🥬",
        quantidade: 2,
      },
      {
        id: "3",
        nome: "Cenoura",
        preco: "5,90",
        unidade: "kg",
        estoque: "8kg",
        emoji: "🥕",
        quantidade: 0,
      },
    ],
    cestas: [
      {
        id: "1",
        nome: "Kit Sopão",
        itens: 8,
        preco: "25,80",
        desconto: "10% OFF",
        emoji: "🥕",
      },
      {
        id: "2",
        nome: "Cesta Semanal Família",
        itens: 6,
        preco: "119,90",
        emoji: "🥬",
      },
    ],
  },
};

const feirantesInfo: {
  [key: string]: {
    nome: string;
    banca: string;
    avaliacao: number;
    totalAvaliacoes: number;
  };
} = {
  "1": {
    nome: "João da Silva",
    banca: "Banca 23 • Feira do Lobão",
    avaliacao: 4.8,
    totalAvaliacoes: 234,
  },
};

const ProdutosScreen = () => {
  const { id } = useLocalSearchParams();
  const feiranteId = Array.isArray(id) ? id[0] : id;
  const dadosFeirante = produtosPorFeirante[feiranteId];
  const infoFeirante = feirantesInfo[feiranteId];

  const [produtos, setProdutos] = useState(dadosFeirante?.produtos || []);

  const updateQuantidade = (produtoId: string, novaQuantidade: number) => {
    setProdutos(
      produtos.map((produto) =>
        produto.id === produtoId
          ? { ...produto, quantidade: Math.max(0, novaQuantidade) }
          : produto
      )
    );
  };

  const renderProduto = ({ item }: { item: Produto }) => (
    <View style={styles.produtoCard}>
      <View style={styles.produtoHeader}>
        <Text style={styles.produtoEmoji}>{item.emoji}</Text>
        <View style={styles.produtoInfo}>
          <Text style={styles.produtoNome}>{item.nome}</Text>
          <Text style={styles.produtoPreco}>
            R$ {item.preco}/{item.unidade}
          </Text>
          <Text style={styles.produtoEstoque}>Em estoque: {item.estoque}</Text>
        </View>
      </View>

      <View style={styles.quantidadeContainer}>
        <TouchableOpacity
          style={styles.quantidadeButton}
          onPress={() => updateQuantidade(item.id, (item.quantidade || 0) - 1)}
        >
          <Ionicons name="remove" size={20} color="#4A7C59" />
        </TouchableOpacity>
        <Text style={styles.quantidadeTexto}>{item.quantidade || 0}</Text>
        <TouchableOpacity
          style={styles.quantidadeButton}
          onPress={() => updateQuantidade(item.id, (item.quantidade || 0) + 1)}
        >
          <Ionicons name="add" size={20} color="#4A7C59" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCesta = ({ item }: { item: Cesta }) => (
    <View style={styles.cestaCard}>
      {item.desconto && (
        <View style={styles.descontoTag}>
          <Text style={styles.descontoTexto}>{item.desconto}</Text>
        </View>
      )}
      <Text style={styles.cestaEmoji}>{item.emoji}</Text>
      <Text style={styles.cestaNome}>{item.nome}</Text>
      <Text style={styles.cestaItens}>{item.itens} itens variados</Text>
      <Text style={styles.cestaPreco}>R$ {item.preco}</Text>
      <TouchableOpacity
        style={styles.verCestaButton}
        onPress={() => router.push(`/cesta/${item.id}`)}
      >
        <Text style={styles.verCestaTexto}>Ver cesta</Text>
      </TouchableOpacity>
    </View>
  );

  if (!dadosFeirante || !infoFeirante) {
    return (
      <View style={styles.container}>
        <Top />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Feirante não encontrado.</Text>
        </View>
        <Nav />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Top />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>{infoFeirante.nome}</Text>
          <TouchableOpacity>
            <Ionicons name="share-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Info do Feirante */}
        <View style={styles.feiranteInfo}>
          <Text style={styles.feiranteNome}>{infoFeirante.nome}</Text>
          <Text style={styles.feiranteBanca}>{infoFeirante.banca}</Text>
          <View style={styles.avaliacaoContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.avaliacaoTexto}>
              {infoFeirante.avaliacao} ({infoFeirante.totalAvaliacoes}{" "}
              avaliações)
            </Text>
          </View>

          <TouchableOpacity style={styles.whatsappButton}>
            <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
            <Text style={styles.whatsappText}>Falar com feirante</Text>
          </TouchableOpacity>
        </View>

        {/* Cestas Prontas */}
        {dadosFeirante.cestas.length > 0 && (
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>Cestas Prontas</Text>
            <FlatList
              data={dadosFeirante.cestas}
              renderItem={renderCesta}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cestasList}
            />
          </View>
        )}

        {/* Produtos */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Produtos</Text>
          <FlatList
            data={produtos}
            renderItem={renderProduto}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
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
  feiranteInfo: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    marginBottom: 16,
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
  secao: {
    marginBottom: 24,
  },
  secaoTitulo: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    marginBottom: 12,
  },
  cestasList: {
    paddingHorizontal: 4,
  },
  cestaCard: {
    width: 140,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
  },
  descontoTag: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#4A7C59",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  descontoTexto: {
    fontSize: 10,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  cestaEmoji: {
    fontSize: 40,
    textAlign: "center",
    marginVertical: 8,
  },
  cestaNome: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    textAlign: "center",
    marginBottom: 4,
  },
  cestaItens: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  cestaPreco: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#4A7C59",
    textAlign: "center",
    marginBottom: 8,
  },
  verCestaButton: {
    backgroundColor: "#4A7C59",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  verCestaTexto: {
    fontSize: 12,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  produtoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  produtoHeader: {
    flexDirection: "row",
    flex: 1,
  },
  produtoEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  produtoInfo: {
    flex: 1,
  },
  produtoNome: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    marginBottom: 4,
  },
  produtoPreco: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#4A7C59",
    marginBottom: 4,
  },
  produtoEstoque: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666",
  },
  quantidadeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantidadeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#4A7C59",
    justifyContent: "center",
    alignItems: "center",
  },
  quantidadeTexto: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    marginHorizontal: 16,
    minWidth: 20,
    textAlign: "center",
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

export default ProdutosScreen;
