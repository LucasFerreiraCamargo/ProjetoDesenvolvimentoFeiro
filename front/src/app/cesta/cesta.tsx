import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { ItemCesta, useCesta } from "../../contexts/CestaContext";

// Fotos do Unsplash para produtos
const produtoImages: { [key: string]: string } = {
  "tomate-italiano":
    "https://images.unsplash.com/photo-1546470427-227a3d7baa1b?w=300&h=300&fit=crop",
  "alface-crespa":
    "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=300&h=300&fit=crop",
  cenoura:
    "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=300&h=300&fit=crop",
  "banana-prata":
    "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&h=300&fit=crop",
  "maca-gala":
    "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&h=300&fit=crop",
  brocolis:
    "https://images.unsplash.com/photo-1628773822503-930a7eaecf80?w=300&h=300&fit=crop",
  cebola:
    "https://images.unsplash.com/photo-1508747703725-719777637510?w=300&h=300&fit=crop",
  batata:
    "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&h=300&fit=crop",
  laranja:
    "https://images.unsplash.com/photo-1557800636-894a64c1696f?w=300&h=300&fit=crop",
  morango:
    "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300&h=300&fit=crop",
};

const ItemCestaComponent = ({
  item,
  onQuantityChange,
  onRemove,
}: {
  item: ItemCesta;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}) => {
  const getProductImage = () => {
    // Buscar imagem por ID do produto
    const produtoId = item.produtoId;
    return produtoImages[produtoId] || item.imagem;
  };

  const calculateTotal = () => {
    if (item.tipo === "cesta") {
      // Para cestas, usar preço já com desconto aplicado
      return item.preco * item.quantidade;
    }

    if (item.unidade === "g") {
      // Para produtos em gramas, calcular com preço por kg
      return (item.preco * item.quantidade) / 1000;
    }

    // Para produtos por unidade
    return item.preco * item.quantidade;
  };

  // Se for uma cesta, renderizar diferente
  if (item.tipo === "cesta") {
    return (
      <View style={styles.itemContainer}>
        <View style={styles.cardContent}>
          {/* Header com nome e preço unitário */}
          <View style={styles.cardHeader}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.nome}</Text>
              <Text style={styles.productLocation}>
                {item.feiraNome} • {item.feiranteNome}
              </Text>
              <Text style={styles.productBanca}>{item.feiranteBanca}</Text>
              <Text style={styles.unitPrice}>
                R$ {item.preco.toFixed(2)} /cesta
              </Text>
            </View>
          </View>

          {/* Footer com controles e preço total */}
          <View style={styles.cardFooter}>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityBtn}
                onPress={() => onQuantityChange(item.id, item.quantidade - 1)}
              >
                <Ionicons name="remove" size={18} color="#4A7C59" />
              </TouchableOpacity>

              <View style={styles.quantityDisplay}>
                <Text style={styles.quantityText}>
                  {item.unidade === "g"
                    ? `${item.quantidade}g`
                    : `${item.quantidade}`}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.quantityBtn}
                onPress={() => onQuantityChange(item.id, item.quantidade + 1)}
              >
                <Ionicons name="add" size={18} color="#4A7C59" />
              </TouchableOpacity>
            </View>

            <View style={styles.rightSection}>
              <TouchableOpacity
                style={styles.trashButton}
                onPress={() => onRemove(item.id)}
              >
                <Ionicons name="trash-outline" size={18} color="#E74C3C" />
              </TouchableOpacity>

              <Text style={styles.totalPrice}>
                R$ {calculateTotal().toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Para produtos individuais, layout minimalista
  return (
    <View style={styles.itemContainer}>
      <View style={styles.cardContent}>
        {/* Header com nome e preço unitário */}
        <View style={styles.cardHeader}>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.nome}</Text>
            <Text style={styles.productLocation}>
              {item.feiraNome} • {item.feiranteNome}
            </Text>
            <Text style={styles.productBanca}>{item.feiranteBanca}</Text>
            <Text style={styles.unitPrice}>
              R$ {item.preco.toFixed(2)} /{item.unidade === "g" ? "kg" : "unid"}
            </Text>
          </View>
        </View>

        {/* Footer com controles, lixeira e preço total */}
        <View style={styles.cardFooter}>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityBtn}
              onPress={() => onQuantityChange(item.id, item.quantidade - 1)}
            >
              <Ionicons name="remove" size={18} color="#4A7C59" />
            </TouchableOpacity>

            <View style={styles.quantityDisplay}>
              <Text style={styles.quantityText}>
                {item.unidade === "g"
                  ? `${item.quantidade}g`
                  : `${item.quantidade}`}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.quantityBtn}
              onPress={() => onQuantityChange(item.id, item.quantidade + 1)}
            >
              <Ionicons name="add" size={18} color="#4A7C59" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.trashButton}
              onPress={() => onRemove(item.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#E74C3C" />
            </TouchableOpacity>
          </View>

          <Text style={styles.totalPrice}>
            R$ {calculateTotal().toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default function CestaScreen() {
  const {
    state,
    atualizarQuantidade,
    removerItem,
    limparCesta,
    getTotalItens,
    adicionarItem,
  } = useCesta();
  const [recorrente, setRecorrente] = React.useState(false);

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(id);
      return;
    }
    atualizarQuantidade(id, newQuantity);
  };

  const handleRemoveItem = (id: string) => {
    Alert.alert(
      "Remover item",
      "Tem certeza que deseja remover este item da cesta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => removerItem(id),
        },
      ]
    );
  };

  const handleClearCart = () => {
    Alert.alert(
      "Limpar cesta",
      "Tem certeza que deseja remover todos os itens da cesta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpar",
          style: "destructive",
          onPress: () => limparCesta(),
        },
      ]
    );
  };

  const total = state.total;

  if (state.itens.length === 0) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#2D5D31" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Minha Cesta</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Sua cesta está vazia</Text>
          <Text style={styles.emptySubtitle}>
            Adicione produtos incríveis{"\n"}dos nossos feirantes locais
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push("/home")}
          >
            <Text style={styles.emptyButtonText}>Começar a comprar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#2D5D31" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Minha Cesta</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* Itens da Cesta */}
        {state.itens.map((item) => (
          <ItemCestaComponent
            key={item.id}
            item={item}
            onQuantityChange={handleQuantityChange}
            onRemove={handleRemoveItem}
          />
        ))}

        {/* Opção de Cesta Recorrente - Movida para depois dos produtos */}
        <View style={styles.recorrenteContainer}>
          <TouchableOpacity
            style={styles.recorrenteRow}
            onPress={() => {
              if (!recorrente) {
                // Quando marca para recorrente, navegar para configuração
                console.log("Navegando para página de cesta recorrente...");
                router.push("/recorrente");
              } else {
                // Se já estava marcado, apenas desmarcar
                setRecorrente(false);
              }
            }}
          >
            <View
              style={[styles.checkbox, recorrente && styles.checkboxSelected]}
            >
              {recorrente && (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              )}
            </View>
            <View style={styles.recorrenteText}>
              <Text style={styles.recorrenteTitle}>
                Tornar cesta recorrente
              </Text>
              <Text style={styles.recorrenteSubtitle}>
                Receba estes itens automaticamente
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.navSpacer} />
      </ScrollView>

      {/* Footer fixo com total e botão Finalizar */}
      <View style={styles.footerFixed}>
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total do pedido</Text>
          <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={styles.finalizarButton}
          onPress={() => router.push("/finalizapedido")}
        >
          <Text style={styles.finalizarButtonText}>Finalizar Pedido</Text>
        </TouchableOpacity>
      </View>

      {/* Botão flutuante de limpar carrinho */}
      <TouchableOpacity
        style={styles.floatingTrashButton}
        onPress={handleClearCart}
      >
        <Ionicons name="trash" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7E4",
  },
  header: {
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D5D31",
  },
  clearButton: {
    padding: 8,
    borderRadius: 8,
  },
  itemContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    overflow: "visible", // Mudado para não cortar elementos
    position: "relative",
  },
  itemMain: {
    padding: 20,
    backgroundColor: "#FAFAFA",
  },
  itemMainMinimal: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFF",
    gap: 16,
  },
  itemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginRight: 20,
    overflow: "hidden",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E8F5E8",
    shadowColor: "#4A7C59",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: 80,
    height: 80,
  },
  itemImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: "#F0F8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  itemEmoji: {
    fontSize: 40,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  itemDetails: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  itemDetailsMinimal: {
    flex: 1,
  },
  itemPriceSection: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#F8FDF9",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  itemNome: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D5D31",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  itemFeira: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
    lineHeight: 18,
  },
  itemBanca: {
    fontSize: 12,
    color: "#888",
    marginBottom: 8,
    fontStyle: "italic",
  },
  precoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  itemPreco: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4A7C59",
    marginBottom: 4,
  },
  itemUnidade: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  precoOriginal: {
    fontSize: 12,
    color: "#999",
    textDecorationLine: "line-through",
    marginBottom: 4,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A7C59",
    marginTop: 4,
  },
  itemRightControls: {
    alignItems: "center",
    gap: 8,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "transparent",
  },

  quantityBtnDisabled: {
    backgroundColor: "#F5F5F5",
    shadowOpacity: 0,
    elevation: 0,
  },

  maturationOptions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    borderColor: "#2D5D31",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2D5D31",
  },
  optionLabel: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2D5D31",
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyButton: {
    backgroundColor: "#4A7C59",
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  emptyButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  recorrenteContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  recorrenteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: "#4A7C59",
    borderColor: "#4A7C59",
  },
  recorrenteText: {
    flex: 1,
  },
  recorrenteTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2D5D31",
    marginBottom: 4,
  },
  recorrenteSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  resumoContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  resumoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D5D31",
    marginBottom: 16,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4A7C59",
  },
  footer: {
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  finalizarButton: {
    backgroundColor: "#4A7C59",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  finalizarButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  navSpacer: {
    height: 120, // Aumentado para acomodar o footer fixo
  },
  headerSpacer: {
    width: 40, // Mesmo tamanho do botão de volta para centralizar o título
  },
  floatingTrashButton: {
    position: "absolute",
    bottom: 120, // Acima do botão finalizar
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E74C3C",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardTrashButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E74C3C",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  itemTotalMinimal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4A7C59",
    marginTop: 8,
  },
  itemActions: {
    alignItems: "center",
    gap: 12,
  },
  quantityControlsMinimal: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FDF9",
    borderRadius: 8,
    padding: 4,
    gap: 8,
  },
  quantityBtnSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quantityDisplaySmall: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
  },
  quantityDisplayContainer: {
    backgroundColor: "#4A7C59",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonMinimal: {
    backgroundColor: "#FFE5E5",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  footerFixed: {
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D5D31",
  },
  scrollView: {
    flex: 1,
    paddingBottom: 120, // Espaço para o footer fixo
  },
  quantityInfo: {
    backgroundColor: "#E8F5E8",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginTop: 6,
    marginBottom: 4,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
  },
  // Novos estilos para layout melhorado
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D5D31",
    marginBottom: 6,
  },
  productLocation: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  productBanca: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
  },
  trashButton: {
    backgroundColor: "#FFE5E5",
    borderRadius: 8,
    padding: 8,
    marginLeft: 16,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FDF9",
    borderRadius: 12,
    padding: 4,
    gap: 8,
  },
  quantityBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quantityDisplay: {
    backgroundColor: "#4A7C59",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4A7C59",
  },
  unitPrice: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  rightSection: {
    alignItems: "center",
    gap: 8,
  },
});
