import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { router } from "expo-router";
import * as React from "react";
import {
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Header from "../components/Header";
import Nav from "../components/Nav";
import styles from "./styles";

const categorias = [
  { id: "1", name: "Legumes", icon: "leaf", color: "#C8E6C9" },
  { id: "2", name: "Frutas", icon: "apple", color: "#FFCDD2" },
  { id: "3", name: "Ovos", icon: "egg", color: "#FFF9C4" },
  { id: "4", name: "Orgânicos", icon: "flower", color: "#E1BEE7" },
];

const promocoes = [
  {
    id: "1",
    produto: "Tomate Italiano",
    preco: "R$ 5,99/kg",
    precoAntigo: "R$ 7,50",
    desconto: "-20%",
    imagem: "🍅",
  },
  {
    id: "2",
    produto: "Alface Crespa",
    preco: "R$ 2,50/un",
    precoAntigo: "R$ 3,00",
    desconto: "-15%",
    imagem: "🥬",
  },
];

const feirasAbertas = [
  {
    id: "1",
    nome: "Feira Vila Mariana",
    horario: "08:00 - 14:00",
  },
  {
    id: "2",
    nome: "Feira Pinheiros",
    horario: "07:00 - 13:00",
  },
];

const HomeScreen = () => {
  const renderCategoria = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.categoriaItem, { backgroundColor: item.color }]}
    >
      <Ionicons name={item.icon as any} size={24} color="#4A4A4A" />
      <Text style={styles.categoriaText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderPromocao = ({ item }: { item: any }) => (
    <View style={styles.promocaoCard}>
      <View style={styles.promocaoHeader}>
        <Text style={styles.promocaoDesconto}>{item.desconto}</Text>
      </View>
      <Text style={styles.promocaoEmoji}>{item.imagem}</Text>
      <Text style={styles.promocaoProduto}>{item.produto}</Text>
      <Text style={styles.promocaoPreco}>{item.preco}</Text>
      <Text style={styles.promocaoPrecoAntigo}>{item.precoAntigo}</Text>
    </View>
  );

  const renderFeiraAberta = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.feiraAbertaCard}
      onPress={() => router.push(`/feirantes/${item.id}`)}
    >
      <View style={styles.feiraAbertaInfo}>
        <Text style={styles.feiraAbertaNome}>{item.nome}</Text>
        <Text style={styles.feiraAbertaHorario}>{item.horario}</Text>
      </View>
      <View style={styles.feiraAbertaActions}>
        <TouchableOpacity style={styles.feiraAbertaButton}>
          <Text style={styles.feiraAbertaButtonText}>Ver Feirantes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.feiraAbertaMapButton}
          onPress={() => router.push("/mapa")}
        >
          <Text style={styles.feiraAbertaMapText}>Ver no Mapa</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.outerContainer}>
      <View style={styles.innerContainer}>
        <Header />
        <ScrollView
          style={styles.contentWrapper}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Banner Principal */}
            <View style={styles.bannerPrincipal}>
              <Text style={styles.bannerTitulo}>FEIRA</Text>
              <Text style={styles.bannerSubtitulo}>DO PEIXE</Text>
              <Text style={styles.bannerLocal}>COLONIA Z3</Text>
              <Text style={styles.bannerData}>30 DE ABRIL</Text>
            </View>

            {/* Barra de Busca */}
            <TouchableOpacity
              style={styles.buscaContainer}
              onPress={() => router.push("/busca")}
            >
              <Ionicons name="search" size={20} color="#999" />
              <Text style={styles.buscaPlaceholder}>
                Buscar produtos, feiras...
              </Text>
            </TouchableOpacity>

            {/* Categorias */}
            <View style={styles.secaoContainer}>
              <FlatList
                data={categorias}
                renderItem={renderCategoria}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriasList}
              />
            </View>

            {/* Promoções do Dia */}
            <View style={styles.secaoContainer}>
              <Text style={styles.secaoTitulo}>Promoções do Dia</Text>
              <FlatList
                data={promocoes}
                renderItem={renderPromocao}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.promocoesList}
              />
            </View>

            {/* Feiras Abertas Hoje */}
            <View style={styles.secaoContainer}>
              <View style={styles.secaoHeader}>
                <Text style={styles.secaoTitulo}>Feiras Abertas Hoje</Text>
                <TouchableOpacity onPress={() => router.push("/feiras")}>
                  <Text style={styles.verTodos}>Ver todos</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={feirasAbertas}
                renderItem={renderFeiraAberta}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>
          </View>
        </ScrollView>
        <Nav />
      </View>
    </View>
  );
};

export default function App() {
  const [fontsLoaded, error] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-SemiBold": require("../../assets/fonts/Poppins-SemiBold.ttf"),
  });

  if (!fontsLoaded) {
    if (error) {
      console.error("Erro ao carregar fontes:", error);
    }
    return (
      <Text style={{ textAlign: "center", marginTop: 50 }}>
        Carregando fontes...
      </Text>
    );
  }

  return <HomeScreen />;
}
