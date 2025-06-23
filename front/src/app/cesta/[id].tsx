import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useApp } from "../../contexts/AppContext";
import { useCesta } from "../../contexts/CestaContext";

const CestaDetalhesScreen = () => {
  const { id } = useLocalSearchParams();
  const cestaId = Array.isArray(id) ? id[0] : id;
  const { getCesta } = useApp();
  const { adicionarCesta } = useCesta();
  const cesta = getCesta(cestaId);

  const [quantidades, setQuantidades] = useState<{ [key: string]: number }>({});

  // Inicializar quantidades se ainda não existem
  React.useEffect(() => {
    if (cesta?.itens) {
      const novasQuantidades: { [key: string]: number } = {};
      cesta.itens.forEach((item) => {
        novasQuantidades[item.id] = item.quantidade || 1;
      });
      setQuantidades(novasQuantidades);
    }
  }, [cesta]);

  const updateQuantidade = (itemId: string, novaQuantidade: number) => {
    setQuantidades((prev) => ({
      ...prev,
      [itemId]: Math.max(1, novaQuantidade),
    }));
  };

  // Remover produto da cesta
  const removerProduto = (itemId: string) => {
    Alert.alert("Remover produto", "Deseja remover este produto da cesta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: () => {
          setQuantidades((prev) => {
            const newQuantidades = { ...prev };
            delete newQuantidades[itemId];
            return newQuantidades;
          });
        },
      },
    ]);
  };

  const calcularTotalCesta = () => {
    if (!cesta?.itens) return 0;

    // Calcular o total dos itens baseado nas quantidades selecionadas
    const itensAtivos = cesta.itens.filter(
      (item) => quantidades[item.id] !== undefined
    );
    const totalItens = itensAtivos.reduce((total, item) => {
      const quantidade = quantidades[item.id] || item.quantidade || 1;
      return total + item.preco * quantidade;
    }, 0);

    // Se há desconto, aplicar o desconto
    if (cesta.desconto) {
      // Extrair porcentagem do desconto (ex: "10% OFF" -> 10)
      const percentualMatch = cesta.desconto.match(/(\d+)%/);
      if (percentualMatch) {
        const percentual = parseInt(percentualMatch[1]);
        const desconto = (totalItens * percentual) / 100;
        const totalFinal = totalItens - desconto;
        return totalFinal;
      }
    }

    return totalItens;
  };

  const adicionarCestaAoCarrinho = () => {
    if (!cesta) return;

    // Verificar se há itens na cesta
    const itensAtivos = cesta.itens.filter(
      (item) => quantidades[item.id] !== undefined
    );
    if (itensAtivos.length === 0) {
      Alert.alert("Atenção", "Adicione pelo menos um produto à cesta");
      return;
    }

    // Usar o preço calculado (com desconto) ao invés do preço original
    const precoFinal = calcularTotalCesta();

    // Adicionar a cesta completa como um único item no carrinho
    adicionarCesta({
      cestaId: cesta.id,
      nome: cesta.nome,
      preco: precoFinal, // Usar o preço calculado (com desconto)
      precoOriginal: cesta.preco, // Manter o preço original para referência
      feiranteId: "feirante-1", // TODO: Pegar o ID real do feirante
      feiraId: "feira-1", // TODO: Pegar o ID real da feira
      feiranteNome: cesta.feirante || "Feirante",
      feiranteBanca: cesta.banca || "Banca",
      feiraNome: cesta.feira || "Feira",
      imagem: cesta.imagem,
      emoji: cesta.emoji,
      quantidade: 1,
    });

    Alert.alert(
      "Cesta adicionada!",
      `A cesta "${
        cesta.nome
      }" foi adicionada ao seu carrinho por R$ ${precoFinal.toFixed(2)}.`,
      [{ text: "Ver Carrinho", onPress: () => router.push("/cesta") }]
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    // Se o item foi removido, não renderizar
    if (quantidades[item.id] === undefined) return null;

    const quantidade = quantidades[item.id] || item.quantidade || 1;

    return (
      <View style={styles.itemContainer}>
        <View style={styles.itemImageContainer}>
          {item.imagem ? (
            <Image
              source={{ uri: item.imagem }}
              style={styles.itemImagem}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.itemImagePlaceholder}>
              <Text style={styles.itemEmoji}>{item.emoji || "🥬"}</Text>
            </View>
          )}
        </View>

        <View style={styles.itemInfo}>
          <Text style={styles.itemNome}>{item.nome}</Text>
          <Text style={styles.itemPreco}>
            R$ {item.preco.toFixed(2)}
            <Text style={styles.itemUnidade}>/{item.unidade}</Text>
          </Text>
          <Text style={styles.itemTotal}>
            Total: R$ {(item.preco * quantidade).toFixed(2)}
          </Text>
        </View>

        <View style={styles.quantidadeContainer}>
          <TouchableOpacity
            style={[
              styles.quantidadeButton,
              quantidade <= 1 && styles.quantidadeBtnDisabled,
            ]}
            onPress={() => updateQuantidade(item.id, quantidade - 1)}
            disabled={quantidade <= 1}
          >
            <Ionicons
              name="remove"
              size={18}
              color={quantidade <= 1 ? "#ccc" : "#2D5D31"}
            />
          </TouchableOpacity>

          <Text style={styles.quantidadeTexto}>{quantidade}</Text>

          <TouchableOpacity
            style={styles.quantidadeButton}
            onPress={() => updateQuantidade(item.id, quantidade + 1)}
          >
            <Ionicons name="add" size={18} color="#2D5D31" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.removerButton}
            onPress={() => removerProduto(item.id)}
          >
            <Ionicons name="trash" size={16} color="#E74C3C" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!cesta) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#2D5D31" />
          </TouchableOpacity>
          <Text style={styles.title}>Detalhes da Cesta</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="basket-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Cesta não encontrada.</Text>
        </View>
      </View>
    );
  }

  // Calcular valores para exibição
  const itensAtivos = cesta.itens.filter(
    (item) => quantidades[item.id] !== undefined
  );
  const totalSemDesconto = itensAtivos.reduce((total, item) => {
    const quantidade = quantidades[item.id] || item.quantidade || 1;
    return total + item.preco * quantidade;
  }, 0);

  const totalComDesconto = calcularTotalCesta();
  const valorDesconto = totalSemDesconto - totalComDesconto;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#2D5D31" />
        </TouchableOpacity>
        <Text style={styles.title}>Detalhes da Cesta</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.cestaInfo}>
        <View style={styles.cestaHeader}>
          <View style={styles.cestaImageContainer}>
            {cesta.imagem ? (
              <Image
                source={{ uri: cesta.imagem }}
                style={styles.cestaImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.cestaImagePlaceholder}>
                <Text style={styles.cestaEmoji}>{cesta.emoji || "🧺"}</Text>
              </View>
            )}
          </View>

          <View style={styles.cestaDetailsContainer}>
            <Text style={styles.cestaNome}>{cesta.nome}</Text>
            {cesta.desconto && (
              <View style={styles.descontoTag}>
                <Text style={styles.descontoText}>{cesta.desconto}</Text>
              </View>
            )}

            {/* Exibir valores calculados */}
            {cesta.desconto && (
              <>
                <Text style={styles.cestaPrecoOriginal}>
                  Preço sem desconto: R$ {totalSemDesconto.toFixed(2)}
                </Text>
                <Text style={styles.cestaDesconto}>
                  Desconto ({cesta.desconto}): -R$ {valorDesconto.toFixed(2)}
                </Text>
              </>
            )}
            <Text style={styles.cestaPrecoCalculado}>
              {cesta.desconto ? "Preço final: " : "Total: "}R${" "}
              {totalComDesconto.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.feiranteInfo}>
          <Ionicons name="storefront-outline" size={16} color="#666" />
          <Text style={styles.feiranteTexto}>
            {cesta.feira} - {cesta.feirante} - {cesta.banca}
          </Text>
        </View>
      </View>

      <Text style={styles.itensTitle}>
        Itens da Cesta ({itensAtivos.length})
      </Text>

      <View style={styles.listaContainer}>
        {cesta.itens.map((item) => (
          <View key={item.id}>{renderItem({ item })}</View>
        ))}
      </View>

      <View style={styles.resumoContainer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total da Cesta:</Text>
          <Text style={styles.totalValor}>
            R$ {totalComDesconto.toFixed(2)}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.adicionarButton,
            itensAtivos.length === 0 && styles.adicionarButtonDisabled,
          ]}
          onPress={adicionarCestaAoCarrinho}
          disabled={itensAtivos.length === 0}
        >
          <Ionicons name="bag-add" size={20} color="#FFF" />
          <Text style={styles.adicionarButtonText}>Adicionar ao Carrinho</Text>
        </TouchableOpacity>
      </View>

      {/* Espaço adicional para o final da tela */}
      <View style={{ height: 100 }} />
    </ScrollView>
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
    color: "#2D5D31",
  },
  cestaInfo: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cestaHeader: {
    flexDirection: "row",
    marginBottom: 16,
  },
  cestaImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginRight: 16,
    overflow: "hidden",
  },
  cestaImage: {
    width: 80,
    height: 80,
  },
  cestaImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: "#F0F8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  cestaEmoji: {
    fontSize: 32,
  },
  cestaDetailsContainer: {
    flex: 1,
    justifyContent: "center",
  },
  cestaNome: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2D5D31",
    marginBottom: 8,
  },
  descontoTag: {
    backgroundColor: "#E74C3C",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  descontoText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  cestaPrecoOriginal: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  cestaPrecoCalculado: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4A7C59",
  },
  cestaDesconto: {
    fontSize: 14,
    color: "#E74C3C",
    fontWeight: "bold",
    marginBottom: 4,
  },
  feiranteInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  feiranteTexto: {
    fontSize: 14,
    color: "#666",
  },
  itensTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D5D31",
    marginHorizontal: 20,
    marginBottom: 16,
  },
  listaContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImageContainer: {
    marginRight: 16,
  },
  itemImagem: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  itemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#F0F8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  itemEmoji: {
    fontSize: 24,
  },
  itemInfo: {
    flex: 1,
  },
  itemNome: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2D5D31",
    marginBottom: 4,
  },
  itemPreco: {
    fontSize: 14,
    color: "#4A7C59",
    fontWeight: "600",
    marginBottom: 4,
  },
  itemUnidade: {
    fontSize: 12,
    color: "#666",
    fontWeight: "normal",
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2D5D31",
  },
  quantidadeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quantidadeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8FDF9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E8F5E8",
  },
  quantidadeBtnDisabled: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E0E0E0",
  },
  quantidadeTexto: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2D5D31",
    minWidth: 24,
    textAlign: "center",
  },
  removerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFE5E5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFCDD2",
    marginLeft: 8,
  },
  resumoContainer: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D5D31",
  },
  totalValor: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4A7C59",
  },
  adicionarButton: {
    backgroundColor: "#4A7C59",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  adicionarButtonDisabled: {
    backgroundColor: "#ccc",
  },
  adicionarButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
});

export default CestaDetalhesScreen;
