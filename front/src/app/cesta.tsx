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

type ItemCesta = {
  id: string;
  nome: string;
  feira: string;
  preco: number;
  unidade: string;
  quantidade: number;
  opcoes?: string[];
  opcaoSelecionada?: string;
};

const CestaScreen = () => {
  const [itens, setItens] = useState<ItemCesta[]>([
    {
      id: "1",
      nome: "Tomate Orgânico",
      feira: "Feira Central",
      preco: 8.9,
      unidade: "kg",
      quantidade: 2,
      opcoes: ["Maduro", "Verde", "Ao ponto"],
      opcaoSelecionada: "Maduro",
    },
    {
      id: "2",
      nome: "Alface Crespa",
      feira: "Feira Central",
      preco: 3.5,
      unidade: "un",
      quantidade: 1,
      opcoes: ["Maduro", "Verde", "Ao ponto"],
      opcaoSelecionada: "Verde",
    },
  ]);

  const [cestaRecorrente, setCestaRecorrente] = useState(false);

  const updateQuantidade = (id: string, novaQuantidade: number) => {
    if (novaQuantidade === 0) {
      setItens(itens.filter((item) => item.id !== id));
    } else {
      setItens(
        itens.map((item) =>
          item.id === id ? { ...item, quantidade: novaQuantidade } : item
        )
      );
    }
  };

  const updateOpcao = (id: string, opcao: string) => {
    setItens(
      itens.map((item) =>
        item.id === id ? { ...item, opcaoSelecionada: opcao } : item
      )
    );
  };

  const removerItem = (id: string) => {
    setItens(itens.filter((item) => item.id !== id));
  };

  const calcularTotal = () => {
    return itens.reduce(
      (total, item) => total + item.preco * item.quantidade,
      0
    );
  };

  const finalizarPedido = () => {
    if (itens.length === 0) {
      Alert.alert(
        "Cesta vazia",
        "Adicione itens à sua cesta antes de finalizar o pedido."
      );
      return;
    }

    Alert.alert(
      "Pedido finalizado!",
      `Total: R$ ${calcularTotal().toFixed(2).replace(".", ",")}`,
      [{ text: "OK", onPress: () => router.push("/") }]
    );
  };

  const renderItem = ({ item }: { item: ItemCesta }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemNome}>{item.nome}</Text>
          <Text style={styles.itemFeira}>{item.feira}</Text>
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

      {item.opcoes && (
        <View style={styles.opcoesContainer}>
          {item.opcoes.map((opcao) => (
            <TouchableOpacity
              key={opcao}
              style={[
                styles.opcaoButton,
                item.opcaoSelecionada === opcao && styles.opcaoSelecionada,
              ]}
              onPress={() => updateOpcao(item.id, opcao)}
            >
              <View style={styles.radioButton}>
                {item.opcaoSelecionada === opcao && (
                  <View style={styles.radioButtonSelected} />
                )}
              </View>
              <Text
                style={[
                  styles.opcaoTexto,
                  item.opcaoSelecionada === opcao &&
                    styles.opcaoTextoSelecionado,
                ]}
              >
                {opcao}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.removerButton}
        onPress={() => removerItem(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF5722" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Top />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Minha Cesta</Text>
        <TouchableOpacity onPress={() => setItens([])}>
          <Ionicons name="trash-outline" size={24} color="#FF5722" />
        </TouchableOpacity>
      </View>

      {itens.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="basket-outline" size={80} color="#CCC" />
          <Text style={styles.emptyText}>Sua cesta está vazia</Text>
          <Text style={styles.emptySubtext}>
            Adicione produtos das feiras para começar
          </Text>
          <TouchableOpacity
            style={styles.voltarButton}
            onPress={() => router.push("/")}
          >
            <Text style={styles.voltarButtonText}>Explorar Feiras</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={itens}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            style={styles.lista}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.recorrenteContainer}>
            <TouchableOpacity
              style={styles.recorrenteButton}
              onPress={() => setCestaRecorrente(!cestaRecorrente)}
            >
              <View style={styles.checkbox}>
                {cestaRecorrente && (
                  <Ionicons name="checkmark" size={16} color="#4A7C59" />
                )}
              </View>
              <View style={styles.recorrenteTextos}>
                <Text style={styles.recorrenteTitle}>
                  Tornar cesta recorrente
                </Text>
                <Text style={styles.recorrenteSubtitle}>
                  Receba estes itens automaticamente
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total do pedido</Text>
              <Text style={styles.totalValor}>
                R$ {calcularTotal().toFixed(2).replace(".", ",")}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.finalizarButton}
              onPress={finalizarPedido}
            >
              <Text style={styles.finalizarButtonText}>Finalizar Pedido</Text>
            </TouchableOpacity>
          </View>
        </>
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
    paddingHorizontal: 16,
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
    position: "relative",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
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
  itemFeira: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginBottom: 4,
  },
  itemPreco: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#4A7C59",
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
  opcoesContainer: {
    marginBottom: 12,
  },
  opcaoButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#DDD",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4A7C59",
  },
  opcaoTexto: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
  },
  opcaoTextoSelecionado: {
    color: "#4A7C59",
    fontFamily: "Poppins-SemiBold",
  },
  opcaoSelecionada: {},
  removerButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 4,
  },
  recorrenteContainer: {
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
  recorrenteButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#4A7C59",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  recorrenteTextos: {
    flex: 1,
  },
  recorrenteTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    marginBottom: 2,
  },
  recorrenteSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
  },
  footer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#666",
  },
  totalValor: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: "#333",
  },
  finalizarButton: {
    backgroundColor: "#4A7C59",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  finalizarButtonText: {
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },
  voltarButton: {
    backgroundColor: "#4A7C59",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  voltarButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
});

export default CestaScreen;
