import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useApp } from "../../contexts/AppContext";
import { useUser } from "../../contexts/UserContext";
import { feiranteAtendeCliente } from "../../utils/distancia";
import { mercadoriasService } from "../../services/mercadorias";
import { cestasService } from "../../services/cestas";
import type { Cesta, Mercadoria } from "../../types/api";

// Placeholders quando não há foto cadastrada (estilo iFood)
const IMAGEM_PADRAO_CESTA = require("../../../assets/images/cesta-padrao.png");
const IMAGEM_PADRAO_PRODUTO = require("../../../assets/images/produto-padrao.png");

/**
 * Decide se uma mercadoria está disponível para venda.
 * Regras:
 *  - precisa ter alguma unidade em estoque (`quantidade > 0`)
 *  - precisa estar no mínimo de estoque definido pelo feirante (`quantidade >= estoque_minimo`)
 */
function estaDisponivelParaVenda(m: any): boolean {
  const qtd = Number(m?.quantidade ?? 0);
  const min = Number(m?.estoque_minimo ?? 0);
  if (Number.isNaN(qtd) || qtd <= 0) return false;
  if (!Number.isNaN(min) && qtd < min) return false;
  return true;
}

const { width } = Dimensions.get("window");

// --- Dados Mock ---
const banners = [
  {
    id: "1",
    imagem: require("../../../assets/images/banner.png"),
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
        source={item.imagem ? { uri: item.imagem } : IMAGEM_PADRAO_CESTA}
        style={styles.cestaImage}
        resizeMode="cover"
      />
      {item.desconto ? (
        <View style={styles.cestaDesconto}>
          <Text style={styles.cestaDescontoText}>{item.desconto}</Text>
        </View>
      ) : null}
    </View>

    <View style={styles.cestaContent}>
      <Text style={styles.cestaNome} numberOfLines={1}>
        {item.nome}
      </Text>
      <Text style={styles.cestaItens}>
        {item.itens?.length ? `${item.itens.length} itens` : "Vários produtos"}
      </Text>

      <View style={styles.cestaPrecoContainer}>
        <Text style={styles.cestaPreco}>
          R$ {Number(item.preco ?? 0).toFixed(2)}
        </Text>
        {item.precoAntigo && (
          <Text style={styles.cestaPrecoAntigo}>
            R$ {Number(item.precoAntigo).toFixed(2)}
          </Text>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

const CardProduto = ({ item }: { item: any }) => {
  const { state } = useApp();

  const navegarParaProduto = () => {
    // Passa `destaque=item.id` pra tela do feirante posicionar o produto
    // que o cliente clicou no TOPO da lista (mesmo padrão usado na busca
    // e nas categorias — comportamento agora consistente).
    // Caminho preferido: produto vindo da API já traz feiranteId.
    if (item.feiranteId != null) {
      router.push({
        pathname: "/produtos/[feirante]",
        params: {
          feirante: String(item.feiranteId),
          destaque: String(item.id),
        },
      });
      return;
    }

    // Fallback: procura no estado mock (cestas/itens que ainda vêm dali)
    let feiranteEncontrado = null;
    for (const feira of state.feiras) {
      for (const feirante of feira.feirantes) {
        const produtoExiste = feirante.produtos.some(
          (p: any) => p.id === item.id
        );
        if (produtoExiste) {
          feiranteEncontrado = feirante;
          break;
        }
      }
      if (feiranteEncontrado) break;
    }
    if (feiranteEncontrado) {
      router.push({
        pathname: "/produtos/[feirante]",
        params: {
          feirante: String(feiranteEncontrado.id),
          destaque: String(item.id),
        },
      });
    } else {
      console.warn("Feirante não encontrado para produto:", item.id);
    }
  };

  // Desconto real (só aparece se houver precoOriginal e for maior que o preço atual)
  const temPromocao =
    item.precoOriginal != null && Number(item.precoOriginal) > Number(item.preco);
  const pctDesconto = temPromocao
    ? Math.round(
        ((Number(item.precoOriginal) - Number(item.preco)) /
          Number(item.precoOriginal)) *
          100
      )
    : null;

  return (
    <TouchableOpacity style={styles.cardProduto} onPress={navegarParaProduto}>
      <View style={styles.cardImgContainer}>
        <Image
          source={item.imagem ? { uri: item.imagem } : IMAGEM_PADRAO_PRODUTO}
          style={styles.cardImage}
          resizeMode="cover"
        />
        {temPromocao && (
          <View style={styles.cardDesconto}>
            <Text style={styles.cardDescontoText}>-{pctDesconto}%</Text>
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardNome} numberOfLines={2}>
          {item.nome}
        </Text>

        <Text style={styles.cardUnidade}>Por {item.unidade}</Text>

        <View style={styles.cardPrecoContainer}>
          <Text style={styles.cardPreco}>R$ {Number(item.preco).toFixed(2)}</Text>
          {temPromocao && (
            <Text style={styles.cardPrecoAntigo}>
              R$ {Number(item.precoOriginal).toFixed(2)}
            </Text>
          )}
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

// Mapeia uma Mercadoria da API para o formato que CardProduto espera.
function mapMercadoriaParaCard(m: any) {
  const preco = Number(m.preco ?? 0);
  const precoPromocional =
    m.preco_promocional != null ? Number(m.preco_promocional) : null;
  const precoExibido =
    precoPromocional != null && precoPromocional > 0 && precoPromocional < preco
      ? precoPromocional
      : preco;
  const precoOriginal =
    precoPromocional != null && precoPromocional > 0 && precoPromocional < preco
      ? preco
      : null;

  return {
    id: String(m.id),
    nome: m.nome,
    preco: precoExibido,
    precoOriginal,
    unidade: String(m.unidade ?? "UN").toLowerCase(),
    estoque: Number(m.quantidade ?? 0),
    imagem: m.foto || "",
    emoji: m.emoji ?? null,
    categoria: m.categoria,
    feiranteId: m.feirante_id ?? m.feirante?.id ?? null,
    feiranteNome: m.feirante?.nome ?? null,
  };
}

// Mapeia uma Cesta da API para o formato que CardCesta espera
function mapCestaParaCard(c: any) {
  if (!c || c.id == null) return null;
  return {
    id: String(c.id),
    nome: c.nome ?? "Cesta",
    preco: Number(c.preco ?? 0),
    desconto: c.desconto ?? undefined,
    imagem: c.imagem || "",
    emoji: c.emoji || undefined,
    feirante: c.feirante?.nome ?? "Feirante",
    banca: c.feirante?.banca ?? "",
    feira: c.feirante?.feira?.nome ?? "",
    itens: Array.isArray(c.mercadorias) ? c.mercadorias : [],
  };
}

// --- Tela Principal ---
export default function HomeScreen() {
  const { state, getAllProdutos } = useApp();
  const { user, enderecoAtual, enderecos } = useUser();

  // Produtos reais da API (substitui o mock para "Promoções do Dia")
  const [produtosApi, setProdutosApi] = useState<any[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  // Quando o usuário tem endereço geocodificado, aplicamos filtro por raio
  const [filtradoPorRaio, setFiltradoPorRaio] = useState(false);

  // Cestas reais da API (substitui o mock para "Cestas em Oferta")
  const [cestasApi, setCestasApi] = useState<any[]>([]);
  const [loadingCestas, setLoadingCestas] = useState(true);

  // Cliente é "geolocalizável" quando o endereço selecionado tem coords.
  const clienteTemCoordenadas =
    enderecoAtual?.latitude != null && enderecoAtual?.longitude != null;

  useEffect(() => {
    // Um único controller cancela as duas cargas quando a tela é desmontada
    // (ex.: logout). `signal.aborted` distingue cancelamento (esperado) de
    // falha real da rede/servidor.
    const controller = new AbortController();
    let cancelado = false;
    async function carregarMercadorias() {
      try {
        const lista = await mercadoriasService.listar({ signal: controller.signal });

        const disponiveis = lista
          .filter(estaDisponivelParaVenda)
          .filter((m: Mercadoria) =>
            feiranteAtendeCliente(m?.feirante, {
              latitude: enderecoAtual?.latitude ?? null,
              longitude: enderecoAtual?.longitude ?? null,
            })
          )
          .map(mapMercadoriaParaCard);
        if (!cancelado) {
          setProdutosApi(disponiveis);
          setFiltradoPorRaio(clienteTemCoordenadas);
        }
      } catch (e) {
        // Cancelamento por saída de tela/logout não é erro — ignora em silêncio.
        if (controller.signal.aborted) return;
        console.error("[Home] Falha ao buscar mercadorias:", e);
        if (!cancelado) setProdutosApi([]);
      } finally {
        if (!cancelado) setLoadingProdutos(false);
      }
    }

    async function carregarCestas() {
      try {
        const lista = await cestasService.listar({ signal: controller.signal });
        if (!cancelado) {
          const mapeadas = lista
            .filter((c: Cesta) =>
              feiranteAtendeCliente(c?.feirante, {
                latitude: enderecoAtual?.latitude ?? null,
                longitude: enderecoAtual?.longitude ?? null,
              })
            )
            .map(mapCestaParaCard)
            .filter((x): x is NonNullable<typeof x> => x != null);
          setCestasApi(mapeadas);
        }
      } catch (e) {
        // Cancelamento por saída de tela/logout não é erro — ignora em silêncio.
        if (controller.signal.aborted) return;
        console.error("[Home] Falha ao buscar cestas:", e);
        if (!cancelado) setCestasApi([]);
      } finally {
        if (!cancelado) setLoadingCestas(false);
      }
    }

    carregarMercadorias();
    carregarCestas();
    return () => {
      cancelado = true;
      controller.abort(); // cancela requests em voo ao sair/deslogar
    };
    // Re-roda quando o endereço selecionado muda (ex.: trocou no dropdown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enderecoAtual?.latitude, enderecoAtual?.longitude]);

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

  // Promoções do Dia: produtos REAIS da API, priorizando os que estão em promoção
  const promocoes = (() => {
    const emPromo = produtosApi.filter((p) => p.precoOriginal != null);
    const restantes = produtosApi.filter((p) => p.precoOriginal == null);
    return [...emPromo, ...restantes].slice(0, 10);
  })();

  const cestas = cestasApi.slice(0, 3); // Cestas reais da API
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

        {/* Aviso de endereço. Dois casos distintos:
            1. Sem NENHUM endereço → pede para cadastrar.
            2. Tem endereço, mas sem coordenadas (geocoding não resolveu) →
               não pede para "cadastrar" (isso confunde: o endereço existe),
               só avisa que o filtro por região está indisponível. */}
        {user && enderecos.length === 0 ? (
          <TouchableOpacity
            style={styles.avisoEndereco}
            onPress={() => router.push("/perfil")}
            activeOpacity={0.85}
          >
            <Ionicons name="location-outline" size={20} color="#92400E" />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.avisoEnderecoTitulo}>
                Cadastre seu endereço
              </Text>
              <Text style={styles.avisoEnderecoTexto}>
                Para ver só os produtos que entregam na sua região, cadastre seu
                endereço no perfil.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#92400E" />
          </TouchableOpacity>
        ) : user && !clienteTemCoordenadas ? (
          <TouchableOpacity
            style={styles.avisoEndereco}
            onPress={() =>
              router.push({
                pathname: "/perfil/enderecos/[id]",
                params: { id: String(enderecoAtual?.id ?? "novo") },
              })
            }
            activeOpacity={0.85}
          >
            <Ionicons name="navigate-outline" size={20} color="#92400E" />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.avisoEnderecoTitulo}>
                Endereço sem localização no mapa
              </Text>
              <Text style={styles.avisoEnderecoTexto}>
                Não conseguimos localizar seu endereço. Mostrando todos os
                produtos — toque para revisar e reprocessar.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#92400E" />
          </TouchableOpacity>
        ) : null}

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
          {loadingProdutos ? (
            <ActivityIndicator
              size="small"
              color="#255336"
              style={{ marginVertical: 20 }}
            />
          ) : promocoes.length === 0 ? (
            <Text style={styles.vazioTexto}>
              {filtradoPorRaio
                ? "Nenhum feirante está atendendo na sua região no momento."
                : "Nenhum produto disponível no momento."}
            </Text>
          ) : (
            <FlatList
              data={promocoes}
              renderItem={({ item }) => <CardProduto item={item} />}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          )}
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
          {loadingCestas ? (
            <ActivityIndicator
              size="small"
              color="#255336"
              style={{ marginVertical: 20 }}
            />
          ) : cestas.length === 0 ? (
            <Text style={styles.vazioTexto}>
              Nenhuma cesta disponível no momento.
            </Text>
          ) : (
            <FlatList
              data={cestas}
              renderItem={({ item }) => <CardCesta item={item} />}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          )}
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
  vazioTexto: {
    fontSize: 13,
    color: "#999999",
    fontStyle: "italic",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  avisoEndereco: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#FEF3C7",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  avisoEnderecoTitulo: {
    color: "#92400E",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  avisoEnderecoTexto: {
    color: "#92400E",
    fontSize: 12,
    lineHeight: 16,
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
