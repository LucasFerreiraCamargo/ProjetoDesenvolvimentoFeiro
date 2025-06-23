import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useApp } from "../contexts/AppContext";

const { width } = Dimensions.get("window");

// --- Dados Mock ---
const banners = [
  {
    id: "1",
    imagem: require("../../assets/images/banner.png"),
  },
];

const categorias = [
  {
    id: "1",
    name: "Legumes",
    icon: "leaf-outline",
    color: "#E8F5E8",
    iconColor: "#2D7D32",
  },
  {
    id: "2",
    name: "Frutas",
    icon: "nutrition-outline",
    color: "#FFE8E8",
    iconColor: "#E53E3E",
  },
  {
    id: "3",
    name: "Ovos",
    icon: "ellipse-outline",
    color: "#FFF8E1",
    iconColor: "#F9A825",
  },
  {
    id: "4",
    name: "Orgânicos",
    icon: "flower-outline",
    color: "#F3E5F5",
    iconColor: "#7B1FA2",
  },
  {
    id: "5",
    name: "Carnes",
    icon: "restaurant-outline",
    color: "#FFF0E6",
    iconColor: "#D84315",
  },
  {
    id: "6",
    name: "Peixes",
    icon: "fish-outline",
    color: "#E0F7FA",
    iconColor: "#0097A7",
  },
  {
    id: "7",
    name: "Laticínios",
    icon: "wine-outline",
    color: "#F3E5F5",
    iconColor: "#8E24AA",
  },
  {
    id: "8",
    name: "Grãos",
    icon: "grid-outline",
    color: "#FFF3E0",
    iconColor: "#F57C00",
  },
];

// --- Componentes ---
const BannerCarousel = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentBanner, setCurrentBanner] = React.useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prevIndex) => {
        const nextIndex = (prevIndex + 1) % banners.length;
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const index = Math.round(contentOffset.x / width);
    setCurrentBanner(index);
  };

  return (
    <View style={styles.carouselContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.carousel}
      >
        {banners.map((banner, index) => (
          <View key={banner.id} style={styles.bannerSlide}>
            <Image
              source={banner.imagem}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          </View>
        ))}
      </ScrollView>

      <View style={styles.pagination}>
        {banners.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentBanner && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const CategoriaItem = ({ item }: { item: any }) => (
  <TouchableOpacity
    style={styles.categoriaCard}
    onPress={() => router.push(`/busca?categoria=${item.id}`)}
  >
    <View style={[styles.categoriaIconCircle, { backgroundColor: item.color }]}>
      <Ionicons name={item.icon as any} size={32} color={item.iconColor} />
    </View>
    <Text style={styles.categoriaText}>{item.name}</Text>
  </TouchableOpacity>
);

const CardCesta = ({ item }: { item: any }) => (
  <TouchableOpacity
    style={styles.cardCesta}
    onPress={() => router.push(`/cesta/${item.id}`)}
  >
    <View style={styles.cestaImgContainer}>
      <Image
        source={{ uri: item.imagem }}
        style={styles.cestaImage}
        resizeMode="cover"
      />
      <View style={styles.cestaDesconto}>
        <Text style={styles.cestaDescontoText}>{item.desconto}</Text>
      </View>
    </View>

    <View style={styles.cestaContent}>
      <Text style={styles.cestaNome} numberOfLines={1}>
        {item.nome}
      </Text>
      <Text style={styles.cestaItens}>
        {item.itens?.length ? `${item.itens.length} itens` : "Vários produtos"}
      </Text>

      <View style={styles.cestaPrecoContainer}>
        <Text style={styles.cestaPreco}>R$ {item.preco.toFixed(2)}</Text>
        {item.precoAntigo && (
          <Text style={styles.cestaPrecoAntigo}>
            R$ {item.precoAntigo.toFixed(2)}
          </Text>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

const CardProduto = ({ item }: { item: any }) => {
  const { state } = useApp();

  const navegarParaProduto = () => {
    console.log("Tentando navegar para produto:", item.id);

    // Encontrar o feirante que tem esse produto
    let feiranteEncontrado = null;
    let feiraEncontrada = null;

    for (const feira of state.feiras) {
      for (const feirante of feira.feirantes) {
        const produtoExiste = feirante.produtos.some(
          (p: any) => p.id === item.id
        );
        if (produtoExiste) {
          feiranteEncontrado = feirante;
          feiraEncontrada = feira;
          break;
        }
      }
      if (feiranteEncontrado) break;
    }

    if (feiranteEncontrado) {
      console.log(
        "Feirante encontrado:",
        feiranteEncontrado.id,
        "na feira:",
        feiraEncontrada?.id
      );
      router.push(`/produtos/${feiranteEncontrado.id}`);
    } else {
      console.warn("Feirante não encontrado para produto:", item.id);
      // Fallback: usar o primeiro feirante disponível que tenha produtos
      const feiraComFeirantes = state.feiras.find(
        (feira) =>
          feira.feirantes.length > 0 &&
          feira.feirantes.some((f) => f.produtos.length > 0)
      );

      if (feiraComFeirantes) {
        const feiranteComProdutos = feiraComFeirantes.feirantes.find(
          (f) => f.produtos.length > 0
        );
        if (feiranteComProdutos) {
          console.log(
            "Usando fallback - navegando para:",
            feiranteComProdutos.id
          );
          router.push(`/produtos/${feiranteComProdutos.id}`);
        } else {
          console.error("Nenhum feirante com produtos encontrado");
        }
      } else {
        console.error("Nenhuma feira com feirantes disponível");
      }
    }
  };

  return (
    <TouchableOpacity style={styles.cardProduto} onPress={navegarParaProduto}>
      <View style={styles.cardImgContainer}>
        <Image
          source={{ uri: item.imagem }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        {item.desconto && (
          <View style={styles.cardDesconto}>
            <Text style={styles.cardDescontoText}>-15%</Text>
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardNome} numberOfLines={2}>
          {item.nome}
        </Text>

        <Text style={styles.cardUnidade}>Por {item.unidade}</Text>

        <View style={styles.cardPrecoContainer}>
          <Text style={styles.cardPreco}>R$ {item.preco.toFixed(2)}</Text>
          <Text style={styles.cardPrecoAntigo}>
            R$ {(item.preco * 1.18).toFixed(2)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const FeiraItem = ({ item }: { item: any }) => (
  <TouchableOpacity style={styles.feiraCard}>
    <View style={styles.feiraImgContainer}>
      <Image
        source={{ uri: item.imagem }}
        style={styles.feiraImage}
        resizeMode="cover"
      />
    </View>
    <View style={styles.feiraInfo}>
      <Text style={styles.feiraNome}>{item.nome}</Text>
      <Text style={styles.feiraHorario}>{item.horario}</Text>
      <View style={styles.feiraButtons}>
        <TouchableOpacity
          style={styles.feiraButtonPrimary}
          onPress={() => router.push(`/feirantes/${item.id}`)}
        >
          <Text style={styles.feiraButtonPrimaryText}>Ver Feirantes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.feiraButtonSecondary}
          onPress={() => router.push("/mapa")}
        >
          <Text style={styles.feiraButtonSecondaryText}>Ver no Mapa</Text>
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
);

// --- Tela Principal ---
export default function HomeScreen() {
  const { state, getAllCestas, getAllProdutos } = useApp();

  // Verificar se o context está carregado
  if (!state || !state.feiras) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </View>
    );
  }

  // Usar dados do context
  const promocoes = getAllProdutos().slice(0, 5); // Primeiros 5 produtos como promoção
  const cestas = getAllCestas().slice(0, 3); // Primeiras 3 cestas
  const feirasAbertas = state.feiras.filter(
    (feira) => feira.status === "Aberto"
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Carrossel de Banners */}
        <BannerCarousel />

        {/* Busca */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push("/busca")}
        >
          <View style={styles.searchIconContainer}>
            <Ionicons name="search" size={20} color="#255336" />
          </View>
          <Text style={styles.searchText}>Buscar produtos, feiras...</Text>
          <Ionicons name="mic-outline" size={20} color="#999" />
        </TouchableOpacity>

        {/* Categorias */}
        <View style={styles.categoriasContainer}>
          <Text style={styles.categoriasTitle}>Categorias</Text>
          <FlatList
            data={categorias}
            renderItem={({ item }) => <CategoriaItem item={item} />}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriasHorizontalList}
          />
        </View>

        {/* Promoções do Dia */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Promoções do Dia</Text>
            <TouchableOpacity
              onPress={() => router.push("/busca?categoria=promocoes")}
            >
              <Text style={styles.verTodos}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={promocoes}
            renderItem={({ item }) => <CardProduto item={item} />}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>

        {/* Cestas em Oferta */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cestas em Oferta</Text>
            <TouchableOpacity
              onPress={() => router.push("/busca?categoria=cestas")}
            >
              <Text style={styles.verTodos}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={cestas}
            renderItem={({ item }) => <CardCesta item={item} />}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>

        {/* Feiras Abertas Hoje */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Feiras Abertas Hoje</Text>
            <TouchableOpacity onPress={() => router.push("/feiras")}>
              <Text style={styles.verTodos}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.verticalList}>
            {feirasAbertas.map((item) => (
              <FeiraItem key={item.id} item={item} />
            ))}
          </View>
        </View>

        {/* Espaço para o Nav */}
        <View style={styles.navSpacer} />
      </ScrollView>
    </View>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7E4",
  },
  content: {
    flex: 1,
  },

  // Carrossel de Banners
  carouselContainer: {
    height: 200,
    marginBottom: 24,
  },
  carousel: {
    flex: 1,
  },
  bannerSlide: {
    width: width,
    height: 200,
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  pagination: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  paginationDotActive: {
    backgroundColor: "#FFFFFF",
    width: 24,
  },

  // Busca
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 28,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0F8F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  searchText: {
    color: "#999",
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },

  // Categorias
  categoriasContainer: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  categoriasTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  categoriasHorizontalList: {
    gap: 16,
    paddingRight: 20,
  },
  categoriaCard: {
    alignItems: "center",
    width: 80,
  },
  categoriaIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  categoriaText: {
    fontSize: 13,
    color: "#333",
    textAlign: "center",
    fontWeight: "600",
  },

  // Seções
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  verTodos: {
    color: "#255336",
    fontWeight: "600",
    fontSize: 14,
  },

  horizontalList: {
    paddingLeft: 20,
    paddingRight: 8,
    paddingBottom: 15,
  },
  verticalList: {
    gap: 16,
    paddingHorizontal: 20,
  },

  // Cards de Produto
  cardProduto: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: 170,
    height: 240,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
    marginRight: 12,
  },
  cardImgContainer: {
    height: 130,
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardDesconto: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#FF4757",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 3,
  },
  cardDescontoText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: "flex-start",
  },
  cardNome: {
    fontWeight: "bold",
    color: "#333",
    fontSize: 15,
    lineHeight: 18,
    marginBottom: 4,
  },
  cardUnidade: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  cardPrecoContainer: {
    marginTop: "auto",
  },
  cardPreco: {
    color: "#2D5D31",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 2,
  },
  cardPrecoAntigo: {
    color: "#999",
    textDecorationLine: "line-through",
    fontSize: 12,
  },

  // Cards de Cesta
  cardCesta: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: 200,
    height: 280,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
    marginRight: 4,
  },
  cestaImgContainer: {
    height: 160,
    position: "relative",
  },
  cestaImage: {
    width: "100%",
    height: "100%",
  },
  cestaDesconto: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#10B981",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 3,
  },
  cestaDescontoText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  cestaContent: {
    flex: 1,
    padding: 16,
    justifyContent: "flex-start",
  },
  cestaNome: {
    fontWeight: "bold",
    color: "#333",
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  cestaItens: {
    color: "#666",
    fontSize: 13,
    marginBottom: 8,
    fontWeight: "400",
  },
  cestaPrecoContainer: {
    marginTop: "auto",
  },
  cestaPreco: {
    color: "#2D5D31",
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 2,
  },
  cestaPrecoAntigo: {
    color: "#999",
    textDecorationLine: "line-through",
    fontSize: 14,
  },

  // Cards de Feira
  feiraCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    alignItems: "center",
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 100,
  },
  feiraImgContainer: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 16,
    overflow: "hidden",
  },
  feiraImage: {
    width: "100%",
    height: "100%",
  },
  feiraInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  feiraNome: {
    fontWeight: "bold",
    color: "#333",
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  feiraHorario: {
    color: "#666",
    fontSize: 14,
    marginBottom: 12,
    fontWeight: "400",
  },
  feiraButtons: {
    flexDirection: "row",
    gap: 8,
  },
  feiraButtonPrimary: {
    backgroundColor: "#2D5D31",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flex: 1,
    alignItems: "center",
  },
  feiraButtonPrimaryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  feiraButtonSecondary: {
    borderWidth: 1,
    borderColor: "#2D5D31",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flex: 1,
    alignItems: "center",
  },
  feiraButtonSecondaryText: {
    color: "#2D5D31",
    fontWeight: "600",
    fontSize: 12,
  },

  navSpacer: {
    height: 32,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
});
