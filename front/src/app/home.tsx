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

import Header from "../components/Header";
import Nav from "../components/Nav/index";

const { width } = Dimensions.get("window");

// --- Dados Mock ---
const banners = [
  {
    id: "1",
    image: require("../../assets/images/banner.png"),
    title: "FEIRA DO PEIXE",
    subtitle: "COLÔNIA Z3",
    date: "30 DE ABRIL",
  },
  {
    id: "2",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=400&fit=crop&crop=center",
    title: "FEIRA ORGÂNICA",
    subtitle: "PRODUTOS FRESCOS",
    date: "TODOS OS DIAS",
  },
  {
    id: "3",
    image:
      "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&h=400&fit=crop&crop=center",
    title: "FEIRA NOTURNA",
    subtitle: "CENTRO DA CIDADE",
    date: "SEXTAS E SÁBADOS",
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

const promocoes = [
  {
    id: "1",
    produto: "Tomate Italiano",
    preco: "R$ 5,99/kg",
    precoAntigo: "R$ 7,50",
    desconto: "-20%",
    imagem:
      "https://images.unsplash.com/photo-1546470427-227a3d7baa1b?w=400&h=300&fit=crop&crop=center",
  },
  {
    id: "2",
    produto: "Alface Crespa",
    preco: "R$ 2,50/un",
    precoAntigo: "R$ 3,00",
    desconto: "-15%",
    imagem:
      "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&h=300&fit=crop&crop=center",
  },
  {
    id: "3",
    produto: "Cenoura Orgânica",
    preco: "R$ 4,20/kg",
    precoAntigo: "R$ 5,00",
    desconto: "-16%",
    imagem:
      "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&h=300&fit=crop&crop=center",
  },
];

const cestas = [
  {
    id: "1",
    nome: "Cesta Semanal Família",
    itens: "8 itens variados",
    preco: "R$ 89,90",
    precoAntigo: "R$ 99,90",
    desconto: "10% OFF",
    imagem:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop&crop=center",
  },
  {
    id: "2",
    nome: "Cesta Premium",
    itens: "6 itens",
    preco: "R$ 119,90",
    precoAntigo: "R$ 139,90",
    desconto: "15% OFF",
    imagem:
      "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400&h=300&fit=crop&crop=center",
  },
];

const feirasAbertas = [
  {
    id: "1",
    nome: "Feira Vila Mariana",
    horario: "08:00 - 14:00",
    status: "Aberta agora",
    distancia: "2.5 km",
    imagem:
      "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=300&h=300&fit=crop&crop=center",
  },
  {
    id: "2",
    nome: "Feira Pinheiros",
    horario: "07:00 - 13:00",
    status: "Abre em 2h",
    distancia: "4.1 km",
    imagem:
      "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=300&h=300&fit=crop&crop=center",
  },
];

// --- Componentes ---
const BannerCarousel = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % banners.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * width,
          animated: true,
        });
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const index = Math.round(contentOffset.x / width);
    setCurrentIndex(index);
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
              source={
                typeof banner.image === "string"
                  ? { uri: banner.image }
                  : banner.image
              }
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
              index === currentIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const CategoriaItem = ({ item }: { item: any }) => (
  <TouchableOpacity style={styles.categoriaCard}>
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
      <Text style={styles.cestaItens}>{item.itens}</Text>

      <View style={styles.cestaPrecoContainer}>
        <Text style={styles.cestaPreco}>{item.preco}</Text>
        {item.precoAntigo && (
          <Text style={styles.cestaPrecoAntigo}>{item.precoAntigo}</Text>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

const CardProduto = ({ item }: { item: any }) => (
  <TouchableOpacity
    style={styles.cardProduto}
    onPress={() => router.push(`/produtos/${item.id}`)}
  >
    <View style={styles.cardImgContainer}>
      <Image
        source={{ uri: item.imagem }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      <View style={styles.cardDesconto}>
        <Text style={styles.cardDescontoText}>{item.desconto}</Text>
      </View>
    </View>

    <View style={styles.cardContent}>
      <Text style={styles.cardNome} numberOfLines={1}>
        {item.produto || item.nome}
      </Text>

      <View style={styles.cardPrecoContainer}>
        <Text style={styles.cardPreco}>{item.preco}</Text>
        {item.precoAntigo && (
          <Text style={styles.cardPrecoAntigo}>{item.precoAntigo}</Text>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

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
        <TouchableOpacity style={styles.feiraButtonPrimary}>
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
  return (
    <View style={styles.container}>
      <Header />
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
            <TouchableOpacity>
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
            <TouchableOpacity>
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
      <Nav />
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
    gap: 16,
    paddingLeft: 20,
    paddingRight: 20,
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
    width: 200,
    height: 260,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
    marginRight: 4,
  },
  cardImgContainer: {
    height: 160,
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
    padding: 16,
    justifyContent: "flex-start",
  },
  cardNome: {
    fontWeight: "bold",
    color: "#333",
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  cardPrecoContainer: {
    marginTop: "auto",
  },
  cardPreco: {
    color: "#2D5D31",
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 2,
  },
  cardPrecoAntigo: {
    color: "#999",
    textDecorationLine: "line-through",
    fontSize: 14,
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
});
