import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Busca from "../components/Busca";
import Nav from "../components/Nav";
import Top from "../components/Top";

type ResultadoBusca = {
  id: string;
  tipo: "feira" | "produto" | "feirante";
  nome: string;
  descricao: string;
  localizacao?: string;
  preco?: string;
};

// Dados simulados para busca
const dadosBusca: ResultadoBusca[] = [
  {
    id: "1",
    tipo: "feira",
    nome: "Feira Central",
    descricao: "Feira tradicional do centro da cidade",
    localizacao: "Centro",
  },
  {
    id: "2",
    tipo: "feira",
    nome: "Feira do Lobão",
    descricao: "Feira popular com variedade de produtos",
    localizacao: "Fragata",
  },
  {
    id: "3",
    tipo: "produto",
    nome: "Tomate Italiano",
    descricao: "Tomate fresco e orgânico",
    preco: "R$ 8,90/kg",
  },
  {
    id: "4",
    tipo: "produto",
    nome: "Alface Crespa",
    descricao: "Alface fresca e crocante",
    preco: "R$ 3,50/un",
  },
  {
    id: "5",
    tipo: "feirante",
    nome: "João da Silva",
    descricao: "Especialista em frutas e verduras",
    localizacao: "Banca 23 - Feira Central",
  },
];

const BuscaScreen = () => {
  const { q } = useLocalSearchParams();
  const termoBusca = Array.isArray(q) ? q[0] : q || "";
  const [resultados, setResultados] = useState<ResultadoBusca[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (termoBusca) {
      realizarBusca(termoBusca);
    }
  }, [termoBusca]);

  const realizarBusca = (termo: string) => {
    setCarregando(true);

    // Simular busca
    setTimeout(() => {
      const resultadosFiltrados = dadosBusca.filter(
        (item) =>
          item.nome.toLowerCase().includes(termo.toLowerCase()) ||
          item.descricao.toLowerCase().includes(termo.toLowerCase()) ||
          item.localizacao?.toLowerCase().includes(termo.toLowerCase())
      );

      setResultados(resultadosFiltrados);
      setCarregando(false);
    }, 500);
  };

  const handleNovaSearch = (texto: string) => {
    realizarBusca(texto);
  };

  const navegarParaItem = (item: ResultadoBusca) => {
    switch (item.tipo) {
      case "feira":
        router.push(`/feirantes/${item.id}`);
        break;
      case "produto":
        router.push(`/produtos/${item.id}`);
        break;
      case "feirante":
        router.push(`/produtos/${item.id}`);
        break;
    }
  };

  const getIconeItem = (tipo: string) => {
    switch (tipo) {
      case "feira":
        return "storefront-outline";
      case "produto":
        return "leaf-outline";
      case "feirante":
        return "person-outline";
      default:
        return "search-outline";
    }
  };

  const renderResultado = ({ item }: { item: ResultadoBusca }) => (
    <TouchableOpacity
      style={styles.resultadoCard}
      onPress={() => navegarParaItem(item)}
    >
      <View style={styles.resultadoHeader}>
        <Ionicons
          name={getIconeItem(item.tipo) as any}
          size={24}
          color="#4A7C59"
        />
        <View style={styles.resultadoInfo}>
          <Text style={styles.resultadoNome}>{item.nome}</Text>
          <Text style={styles.resultadoDescricao}>{item.descricao}</Text>
          {item.localizacao && (
            <Text style={styles.resultadoLocalizacao}>{item.localizacao}</Text>
          )}
          {item.preco && (
            <Text style={styles.resultadoPreco}>{item.preco}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Top />

      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Resultados da Busca</Text>
          <View style={{ width: 24 }} />
        </View>

        <Busca
          onSearch={handleNovaSearch}
          placeholder="Buscar feiras, produtos, feirantes..."
        />

        {termoBusca ? (
          <Text style={styles.termoBusca}>Resultados para: "{termoBusca}"</Text>
        ) : null}

        {carregando ? (
          <View style={styles.carregandoContainer}>
            <Text style={styles.carregandoText}>Buscando...</Text>
          </View>
        ) : resultados.length > 0 ? (
          <FlatList
            data={resultados}
            renderItem={renderResultado}
            keyExtractor={(item) => item.id}
            style={styles.lista}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listaContent}
          />
        ) : termoBusca ? (
          <View style={styles.semResultadosContainer}>
            <Ionicons name="search-outline" size={80} color="#CCC" />
            <Text style={styles.semResultadosText}>
              Nenhum resultado encontrado
            </Text>
            <Text style={styles.semResultadosSubtext}>
              Tente buscar por outros termos
            </Text>
          </View>
        ) : (
          <View style={styles.semResultadosContainer}>
            <Ionicons name="search-outline" size={80} color="#CCC" />
            <Text style={styles.semResultadosText}>
              Digite algo para buscar
            </Text>
            <Text style={styles.semResultadosSubtext}>
              Encontre feiras, produtos e feirantes
            </Text>
          </View>
        )}
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
  termoBusca: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginVertical: 16,
  },
  lista: {
    flex: 1,
  },
  listaContent: {
    paddingBottom: 100,
  },
  resultadoCard: {
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
  resultadoHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  resultadoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resultadoNome: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    marginBottom: 4,
  },
  resultadoDescricao: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginBottom: 4,
  },
  resultadoLocalizacao: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#999",
  },
  resultadoPreco: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#4A7C59",
  },
  carregandoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  carregandoText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#666",
  },
  semResultadosContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  semResultadosText: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
  semResultadosSubtext: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
});

export default BuscaScreen;
