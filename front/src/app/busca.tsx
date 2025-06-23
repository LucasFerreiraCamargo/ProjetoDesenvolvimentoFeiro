import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useApp } from "../contexts/AppContext";

type ResultadoBusca = {
  id: string;
  tipo: "feira" | "produto" | "feirante" | "cesta";
  nome: string;
  descricao: string;
  localizacao?: string;
  preco?: string;
  imagem?: string;
  emoji?: string;
  desconto?: string;
};

const BuscaScreen = () => {
  const router = useRouter();
  const { q, categoria } = useLocalSearchParams();
  const termoBusca = Array.isArray(q) ? q[0] : q || "";
  const categoriaParam = Array.isArray(categoria)
    ? categoria[0]
    : categoria || "";
  const [resultados, setResultados] = useState<ResultadoBusca[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [textoBusca, setTextoBusca] = useState(termoBusca);

  const { state, getAllProdutos, getAllCestas } = useApp();

  // Mapeamento de IDs de categoria para nomes
  const categorias = {
    "1": "legumes",
    "2": "frutas",
    "3": "ovos",
    "4": "organicos",
    "5": "carnes",
    "6": "peixes",
    "7": "laticinios",
    "8": "graos",
  };

  // Expandir mapeamento para incluir categorias relacionadas
  const getCategoriasFiltro = (categoriaId: string) => {
    const mapeamento = {
      "1": ["legumes", "verduras"], // Legumes inclui verduras
      "2": ["frutas"],
      "3": ["ovos"],
      "4": ["organicos", "orgânicos"],
      "5": ["carnes"],
      "6": ["peixes"],
      "7": ["laticinios", "laticínios"],
      "8": ["graos", "grãos", "cereais"],
    };
    return mapeamento[categoriaId as keyof typeof mapeamento] || [];
  };

  useEffect(() => {
    if (categoriaParam === "promocoes") {
      carregarPromocoes();
    } else if (categoriaParam === "cestas") {
      carregarCestas();
    } else if (
      categoriaParam &&
      categorias[categoriaParam as keyof typeof categorias]
    ) {
      carregarPorCategoria(categoriaParam);
    } else if (termoBusca) {
      realizarBusca(termoBusca);
    }
  }, [termoBusca, categoriaParam]);

  const carregarPromocoes = () => {
    setCarregando(true);

    setTimeout(() => {
      const produtos = getAllProdutos();
      const promocoes = produtos.slice(0, 10).map((produto) => ({
        id: produto.id,
        tipo: "produto" as const,
        nome: produto.nome,
        descricao: `${
          produto.categoria || "Produto"
        } • R$ ${produto.preco.toFixed(2)}/${produto.unidade}`,
        preco: `R$ ${produto.preco.toFixed(2)}`,
        imagem: produto.imagem,
        emoji: produto.emoji,
        desconto: "15% OFF",
      }));

      setResultados(promocoes);
      setCarregando(false);
    }, 300);
  };

  const carregarCestas = () => {
    setCarregando(true);

    setTimeout(() => {
      const cestas = getAllCestas();
      const cestasFormatadas = cestas.map((cesta) => ({
        id: cesta.id,
        tipo: "cesta" as const,
        nome: cesta.nome,
        descricao: `${cesta.itens?.length || 0} itens • ${
          cesta.feira || cesta.feirante
        }`,
        preco: `R$ ${cesta.preco.toFixed(2)}`,
        imagem: cesta.imagem,
        emoji: cesta.emoji,
        desconto: cesta.desconto,
      }));

      setResultados(cestasFormatadas);
      setCarregando(false);
    }, 300);
  };

  const carregarPorCategoria = (categoriaId: string) => {
    setCarregando(true);
    console.log("Carregando categoria:", categoriaId);

    setTimeout(() => {
      const produtos = getAllProdutos();
      const categoriasFiltro = getCategoriasFiltro(categoriaId);

      console.log("Produtos encontrados:", produtos.length);
      console.log("Categorias filtro:", categoriasFiltro);
      console.log(
        "Produtos com categoria:",
        produtos.map((p) => ({
          id: p.id,
          nome: p.nome,
          categoria: p.categoria,
        }))
      );

      const produtosFiltrados = produtos
        .filter((produto) => {
          if (!produto.categoria) return false;
          const categoriaMinuscula = produto.categoria.toLowerCase();
          const match = categoriasFiltro.some(
            (cat) =>
              categoriaMinuscula === cat || categoriaMinuscula.includes(cat)
          );
          if (match)
            console.log("Produto encontrado:", produto.nome, produto.categoria);
          return match;
        })
        .map((produto) => ({
          id: produto.id,
          tipo: "produto" as const,
          nome: produto.nome,
          descricao: `${
            produto.categoria || "Produto"
          } • R$ ${produto.preco.toFixed(2)}/${produto.unidade}`,
          preco: `R$ ${produto.preco.toFixed(2)}`,
          imagem: produto.imagem,
          emoji: produto.emoji,
        }));

      console.log("Produtos filtrados final:", produtosFiltrados.length);
      setResultados(produtosFiltrados);
      setCarregando(false);
    }, 300);
  };

  const realizarBusca = (termo: string) => {
    setCarregando(true);

    setTimeout(() => {
      const produtos = getAllProdutos();
      const cestas = getAllCestas();

      let resultadosFiltrados: ResultadoBusca[] = [];

      // Buscar produtos
      const produtosFiltrados = produtos
        .filter(
          (produto) =>
            produto.nome.toLowerCase().includes(termo.toLowerCase()) ||
            produto.categoria?.toLowerCase().includes(termo.toLowerCase())
        )
        .map((produto) => ({
          id: produto.id,
          tipo: "produto" as const,
          nome: produto.nome,
          descricao: `${
            produto.categoria || "Produto"
          } • R$ ${produto.preco.toFixed(2)}/${produto.unidade}`,
          preco: `R$ ${produto.preco.toFixed(2)}`,
          imagem: produto.imagem,
          emoji: produto.emoji,
        }));

      // Buscar cestas
      const cestasFiltradas = cestas
        .filter((cesta) =>
          cesta.nome.toLowerCase().includes(termo.toLowerCase())
        )
        .map((cesta) => ({
          id: cesta.id,
          tipo: "cesta" as const,
          nome: cesta.nome,
          descricao: `${cesta.itens?.length || 0} itens • ${
            cesta.feira || cesta.feirante
          }`,
          preco: `R$ ${cesta.preco.toFixed(2)}`,
          imagem: cesta.imagem,
          emoji: cesta.emoji,
          desconto: cesta.desconto,
        }));

      // Buscar feiras
      const feiras = state.feiras
        .filter((feira) =>
          feira.nome.toLowerCase().includes(termo.toLowerCase())
        )
        .map((feira) => ({
          id: feira.id,
          tipo: "feira" as const,
          nome: feira.nome,
          descricao: `${feira.feirantes.length} feirantes • ${feira.status}`,
          emoji: "🏪",
        }));

      resultadosFiltrados = [
        ...produtosFiltrados,
        ...cestasFiltradas,
        ...feiras,
      ];
      setResultados(resultadosFiltrados);
      setCarregando(false);
    }, 300);
  };

  const handleNovaSearch = (texto: string) => {
    realizarBusca(texto);
  };

  const navegarParaItem = (item: ResultadoBusca) => {
    console.log("Navegando para item:", item);
    switch (item.tipo) {
      case "feira":
        router.push(`/feirantes/${item.id}`);
        break;
      case "produto":
        // Encontrar o feirante que tem esse produto
        let feiranteEncontrado = null;
        for (const feira of state.feiras) {
          for (const feirante of feira.feirantes) {
            if (feirante.produtos.some((p: any) => p.id === item.id)) {
              feiranteEncontrado = feirante;
              break;
            }
          }
          if (feiranteEncontrado) break;
        }

        if (feiranteEncontrado) {
          console.log("Feirante encontrado:", feiranteEncontrado.id);
          router.push(`/produtos/${feiranteEncontrado.id}`);
        } else {
          console.warn("Feirante não encontrado para produto:", item.id);
          // Fallback: navegar para primeira feira disponível
          const primeiraFeira = state.feiras.find(
            (f) => f.feirantes.length > 0
          );
          if (primeiraFeira) {
            router.push(`/produtos/${primeiraFeira.feirantes[0].id}`);
          }
        }
        break;
      case "cesta":
        router.push(`/cesta/${item.id}`);
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
      case "cesta":
        return "basket-outline";
      case "feirante":
        return "person-outline";
      default:
        return "search-outline";
    }
  };

  const getTituloCategoria = () => {
    if (categoriaParam === "promocoes") return "Promoções do Dia";
    if (categoriaParam === "cestas") return "Cestas em Oferta";

    // Mapear categorias por ID para nomes legíveis
    const titulosCategorias = {
      "1": "Legumes",
      "2": "Frutas",
      "3": "Ovos",
      "4": "Orgânicos",
      "5": "Carnes",
      "6": "Peixes",
      "7": "Laticínios",
      "8": "Grãos",
    };

    if (
      categoriaParam &&
      titulosCategorias[categoriaParam as keyof typeof titulosCategorias]
    ) {
      return titulosCategorias[
        categoriaParam as keyof typeof titulosCategorias
      ];
    }

    return "Resultados da Busca";
  };

  const renderResultado = ({ item }: { item: ResultadoBusca }) => (
    <TouchableOpacity
      style={styles.resultadoCard}
      onPress={() => navegarParaItem(item)}
    >
      <View style={styles.cardContent}>
        <View style={styles.imageContainer}>
          {item.imagem ? (
            <Image
              source={{ uri: item.imagem }}
              style={styles.itemImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.emojiContainer}>
              <Text style={styles.emoji}>{item.emoji || "🥬"}</Text>
            </View>
          )}
          {item.desconto && (
            <View style={styles.descontoTag}>
              <Text style={styles.descontoText}>{item.desconto}</Text>
            </View>
          )}
        </View>

        <View style={styles.resultadoInfo}>
          <Text style={styles.resultadoNome}>{item.nome}</Text>
          <Text style={styles.resultadoDescricao}>{item.descricao}</Text>
          {item.localizacao && (
            <Text style={styles.resultadoLocalizacao}>
              📍 {item.localizacao}
            </Text>
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
      {/* Cabeçalho da tela */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#2D5D31" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getTituloCategoria()}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Barra de busca */}
      {!categoriaParam && (
        <View style={styles.buscaContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.buscaInput}
            placeholder="Buscar feiras, produtos, feirantes..."
            value={textoBusca}
            onChangeText={setTextoBusca}
            onSubmitEditing={() => handleNovaSearch(textoBusca)}
          />
          {textoBusca.length > 0 && (
            <TouchableOpacity onPress={() => setTextoBusca("")}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Termo de busca */}
      {(termoBusca || categoriaParam) && (
        <View style={styles.termoBuscaContainer}>
          <Text style={styles.totalResultados}>
            {resultados.length} resultado{resultados.length !== 1 ? "s" : ""}{" "}
            encontrado{resultados.length !== 1 ? "s" : ""}
          </Text>
        </View>
      )}

      {/* Conteúdo */}
      {carregando ? (
        <View style={styles.carregandoContainer}>
          <Ionicons name="hourglass-outline" size={48} color="#255336" />
          <Text style={styles.carregandoText}>Carregando...</Text>
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
      ) : (
        <View style={styles.semResultadosContainer}>
          <Ionicons name="search-outline" size={48} color="#999" />
          <Text style={styles.semResultadosText}>
            {categoriaParam
              ? "Nenhum item encontrado nesta categoria"
              : textoBusca
              ? `Nenhum resultado encontrado para "${textoBusca}"`
              : "Digite algo para buscar"}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7E4",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#FFF7E4",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2D5D31",
  },
  buscaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buscaInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: "#333",
  },
  termoBuscaContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  termoBusca: {
    fontSize: 16,
    color: "#2D5D31",
    fontWeight: "600",
    marginBottom: 4,
  },
  totalResultados: {
    fontSize: 14,
    color: "#666",
  },
  carregandoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  carregandoText: {
    fontSize: 16,
    color: "#666",
  },
  lista: {
    flex: 1,
  },
  listaContent: {
    padding: 20,
    paddingBottom: 100,
  },
  resultadoCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  imageContainer: {
    position: "relative",
    marginRight: 16,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  emojiContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#F0F8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 28,
  },
  descontoTag: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#E74C3C",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  descontoText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  resultadoInfo: {
    flex: 1,
  },
  resultadoNome: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2D5D31",
    marginBottom: 4,
  },
  resultadoDescricao: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  resultadoLocalizacao: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  resultadoPreco: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4A7C59",
  },
  semResultadosContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 40,
  },
  semResultadosText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default BuscaScreen;
