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
import { useApp } from "../../contexts/AppContext";
import { useUser } from "../../contexts/UserContext";
import { feiranteAtendeCliente } from "../../utils/distancia";

// Base URL da API
const API_BASE =
  (process.env.EXPO_PUBLIC_API_URL as string) || "http://localhost:3001";

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
  // Para produtos: o id do feirante dono, usado para navegar
  feiranteId?: number | null;
};

// Estoque mínimo para o produto aparecer à venda (mesma regra da home)
function estaDisponivelParaVenda(m: any): boolean {
  const qtd = Number(m?.quantidade ?? 0);
  const min = Number(m?.estoque_minimo ?? 0);
  if (Number.isNaN(qtd) || qtd <= 0) return false;
  if (!Number.isNaN(min) && qtd < min) return false;
  return true;
}

// Converte uma Mercadoria da API para o formato de resultado de busca
function mercadoriaParaResultado(m: any): ResultadoBusca {
  const preco = Number(m.preco ?? 0);
  const pp =
    m.preco_promocional != null ? Number(m.preco_promocional) : null;
  const temPromo = pp != null && pp > 0 && pp < preco;
  const precoExibido = temPromo ? pp! : preco;
  const pctDesconto = temPromo
    ? Math.round(((preco - pp!) / preco) * 100)
    : null;

  return {
    id: String(m.id),
    tipo: "produto",
    nome: m.nome,
    descricao: `${m.categoria ?? "Produto"} • R$ ${precoExibido.toFixed(
      2
    )}/${String(m.unidade ?? "UN").toLowerCase()}`,
    preco: `R$ ${precoExibido.toFixed(2)}`,
    imagem: m.foto || undefined,
    emoji: m.emoji ?? undefined,
    desconto: pctDesconto != null ? `${pctDesconto}% OFF` : undefined,
    feiranteId: m.feirante_id ?? m.feirante?.id ?? null,
  };
}

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

  // Cache de mercadorias e cestas da API (puxados uma vez por sessão da tela)
  const [mercadoriasApi, setMercadoriasApi] = useState<any[]>([]);
  const [cestasApi, setCestasApi] = useState<any[]>([]);
  const [carregandoMercadorias, setCarregandoMercadorias] = useState(true);
  const [carregandoCestas, setCarregandoCestas] = useState(true);

  const { state } = useApp();
  const { user } = useUser();

  // Coordenadas do cliente (vindas do login). Usadas pelo filtro de proximidade.
  const clienteCoords = {
    latitude: user?.latitude ?? null,
    longitude: user?.longitude ?? null,
  };

  // IDs das categorias do menu (home) → valores do enum Categoria na API
  const getCategoriasFiltro = (categoriaId: string): string[] => {
    const mapeamento: Record<string, string[]> = {
      "1": ["LEGUMES", "VERDURAS"], // botão "Legumes" também inclui verduras
      "2": ["FRUTAS"],
      "3": ["OVOS"],
      "4": ["ORGANICOS"],
      "5": ["CARNES"],
      "6": ["PEIXES"],
      "7": ["LATICINIOS"],
      "8": ["GRAOS"],
    };
    return mapeamento[categoriaId] || [];
  };

  // Carrega mercadorias e cestas da API uma vez ao montar a tela
  useEffect(() => {
    let cancelado = false;

    async function carregarMercadorias() {
      try {
        const res = await fetch(
          `${API_BASE.replace(/\/$/, "")}/mercadorias`
        );
        if (!res.ok) {
          console.warn("[Busca] /mercadorias respondeu erro:", res.status);
          if (!cancelado) setMercadoriasApi([]);
          return;
        }
        const data = await res.json();
        if (!cancelado) {
          setMercadoriasApi(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("[Busca] Falha ao buscar mercadorias:", e);
        if (!cancelado) setMercadoriasApi([]);
      } finally {
        if (!cancelado) setCarregandoMercadorias(false);
      }
    }

    async function carregarCestasApi() {
      try {
        const res = await fetch(`${API_BASE.replace(/\/$/, "")}/cestas`);
        if (!res.ok) {
          console.warn("[Busca] /cestas respondeu erro:", res.status);
          if (!cancelado) setCestasApi([]);
          return;
        }
        const data = await res.json();
        if (!cancelado) {
          setCestasApi(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("[Busca] Falha ao buscar cestas:", e);
        if (!cancelado) setCestasApi([]);
      } finally {
        if (!cancelado) setCarregandoCestas(false);
      }
    }

    carregarMercadorias();
    carregarCestasApi();
    return () => {
      cancelado = true;
    };
  }, []);

  // Re-executa o filtro quando os caches chegarem ou o termo mudar
  useEffect(() => {
    if (carregandoMercadorias || carregandoCestas) return;
    if (categoriaParam === "promocoes") {
      carregarPromocoes();
    } else if (categoriaParam === "cestas") {
      carregarCestas();
    } else if (categoriaParam) {
      carregarPorCategoria(categoriaParam);
    } else if (termoBusca) {
      realizarBusca(termoBusca);
    } else {
      setResultados([]);
    }
  }, [
    termoBusca,
    categoriaParam,
    mercadoriasApi,
    cestasApi,
    carregandoMercadorias,
    carregandoCestas,
  ]);

  // Converte uma Cesta da API para o formato de resultado de busca
  function cestaParaResultado(c: any): ResultadoBusca {
    const preco = Number(c.preco ?? 0);
    return {
      id: String(c.id),
      tipo: "cesta",
      nome: c.nome,
      descricao: `${c.mercadorias?.length ?? 0} itens • ${
        c.feirante?.nome ?? "Feirante"
      }`,
      preco: `R$ ${preco.toFixed(2)}`,
      imagem: c.imagem || undefined,
      emoji: c.emoji || undefined,
      desconto: c.desconto || undefined,
    };
  }

  // ----------- Carregadores baseados nas mercadorias da API -----------

  // Aplica AMBOS os filtros: estoque suficiente E feirante atende o cliente.
  const produtosDisponiveis = () =>
    mercadoriasApi
      .filter(estaDisponivelParaVenda)
      .filter((m: any) => feiranteAtendeCliente(m?.feirante, clienteCoords));

  const carregarPromocoes = () => {
    setCarregando(true);
    // Só produtos com preco_promocional menor que o preço
    const promocoes = produtosDisponiveis()
      .filter((m) => {
        const pp = m.preco_promocional != null ? Number(m.preco_promocional) : null;
        return pp != null && pp > 0 && pp < Number(m.preco ?? 0);
      })
      .map(mercadoriaParaResultado);
    setResultados(promocoes);
    setCarregando(false);
  };

  const carregarCestas = () => {
    setCarregando(true);
    const cestasFormatadas = cestasApi
      .filter((c: any) => feiranteAtendeCliente(c?.feirante, clienteCoords))
      .map(cestaParaResultado);
    setResultados(cestasFormatadas);
    setCarregando(false);
  };

  const carregarPorCategoria = (categoriaId: string) => {
    setCarregando(true);
    const enumCategorias = getCategoriasFiltro(categoriaId);
    if (enumCategorias.length === 0) {
      setResultados([]);
      setCarregando(false);
      return;
    }
    const filtrados = produtosDisponiveis()
      .filter((m) => enumCategorias.includes(String(m.categoria ?? "")))
      .map(mercadoriaParaResultado);
    setResultados(filtrados);
    setCarregando(false);
  };

  const realizarBusca = (termo: string) => {
    setCarregando(true);
    const termoLow = termo.toLowerCase();

    // Produtos da API por nome ou categoria
    const produtosFiltrados = produtosDisponiveis()
      .filter(
        (m) =>
          String(m.nome ?? "").toLowerCase().includes(termoLow) ||
          String(m.categoria ?? "").toLowerCase().includes(termoLow)
      )
      .map(mercadoriaParaResultado);

    // Cestas (API) por nome + filtro de proximidade
    const cestasFiltradas: ResultadoBusca[] = cestasApi
      .filter((c) => String(c.nome ?? "").toLowerCase().includes(termoLow))
      .filter((c: any) => feiranteAtendeCliente(c?.feirante, clienteCoords))
      .map(cestaParaResultado);

    // Feiras (mock) por nome
    const feiras: ResultadoBusca[] = state.feiras
      .filter((f) => f.nome.toLowerCase().includes(termoLow))
      .map((feira) => ({
        id: feira.id,
        tipo: "feira",
        nome: feira.nome,
        descricao: `${feira.feirantes.length} feirantes • ${feira.status}`,
        emoji: "🏪",
      }));

    setResultados([...produtosFiltrados, ...cestasFiltradas, ...feiras]);
    setCarregando(false);
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
        // Caminho preferido: item da API já traz feiranteId
        if (item.feiranteId != null) {
          router.push(`/produtos/${item.feiranteId}`);
          return;
        }
        // Fallback no mock (caso o item venha de algum lugar antigo)
        let feiranteEncontrado: any = null;
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
          router.push(`/produtos/${feiranteEncontrado.id}`);
        } else {
          console.warn("Feirante não encontrado para produto:", item.id);
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
