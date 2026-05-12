import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useApp } from "../../contexts/AppContext";
import { useCesta } from "../../contexts/CestaContext";

const categorias = ["Todos", "Frutas", "Verduras", "Legumes"];

// Base URL da API
const API_BASE =
  (process.env.EXPO_PUBLIC_API_URL as string) || "http://localhost:3001";

// Filtro de disponibilidade (mesmo padrão da home/busca)
function estaDisponivelParaVenda(m: any): boolean {
  const qtd = Number(m?.quantidade ?? 0);
  const min = Number(m?.estoque_minimo ?? 0);
  if (Number.isNaN(qtd) || qtd <= 0) return false;
  if (!Number.isNaN(min) && qtd < min) return false;
  return true;
}

// Converte uma Mercadoria da API para o formato esperado pelo JSX desta tela.
function mapMercadoriaParaProduto(m: any) {
  const preco = Number(m.preco ?? 0);
  const pp = m.preco_promocional != null ? Number(m.preco_promocional) : null;
  const temPromo = pp != null && pp > 0 && pp < preco;
  return {
    id: String(m.id),
    nome: m.nome,
    preco: temPromo ? pp! : preco,
    precoOriginal: temPromo ? preco : null,
    unidade: String(m.unidade ?? "UN").toLowerCase(),
    estoque: Number(m.quantidade ?? 0),
    imagem: m.foto || "",
    emoji: m.emoji ?? null,
    categoria: String(m.categoria ?? "").toLowerCase(),
    quantidade: 0,
    destaque: !!m.destaque,
  };
}

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

export default function ProdutosFeiranteScreen() {
  const { feirante: feiranteParam } = useLocalSearchParams();
  const feiranteId = Array.isArray(feiranteParam)
    ? feiranteParam[0]
    : feiranteParam;

  // Contextos
  const { state, getFeirante, getFeira, getAllProdutos } = useApp();
  const {
    state: cestaState,
    adicionarItem,
    atualizarQuantidade,
    getTotalItens,
  } = useCesta();

  // Estado real (vindo da API)
  const [feirante, setFeirante] = useState<any | null>(null);
  const [feira, setFeira] = useState<any | null>(null);
  const [produtosFeirante, setProdutosFeirante] = useState<any[]>([]);
  const [loadingFeirante, setLoadingFeirante] = useState(true);
  const [feiranteNaoEncontrado, setFeiranteNaoEncontrado] = useState(false);

  // Carrega feirante + mercadorias da API ao montar/mudar de feirante
  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      if (!feiranteId) {
        setLoadingFeirante(false);
        setFeiranteNaoEncontrado(true);
        return;
      }
      setLoadingFeirante(true);
      setFeiranteNaoEncontrado(false);

      try {
        // 1) Busca o feirante (já vem com `feira` incluída pela API)
        const resF = await fetch(
          `${API_BASE.replace(/\/$/, "")}/feirantes/${feiranteId}`
        );
        if (resF.status === 404) {
          console.warn("[Produtos] feirante 404:", feiranteId);
          if (!cancelado) setFeiranteNaoEncontrado(true);
          return;
        }
        if (!resF.ok) {
          console.warn("[Produtos] /feirantes/:id erro:", resF.status);
          if (!cancelado) setFeiranteNaoEncontrado(true);
          return;
        }
        const dataF = await resF.json();
        if (!dataF || dataF.id == null) {
          if (!cancelado) setFeiranteNaoEncontrado(true);
          return;
        }

        // 2) Busca as mercadorias desse feirante
        const resM = await fetch(
          `${API_BASE.replace(/\/$/, "")}/mercadorias/feirantes/${dataF.id}`
        );
        const dataM = resM.ok ? await resM.json() : [];
        const mercadorias = Array.isArray(dataM) ? dataM : [];
        // Cliente só vê mercadorias com estoque adequado
        const disponiveis = mercadorias
          .filter(estaDisponivelParaVenda)
          .map(mapMercadoriaParaProduto);

        if (cancelado) return;
        setFeirante({
          ...dataF,
          // shape compatível com o que o JSX espera
          produtos: disponiveis,
          // mantém os campos exibidos pelo header
          avatar: dataF.avatar || dataF.foto || null,
          status: dataF.status ?? "Aberto",
        });
        // Se o feirante não tem feira associada, usa stub para evitar checks NULL
        // espalhados pela tela. ID 0 indica "sem feira" e nome vazio.
        setFeira(
          dataF.feira ?? { id: 0, nome: "Sem feira associada" }
        );
        setProdutosFeirante(disponiveis);
      } catch (e) {
        console.error("[Produtos] Falha ao buscar feirante/mercadorias:", e);
        if (!cancelado) setFeiranteNaoEncontrado(true);
      } finally {
        if (!cancelado) setLoadingFeirante(false);
      }
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, [feiranteId]);

  // Estado local
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");
  const [weightQuantities, setWeightQuantities] = useState<{
    [key: string]: number;
  }>({});
  const [customInput, setCustomInput] = useState<{ [key: string]: string }>({});
  const [selectedUnits, setSelectedUnits] = useState<{ [key: string]: string }>(
    {}
  );
  const [selectedMaturation, setSelectedMaturation] = useState<{
    [key: string]: string;
  }>({});
  const [selectedQuantityType, setSelectedQuantityType] = useState<{
    [key: string]: "peso" | "unidade";
  }>({});
  const [unitQuantities, setUnitQuantities] = useState<{
    [key: string]: number;
  }>({});

  // Opções de maturação
  const maturationOptions = ["Maduro", "Ao Ponto", "Verde"];

  // Lista de produtos em promoção (IDs) — agora derivada das mercadorias reais do feirante
  const promocoesIds = produtosFeirante
    .filter((p: any) => p.precoOriginal != null)
    .map((p: any) => p.id);

  // Filtrar produtos
  const produtosFiltrados = useMemo(() => {
    if (!produtosFeirante.length) return [];
    return produtosFeirante.filter((produto: any) => {
      const matchBusca = produto.nome
        .toLowerCase()
        .includes(busca.toLowerCase());
      const matchCategoria =
        categoriaAtiva === "Todos" ||
        produto.categoria?.toLowerCase() === categoriaAtiva.toLowerCase();

      return matchBusca && matchCategoria;
    });
  }, [produtosFeirante, busca, categoriaAtiva]);

  // Produtos no carrinho do feirante atual
  // (normaliza para string porque feiranteId da URL é string e feirante.id da API é number)
  const produtosNoCarrinho = cestaState.itens.filter(
    (item) => String(item.feiranteId) === String(feiranteId)
  );

  // Funções de utilidade simplificadas
  const isWeightUnit = (unidade: string) => {
    return ["kg", "grama", "g"].includes(unidade.toLowerCase());
  };

  // Adicionar produto por unidade diretamente ao carrinho
  const addUnitProduct = (produto: any) => {
    const maturation = selectedMaturation[produto.id];
    if (!maturation) {
      Alert.alert("Atenção", "Selecione o ponto de maturação desejado");
      return;
    }

    if (produto && feirante && feira) {
      const currentPrice = getCurrentPrice(produto, "unidade");
      const currentUnit = getCurrentUnit(produto);

      adicionarItem({
        produtoId: produto.id,
        feiranteId: feirante.id,
        feiraId: feira.id,
        nome: `${produto.nome} (${maturation})`,
        preco: currentPrice,
        unidade: "unid",
        quantidade: 1,
        imagem: produtoImages[produto.id] || produto.imagem,
        emoji: produto.emoji,
        feiranteNome: feirante.nome,
        feiranteBanca: feirante.banca,
        feiraNome: feira.nome,
      });

      // Resetar seleção de maturação
      setSelectedMaturation((prev) => ({ ...prev, [produto.id]: "" }));
    }
  };

  // Adicionar múltiplas unidades de uma vez só
  const addMultipleUnits = (produto: any, quantity: number) => {
    const maturation = selectedMaturation[produto.id];
    if (!maturation) {
      Alert.alert("Atenção", "Selecione o ponto de maturação desejado");
      return;
    }

    if (produto && feirante && feira) {
      const currentPrice = getCurrentPrice(produto, "unidade");
      const currentUnit = getCurrentUnit(produto);

      adicionarItem({
        produtoId: produto.id,
        feiranteId: feirante.id,
        feiraId: feira.id,
        nome: `${produto.nome} (${maturation})`,
        preco: currentPrice,
        unidade: "unid",
        quantidade: quantity,
        imagem: produtoImages[produto.id] || produto.imagem,
        emoji: produto.emoji,
        feiranteNome: feirante.nome,
        feiranteBanca: feirante.banca,
        feiraNome: feira.nome,
      });

      Alert.alert(
        "Adicionado!",
        `${quantity} ${produto.nome} (${maturation}) ${
          quantity > 1 ? "adicionados" : "adicionado"
        } à cesta!`
      );

      // Resetar seleção de maturação
      setSelectedMaturation((prev) => ({ ...prev, [produto.id]: "" }));
    }
  };

  // Adicionar produto por peso ao carrinho
  const addWeightProduct = (produto: any, gramas: number) => {
    const maturation = selectedMaturation[produto.id];
    if (!maturation) {
      Alert.alert("Atenção", "Selecione o ponto de maturação desejado");
      return;
    }

    if (gramas <= 0) {
      Alert.alert("Atenção", "Selecione uma quantidade válida");
      return;
    }

    if (produto && feirante && feira) {
      const preco = getCurrentPrice(produto, "peso");

      adicionarItem({
        produtoId: produto.id,
        feiranteId: feirante.id,
        feiraId: feira.id,
        nome: `${produto.nome} (${maturation})`,
        preco: preco,
        unidade: "g",
        quantidade: gramas,
        imagem: produtoImages[produto.id] || produto.imagem,
        emoji: produto.emoji,
        feiranteNome: feirante.nome,
        feiranteBanca: feirante.banca,
        feiraNome: feira.nome,
      });

      // Resetar seleção
      setWeightQuantities((prev) => ({ ...prev, [produto.id]: 0 }));
      setCustomInput((prev) => ({ ...prev, [produto.id]: "" }));
      setSelectedMaturation((prev) => ({ ...prev, [produto.id]: "" }));

      Alert.alert(
        "Adicionado!",
        `${gramas}g de ${produto.nome} (${maturation}) adicionado à cesta!`
      );
    }
  };

  // Selecionar quantidade rápida para produtos por peso
  const selectQuickQuantity = (produtoId: string, gramas: number) => {
    setWeightQuantities((prev) => ({ ...prev, [produtoId]: gramas }));
    setCustomInput((prev) => ({ ...prev, [produtoId]: gramas.toString() }));
  };

  // Atualizar input customizado
  const updateCustomInput = (produtoId: string, value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, "");
    setCustomInput((prev) => ({ ...prev, [produtoId]: cleanValue }));

    const numValue = parseInt(cleanValue) || 0;
    setWeightQuantities((prev) => ({ ...prev, [produtoId]: numValue }));
  };

  // Alternar entre unidades disponíveis
  const toggleUnit = (produtoId: string, produto: any) => {
    if (!produto.unidades || produto.unidades.length <= 1) return;

    const currentUnit = selectedUnits[produtoId] || produto.unidade;
    const currentIndex = produto.unidades.findIndex(
      (u: any) => u.tipo === currentUnit
    );
    const nextIndex = (currentIndex + 1) % produto.unidades.length;
    const nextUnit = produto.unidades[nextIndex].tipo;

    setSelectedUnits((prev) => ({ ...prev, [produtoId]: nextUnit }));
  };

  // Funções helper para preços e unidades
  const getCurrentPrice = (produto: any, forceQuantityType?: string) => {
    const currentQuantityType =
      forceQuantityType || selectedQuantityType[produto.id] || "unidade";

    // Se tem diferentes unidades definidas no produto
    const selectedUnit = selectedUnits[produto.id] || produto.unidade;
    const unitData = produto.unidades?.find(
      (u: any) => u.tipo === selectedUnit
    );

    // Preço base do produto
    const basePrice = unitData ? unitData.preco : produto.preco;

    // Se está vendendo por peso, usar o preço base (por kg)
    if (currentQuantityType === "peso") {
      return basePrice;
    }

    // Se está vendendo por unidade, calcular preço por unidade
    // Assumindo peso médio de 150g por unidade para frutas/legumes
    const averageWeightInKg = 0.15; // 150g
    return basePrice * averageWeightInKg;
  };

  const getCurrentUnit = (produto: any) => {
    return selectedUnits[produto.id] || produto.unidade;
  };

  // Verificar se produto pode ser vendido por peso
  const canSellByWeight = (produto: any) => {
    // Produtos que NÃO podem ser vendidos por peso (apenas por unidade)
    const unitOnlyProducts = ["alface", "acelga", "rúcula", "agrião", "couve"];

    // Produtos que tipicamente podem ser vendidos por peso
    const weightProducts = [
      "tomate",
      "batata",
      "cebola",
      "cenoura",
      "banana",
      "maçã",
      "laranja",
      "morango",
    ];

    const nome = produto.nome?.toLowerCase() || "";

    // Se está na lista de produtos que só vendem por unidade, retorna false
    if (unitOnlyProducts.some((p) => nome.includes(p))) {
      return false;
    }

    // Se tem flag específica ou está na lista de produtos que podem ser vendidos por peso
    return (
      weightProducts.some((p) => nome.includes(p)) ||
      produto.vendaPorPeso === true
    );
  };

  const isProductInPromotion = (produto: any) => {
    return promocoesIds.includes(produto.id);
  };

  // Função para remover item do carrinho
  const removerDoCarrinho = (itemId: string) => {
    Alert.alert(
      "Remover item",
      "Deseja realmente remover este item da cesta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => {
            atualizarQuantidade(itemId, 0);
          },
        },
      ]
    );
  };

  // Função para abrir WhatsApp
  const abrirWhatsApp = () => {
    const telefone = feirante?.telefone || "5511999999999";
    const mensagem = `Olá ${feirante?.nome}! Gostaria de saber mais sobre seus produtos.`;
    const url = `whatsapp://send?phone=${telefone}&text=${encodeURIComponent(
      mensagem
    )}`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert("Erro", "WhatsApp não está instalado no seu dispositivo");
      }
    });
  };

  if (loadingFeirante) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#2D5D31" />
          </TouchableOpacity>
          <Text style={styles.title}>Carregando...</Text>
          <View style={{ width: 24 }} />
        </View>
        <ActivityIndicator
          size="large"
          color="#255336"
          style={{ marginTop: 40 }}
        />
      </View>
    );
  }

  if (!feirante || feiranteNaoEncontrado) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#2D5D31" />
          </TouchableOpacity>
          <Text style={styles.title}>Feirante não encontrado</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header com voltar */}
        <View style={styles.internalHeader}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#2D5D31" />
          </TouchableOpacity>
          <Text style={styles.title}>Produtos</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Bloco do Feirante */}
        <View style={styles.feiranteBlock}>
          <View style={styles.feiranteInfoContainer}>
            <View style={{ marginRight: 15 }}>
              <Image
                source={{
                  uri:
                    feirante.avatar ||
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
                }}
                style={{ width: 60, height: 60, borderRadius: 30 }}
                resizeMode="cover"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: "#2D5D31",
                  marginBottom: 4,
                }}
              >
                {feirante.nome}
              </Text>
              <Text style={{ fontSize: 14, color: "#666", marginBottom: 4 }}>
                {feirante.banca}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: "#4CAF50",
                    borderRadius: 4,
                    marginRight: 6,
                  }}
                />
                <Text
                  style={{ fontSize: 12, color: "#4CAF50", fontWeight: "500" }}
                >
                  {feirante.status}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text
                  style={{
                    fontSize: 12,
                    color: "#666",
                    marginLeft: 4,
                    marginRight: 2,
                  }}
                >
                  {feirante.avaliacao}
                </Text>
                <Text style={{ fontSize: 12, color: "#999" }}>
                  ({feirante.totalAvaliacoes})
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.whatsappButton}
              onPress={abrirWhatsApp}
            >
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Busca */}
        <View style={styles.buscaContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar produtos..."
              value={busca}
              onChangeText={setBusca}
            />
          </View>
        </View>

        {/* Categorias */}
        <View style={styles.categoriasContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriasList}
          >
            {categorias.map((categoria) => (
              <TouchableOpacity
                key={categoria}
                style={[
                  styles.categoriaButton,
                  categoriaAtiva === categoria && styles.categoriaButtonActive,
                ]}
                onPress={() => setCategoriaAtiva(categoria)}
              >
                <Text
                  style={[
                    styles.categoriaText,
                    categoriaAtiva === categoria && styles.categoriaTextActive,
                  ]}
                >
                  {categoria}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Carrinho (se houver itens) - Movido para o topo */}
        {produtosNoCarrinho.length > 0 && (
          <View style={styles.carrinhoSection}>
            <Text style={styles.carrinhoTitle}>Sua Cesta</Text>
            <View style={styles.carrinhoContainer}>
              {produtosNoCarrinho.map((item: any) => (
                <View key={item.id} style={styles.carrinhoCard}>
                  <View style={styles.carrinhoCardHeader}>
                    <View style={styles.carrinhoImageContainer}>
                      <Image
                        source={{
                          uri: produtoImages[item.produtoId] || item.imagem,
                        }}
                        style={styles.carrinhoImagem}
                        resizeMode="cover"
                      />
                    </View>

                    <View style={styles.carrinhoInfo}>
                      <Text style={styles.carrinhoNome}>{item.nome}</Text>
                      <View style={styles.carrinhoPrecoContainer}>
                        <Text style={styles.carrinhoPreco}>
                          R$ {item.preco.toFixed(2)}
                        </Text>
                        <Text style={styles.carrinhoUnidade}>
                          /{item.unidade === "g" ? "kg" : "unid"}
                        </Text>
                      </View>
                      <View style={styles.carrinhoQuantidadeInfo}>
                        <Text style={styles.carrinhoQuantidadeText}>
                          Qtd: {item.quantidade}
                          {item.unidade === "g" ? "g" : ""}
                        </Text>
                        <Text style={styles.carrinhoTotal}>
                          R${" "}
                          {item.unidade === "g"
                            ? ((item.preco * item.quantidade) / 1000).toFixed(2)
                            : (item.preco * item.quantidade).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.carrinhoControls}>
                    <TouchableOpacity
                      style={styles.carrinhoButton}
                      onPress={() =>
                        atualizarQuantidade(item.id, item.quantidade - 1)
                      }
                    >
                      <Ionicons name="remove" size={16} color="#2D5D31" />
                    </TouchableOpacity>

                    <View style={styles.carrinhoQuantidadeDisplay}>
                      <Text style={styles.carrinhoQuantidadeNumero}>
                        {item.quantidade}
                        {item.unidade === "g" ? "g" : ""}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.carrinhoButton}
                      onPress={() =>
                        atualizarQuantidade(item.id, item.quantidade + 1)
                      }
                    >
                      <Ionicons name="add" size={16} color="#2D5D31" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.carrinhoTrashButton}
                      onPress={() => removerDoCarrinho(item.id)}
                    >
                      <Ionicons name="trash" size={16} color="#E74C3C" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Lista de produtos */}
        <View style={styles.produtosContainer}>
          {produtosFiltrados.map((produto: any) => {
            const isPromotion = isProductInPromotion(produto);
            const currentPrice = getCurrentPrice(produto);
            const currentUnit = getCurrentUnit(produto);
            const canChangeUnit =
              produto.unidades && produto.unidades.length > 1;
            const maturation = selectedMaturation[produto.id] || "";
            // Definir tipo de quantidade baseado na unidade padrão ou seleção do usuário
            const quantityType = selectedQuantityType[produto.id] || "unidade";
            const productCanSellByWeight = canSellByWeight(produto);

            return (
              <View key={produto.id} style={styles.produtoCard}>
                {/* Tag de promoção */}
                {isPromotion && (
                  <View style={styles.promocaoTag}>
                    <Text style={styles.promocaoText}>PROMOÇÃO</Text>
                  </View>
                )}

                <View style={styles.produtoHeader}>
                  <View style={styles.produtoImageContainer}>
                    <Image
                      source={{
                        uri: produtoImages[produto.id] || produto.imagem,
                      }}
                      style={styles.produtoImagem}
                      resizeMode="cover"
                    />
                  </View>

                  <View style={styles.produtoInfo}>
                    <Text style={styles.produtoNome}>{produto.nome}</Text>
                    <View style={styles.precoContainer}>
                      <Text style={styles.produtoPreco}>
                        R$ {getCurrentPrice(produto, quantityType).toFixed(2)}
                      </Text>
                      <Text style={styles.unidadeText}>
                        /{quantityType === "peso" ? "kg" : "unid"}
                      </Text>
                    </View>
                    <Text style={styles.estoqueInfo}>
                      {produto.estoque} disponíveis
                    </Text>
                  </View>
                </View>

                {/* Seleção de maturação */}
                <View style={styles.maturationContainer}>
                  <Text style={styles.maturationLabel}>
                    Ponto de maturação: *
                  </Text>
                  <View style={styles.maturationOptions}>
                    {maturationOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.maturationButton,
                          maturation === option &&
                            styles.maturationButtonActive,
                        ]}
                        onPress={() =>
                          setSelectedMaturation((prev) => ({
                            ...prev,
                            [produto.id]: option,
                          }))
                        }
                      >
                        <View
                          style={[
                            styles.maturationRadio,
                            maturation === option &&
                              styles.maturationRadioActive,
                          ]}
                        >
                          {maturation === option && (
                            <View style={styles.maturationRadioInner} />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.maturationText,
                            maturation === option &&
                              styles.maturationTextActive,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Radio para escolher tipo de quantidade - apenas para produtos que podem ser vendidos por peso */}
                {productCanSellByWeight && (
                  <View style={styles.quantityTypeContainer}>
                    <Text style={styles.quantityTypeLabel}>
                      Forma de venda:
                    </Text>
                    <View style={styles.quantityTypeOptions}>
                      <TouchableOpacity
                        style={[
                          styles.quantityTypeButton,
                          quantityType === "peso" &&
                            styles.quantityTypeButtonActive,
                        ]}
                        onPress={() =>
                          setSelectedQuantityType((prev) => ({
                            ...prev,
                            [produto.id]: "peso",
                          }))
                        }
                      >
                        <View
                          style={[
                            styles.quantityTypeRadio,
                            quantityType === "peso" &&
                              styles.quantityTypeRadioActive,
                          ]}
                        >
                          {quantityType === "peso" && (
                            <View style={styles.quantityTypeRadioInner} />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.quantityTypeText,
                            quantityType === "peso" &&
                              styles.quantityTypeTextActive,
                          ]}
                        >
                          Por peso (gramas)
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.quantityTypeButton,
                          quantityType === "unidade" &&
                            styles.quantityTypeButtonActive,
                        ]}
                        onPress={() =>
                          setSelectedQuantityType((prev) => ({
                            ...prev,
                            [produto.id]: "unidade",
                          }))
                        }
                      >
                        <View
                          style={[
                            styles.quantityTypeRadio,
                            quantityType === "unidade" &&
                              styles.quantityTypeRadioActive,
                          ]}
                        >
                          {quantityType === "unidade" && (
                            <View style={styles.quantityTypeRadioInner} />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.quantityTypeText,
                            quantityType === "unidade" &&
                              styles.quantityTypeTextActive,
                          ]}
                        >
                          Por unidade
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Controles de quantidade baseados no tipo selecionado */}
                {productCanSellByWeight && quantityType === "peso" ? (
                  <View style={styles.weightControls}>
                    <View style={styles.weightInputContainer}>
                      <TextInput
                        style={styles.weightInput}
                        placeholder="Quantidade"
                        value={customInput[produto.id] || ""}
                        onChangeText={(value) =>
                          updateCustomInput(produto.id, value)
                        }
                        keyboardType="numeric"
                      />
                      <Text style={styles.weightUnit}>gramas</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.addButton,
                        (!maturation || !weightQuantities[produto.id]) &&
                          styles.addButtonDisabled,
                      ]}
                      onPress={() =>
                        addWeightProduct(produto, weightQuantities[produto.id])
                      }
                      disabled={!maturation || !weightQuantities[produto.id]}
                    >
                      <Ionicons name="add" size={20} color="#FFF" />
                      <Text style={styles.addButtonText}>Adicionar</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.unitControls}>
                    <View style={styles.unitQuantityContainer}>
                      <TouchableOpacity
                        style={[
                          styles.unitQuantityBtn,
                          (unitQuantities[produto.id] || 1) <= 1 &&
                            styles.unitQuantityBtnDisabled,
                        ]}
                        onPress={() => {
                          const currentQty = unitQuantities[produto.id] || 1;
                          if (currentQty > 1) {
                            setUnitQuantities((prev) => ({
                              ...prev,
                              [produto.id]: currentQty - 1,
                            }));
                          }
                        }}
                        disabled={(unitQuantities[produto.id] || 1) <= 1}
                      >
                        <Ionicons
                          name="remove"
                          size={18}
                          color={
                            (unitQuantities[produto.id] || 1) <= 1
                              ? "#ccc"
                              : "#4A7C59"
                          }
                        />
                      </TouchableOpacity>

                      <Text style={styles.unitQuantityDisplay}>
                        {unitQuantities[produto.id] || 1}
                      </Text>

                      <TouchableOpacity
                        style={styles.unitQuantityBtn}
                        onPress={() => {
                          const currentQty = unitQuantities[produto.id] || 1;
                          setUnitQuantities((prev) => ({
                            ...prev,
                            [produto.id]: currentQty + 1,
                          }));
                        }}
                      >
                        <Ionicons name="add" size={18} color="#4A7C59" />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.addButton,
                        !maturation && styles.addButtonDisabled,
                      ]}
                      onPress={() => {
                        const quantity = unitQuantities[produto.id] || 1;
                        addMultipleUnits(produto, quantity);
                        // Resetar quantidade após adicionar
                        setUnitQuantities((prev) => ({
                          ...prev,
                          [produto.id]: 1,
                        }));
                      }}
                      disabled={!maturation}
                    >
                      <Ionicons name="add" size={20} color="#FFF" />
                      <Text style={styles.addButtonText}>Adicionar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Espaço adicional para o nav */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botão de cesta fixo (único elemento fixo) */}
      {getTotalItens() > 0 && (
        <TouchableOpacity
          style={styles.fixedCestaButton}
          onPress={() => router.push("/cesta/cesta")}
        >
          <Ionicons name="bag" size={24} color="#FFF" />
          <View style={styles.fixedCestaBadge}>
            <Text style={styles.fixedCestaBadgeText}>{getTotalItens()}</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7E4",
  },
  header: {
    backgroundColor: "#FFF7E4",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D5D31",
  },
  cestaButton: {
    backgroundColor: "#4A7C59",
    borderRadius: 20,
    padding: 8,
    position: "relative",
  },
  cestaBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#E74C3C",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cestaBadgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  feiranteInfo: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
  },
  feiranteAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  feiranteDetails: {
    flex: 1,
  },
  feiranteNome: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D5D31",
    marginBottom: 4,
  },
  feiranteBanca: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
  },
  statusText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
  },
  avaliacaoContainer: {
    alignItems: "center",
    gap: 4,
  },
  avaliacaoText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2D5D31",
  },
  totalAvaliacoes: {
    fontSize: 12,
    color: "#666",
  },
  content: {
    flex: 1,
  },
  buscaContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  categoriasContainer: {
    marginBottom: 20,
  },
  categoriasList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoriaButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  categoriaButtonActive: {
    backgroundColor: "#4A7C59",
    borderColor: "#4A7C59",
  },
  categoriaText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  categoriaTextActive: {
    color: "#FFF",
    fontWeight: "600",
  },
  produtosContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  produtoCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
  },
  produtoHeader: {
    flexDirection: "row",
    marginBottom: 16,
  },
  produtoImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginRight: 16,
    overflow: "hidden",
  },
  produtoImagem: {
    width: 80,
    height: 80,
  },
  produtoImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: "#F0F8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  produtoEmoji: {
    fontSize: 32,
  },
  produtoInfo: {
    flex: 1,
    justifyContent: "center",
  },
  produtoNome: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D5D31",
    marginBottom: 8,
  },
  precoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  produtoPreco: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4A7C59",
  },
  unidadeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#F8FDF9",
    borderWidth: 1,
    borderColor: "#E8F5E8",
  },
  unidadeButtonDisabled: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E0E0E0",
  },
  unidadeText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  unidadeTextDisabled: {
    color: "#999",
  },
  estoqueInfo: {
    fontSize: 12,
    color: "#999",
  },
  maturationContainer: {
    marginBottom: 16,
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  maturationLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D5D31",
    marginBottom: 8,
  },
  maturationOptions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  maturationButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    gap: 8,
  },
  maturationButtonActive: {
    backgroundColor: "#F8FDF9",
    borderColor: "#4A7C59",
  },
  maturationRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  maturationRadioActive: {
    borderColor: "#4A7C59",
    backgroundColor: "#FFF",
  },
  maturationRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4A7C59",
  },
  maturationText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  maturationTextActive: {
    color: "#2D5D31",
    fontWeight: "600",
  },
  quantityTypeContainer: {
    marginBottom: 16,
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  quantityTypeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D5D31",
    marginBottom: 8,
  },
  quantityTypeOptions: {
    gap: 8,
  },
  quantityTypeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    gap: 8,
  },
  quantityTypeButtonActive: {
    backgroundColor: "#F8FDF9",
    borderColor: "#4A7C59",
  },
  quantityTypeRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityTypeRadioActive: {
    borderColor: "#4A7C59",
    backgroundColor: "#FFF",
  },
  quantityTypeRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4A7C59",
  },
  quantityTypeText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  quantityTypeTextActive: {
    color: "#2D5D31",
    fontWeight: "600",
  },
  weightControls: {
    gap: 12,
  },
  weightInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FDF9",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E8F5E8",
  },
  weightInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  weightUnit: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  unitControls: {
    width: "100%",
    gap: 12,
  },
  unitQuantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FDF9",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 12,
  },
  unitQuantityBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unitQuantityBtnDisabled: {
    backgroundColor: "#F5F5F5",
    shadowOpacity: 0,
    elevation: 0,
  },
  unitQuantityDisplay: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D5D31",
    minWidth: 30,
    textAlign: "center",
  },
  addButton: {
    backgroundColor: "#4A7C59",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addButtonDisabled: {
    backgroundColor: "#ccc",
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  carrinhoSection: {
    marginTop: 16,
    marginBottom: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderColor: "#E8F5E8",
  },
  carrinhoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D5D31",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  carrinhoContainer: {
    gap: 12,
    paddingHorizontal: 20,
  },
  carrinhoCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#4A7C59",
  },
  carrinhoCardHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  carrinhoImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
    overflow: "hidden",
    backgroundColor: "#F8FDF9",
  },
  carrinhoImagem: {
    width: 60,
    height: 60,
  },
  carrinhoImagePlaceholder: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F8F0",
  },
  carrinhoEmoji: {
    fontSize: 28,
  },
  carrinhoInfo: {
    flex: 1,
    justifyContent: "center",
  },
  carrinhoNome: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2D5D31",
    marginBottom: 4,
  },
  carrinhoPrecoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  carrinhoPreco: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A7C59",
  },
  carrinhoUnidade: {
    fontSize: 14,
    color: "#666",
  },
  carrinhoQuantidadeInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  carrinhoQuantidadeText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  carrinhoTotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2D5D31",
  },
  carrinhoControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    position: "relative",
  },
  carrinhoButton: {
    backgroundColor: "#F8FDF9",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E8F5E8",
  },
  carrinhoQuantidadeDisplay: {
    backgroundColor: "#4A7C59",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 60,
    alignItems: "center",
  },
  carrinhoQuantidadeNumero: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
  },
  carrinhoTrashButton: {
    backgroundColor: "#FFE5E5",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    position: "absolute",
    right: 0,
    top: 10,
  },
  promocaoTag: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#E74C3C",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 1,
  },
  promocaoText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  internalHeader: {
    backgroundColor: "#FFF7E4",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  feiranteBlock: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  feiranteInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  whatsappButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  fixedCestaButton: {
    backgroundColor: "#4A7C59",
    borderRadius: 25,
    padding: 12,
    position: "absolute",
    bottom: 20,
    right: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fixedCestaBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#E74C3C",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  fixedCestaBadgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
});
