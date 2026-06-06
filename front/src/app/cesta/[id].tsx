import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCesta } from "../../contexts/CestaContext";
import { cestasService } from "../../services/cestas";
import { ApiException } from "../../services/api";
import type { Cesta as CestaApi, Mercadoria } from "../../types/api";

// Placeholders quando não há foto cadastrada (estilo iFood)
const IMAGEM_PADRAO_CESTA = require("../../../assets/images/cesta-padrao.png");
const IMAGEM_PADRAO_PRODUTO = require("../../../assets/images/produto-padrao.png");

// --- Tipos ---

// Item normalizado para a UI (combina o que vem da API com o que a tela precisa)
interface ItemCestaUI {
  id: string;
  nome: string;
  preco: number;
  unidade: string;
  quantidade: number; // quantidade padrão sugerida (1 quando a API não tem campo)
  imagem?: string;
  emoji?: string;
}

interface CestaUI {
  id: string;
  nome: string;
  preco: number;
  /** Valor absoluto do desconto em R$ (vem como number do banco, undefined se sem desconto). */
  desconto?: number;
  imagem?: string;
  emoji?: string;
  feirante: string;
  banca: string;
  feira: string;
  feiranteId: string;
  feiraId: string;
  itens: ItemCestaUI[];
}

// Normaliza unidade vinda da API ("KG", "UN", "CX") para o formato exibido
function formataUnidade(u: unknown): string {
  if (!u) return "un";
  return String(u).toLowerCase();
}

// Converte o payload tipado de GET /cestas/:id no formato consumido pela tela
function mapearCestaDaApi(c: CestaApi): CestaUI | null {
  if (!c || c.id == null) return null;

  const mercadorias: ItemCestaUI[] = Array.isArray(c.mercadorias)
    ? c.mercadorias.map((m: Mercadoria) => ({
        id: String(m.id),
        nome: String(m.nome ?? "Item"),
        preco: Number(m.preco ?? 0),
        unidade: formataUnidade(m.unidade),
        // A relação Cesta<->Mercadoria é M:N simples (sem campo quantidade),
        // então cada item entra com 1 unidade por padrão.
        quantidade: 1,
        imagem: m.foto || undefined,
        emoji: m.emoji || undefined,
      }))
    : [];

  return {
    id: String(c.id),
    nome: String(c.nome ?? "Cesta"),
    preco: Number(c.preco ?? 0),
    // Decimal do Prisma chega como string no JSON — converte e descarta valores não positivos
    desconto: (() => {
      if (c.desconto == null) return undefined;
      const n = Number(c.desconto);
      return Number.isFinite(n) && n > 0 ? n : undefined;
    })(),
    imagem: c.imagem || undefined,
    emoji: c.emoji || undefined,
    feirante: c.feirante?.nome ?? "Feirante",
    banca: c.feirante?.banca ?? "",
    feira: c.feirante?.feira?.nome ?? "",
    feiranteId: c.feirante?.id != null ? String(c.feirante.id) : "",
    feiraId: c.feirante?.feiraId != null ? String(c.feirante.feiraId) : "",
    itens: mercadorias,
  };
}

const CestaDetalhesScreen = () => {
  const { id } = useLocalSearchParams();
  const cestaId = Array.isArray(id) ? id[0] : id;
  const { adicionarCesta } = useCesta();

  // --- Estado de fetch ---
  const [cesta, setCesta] = useState<CestaUI | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Quantidades por item (controle local — não persiste no servidor)
  const [quantidades, setQuantidades] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (!cestaId) {
      setErro("ID de cesta inválido.");
      setCarregando(false);
      return;
    }

    let cancelado = false;
    async function buscarCesta() {
      setCarregando(true);
      setErro(null);
      try {
        const data = await cestasService.buscarPorId(cestaId!);
        const mapeada = mapearCestaDaApi(data);
        if (cancelado) return;
        if (!mapeada) {
          setCesta(null);
          setErro("Cesta inválida.");
          return;
        }
        setCesta(mapeada);

        // Inicializa quantidades a partir dos itens recebidos
        const novasQuantidades: { [key: string]: number } = {};
        mapeada.itens.forEach((item) => {
          novasQuantidades[item.id] = item.quantidade || 1;
        });
        setQuantidades(novasQuantidades);
      } catch (e) {
        if (cancelado) return;
        // ApiException carrega o status HTTP — diferencia 404 dos outros
        if (e instanceof ApiException) {
          setCesta(null);
          setErro(
            e.status === 404
              ? "Cesta não encontrada."
              : "Não foi possível carregar a cesta."
          );
        } else {
          console.error("[CestaDetalhes] Falha ao buscar cesta:", e);
          setCesta(null);
          setErro("Erro de conexão. Tente novamente.");
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    buscarCesta();
    return () => {
      cancelado = true;
    };
  }, [cestaId]);

  const updateQuantidade = (itemId: string, novaQuantidade: number) => {
    setQuantidades((prev) => ({
      ...prev,
      [itemId]: Math.max(1, novaQuantidade),
    }));
  };

  // Remove o item da cesta (visualmente — apenas no estado local da tela)
  const removerProduto = (itemId: string) => {
    Alert.alert("Remover produto", "Deseja remover este produto da cesta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: () => {
          setQuantidades((prev) => {
            const novas = { ...prev };
            delete novas[itemId];
            return novas;
          });
        },
      },
    ]);
  };

  // --- Cálculos derivados ---
  const itensAtivos = useMemo(
    () => (cesta?.itens ?? []).filter((item) => quantidades[item.id] !== undefined),
    [cesta, quantidades]
  );

  const totalSemDesconto = useMemo(() => {
    return itensAtivos.reduce((total, item) => {
      const quantidade = quantidades[item.id] || item.quantidade || 1;
      return total + item.preco * quantidade;
    }, 0);
  }, [itensAtivos, quantidades]);

  const totalComDesconto = useMemo(() => {
    if (!cesta?.desconto || cesta.desconto <= 0) return totalSemDesconto;
    // Desconto é valor absoluto em R$ — nunca abaixo de zero
    return Math.max(0, totalSemDesconto - cesta.desconto);
  }, [cesta?.desconto, totalSemDesconto]);

  const valorDesconto = totalSemDesconto - totalComDesconto;

  const adicionarCestaAoCarrinho = () => {
    if (!cesta) return;
    if (itensAtivos.length === 0) {
      Alert.alert("Atenção", "Adicione pelo menos um produto à cesta");
      return;
    }

    adicionarCesta({
      cestaId: cesta.id,
      nome: cesta.nome,
      preco: totalComDesconto,
      precoOriginal: cesta.preco,
      feiranteId: cesta.feiranteId || "desconhecido",
      feiraId: cesta.feiraId || "desconhecida",
      feiranteNome: cesta.feirante,
      feiranteBanca: cesta.banca,
      feiraNome: cesta.feira,
      imagem: cesta.imagem,
      emoji: cesta.emoji,
      quantidade: 1,
    });

    Alert.alert(
      "Cesta adicionada!",
      `A cesta "${cesta.nome}" foi adicionada ao seu carrinho por R$ ${totalComDesconto.toFixed(2)}.`,
      [
        { text: "Continuar comprando", style: "cancel" },
        // Navega para a tela do carrinho (cesta/cesta), não para a própria página
        { text: "Ver Carrinho", onPress: () => router.push("/cesta/cesta") },
      ]
    );
  };

  const ItemRow = ({ item }: { item: ItemCestaUI }) => {
    if (quantidades[item.id] === undefined) return null;
    const quantidade = quantidades[item.id] || item.quantidade || 1;

    return (
      <View style={styles.itemContainer}>
        <View style={styles.itemImageContainer}>
          <Image
            source={item.imagem ? { uri: item.imagem } : IMAGEM_PADRAO_PRODUTO}
            style={styles.itemImagem}
            resizeMode="cover"
          />
        </View>

        <View style={styles.itemInfo}>
          <Text style={styles.itemNome} numberOfLines={2}>
            {item.nome}
          </Text>
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

  // --- Estados de UI: loading e erro ---

  if (carregando) {
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
          <ActivityIndicator size="large" color="#2D5D31" />
          <Text style={styles.emptyText}>Carregando cesta...</Text>
        </View>
      </View>
    );
  }

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
          <Text style={styles.emptyText}>
            {erro ?? "Cesta não encontrada."}
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.back()}
          >
            <Text style={styles.emptyButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- Render principal ---

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
            <Image
              source={cesta.imagem ? { uri: cesta.imagem } : IMAGEM_PADRAO_CESTA}
              style={styles.cestaImage}
              resizeMode="cover"
            />
          </View>

          <View style={styles.cestaDetailsContainer}>
            <Text style={styles.cestaNome}>{cesta.nome}</Text>
            {cesta.desconto && cesta.desconto > 0 ? (
              <View style={styles.descontoTag}>
                <Text style={styles.descontoText}>
                  {/* Mostra como percentual quando dá pra calcular sobre a soma */}
                  {totalSemDesconto > 0
                    ? `${Math.round(
                        (cesta.desconto / totalSemDesconto) * 100
                      )}% OFF`
                    : `R$ ${cesta.desconto.toFixed(2)} OFF`}
                </Text>
              </View>
            ) : null}

            {cesta.desconto && cesta.desconto > 0 ? (
              <>
                <Text style={styles.cestaPrecoOriginal}>
                  Preço sem desconto: R$ {totalSemDesconto.toFixed(2)}
                </Text>
                <Text style={styles.cestaDesconto}>
                  Desconto: -R$ {valorDesconto.toFixed(2)}
                </Text>
              </>
            ) : null}
            <Text style={styles.cestaPrecoCalculado}>
              {cesta.desconto && cesta.desconto > 0 ? "Preço final: " : "Total: "}R${" "}
              {totalComDesconto.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.feiranteInfo}>
          <Ionicons name="storefront-outline" size={16} color="#666" />
          <Text style={styles.feiranteTexto}>
            {[cesta.feira, cesta.feirante, cesta.banca]
              .filter(Boolean)
              .join(" • ")}
          </Text>
        </View>
      </View>

      <Text style={styles.itensTitle}>
        Itens da Cesta ({itensAtivos.length})
      </Text>

      <View style={styles.listaContainer}>
        {cesta.itens.length === 0 ? (
          <View style={styles.vazioItensContainer}>
            <Ionicons name="basket-outline" size={48} color="#ccc" />
            <Text style={styles.vazioItensTexto}>
              Esta cesta ainda não tem itens cadastrados.
            </Text>
          </View>
        ) : (
          cesta.itens.map((item) => <ItemRow key={item.id} item={item} />)
        )}
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
    flex: 1,
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
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
  emptyButton: {
    backgroundColor: "#4A7C59",
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 8,
  },
  emptyButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  vazioItensContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  vazioItensTexto: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default CestaDetalhesScreen;
