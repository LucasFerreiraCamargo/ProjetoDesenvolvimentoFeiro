/**
 * Tela: Produtos a Separar (admin / feirante).
 *
 * Lista agregada de mercadorias presentes nos pedidos em aberto (PENDENTE,
 * EM_PREPARACAO, EM_ANDAMENTO), somando as quantidades. O feirante usa pra
 * separar tudo de uma vez (fresquinho) e depois só montar cada pedido.
 *
 * Cada linha mostra:
 *   - Foto, nome, quantidade total + unidade, categoria
 *   - Expansível: lista de QUAIS pedidos contêm aquele item (cliente + qtd)
 *
 * Endpoint: GET /dashboard/produtos-a-separar
 */

import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAdmin, useAdminGuard, useAdminTitulo } from "../../contexts/AdminContext";
import { dashboardService } from "../../services/dashboard";
import type { ProdutoASeparar, ProdutosASepararResposta } from "../../types/api";

// Imagem fallback (mesma usada na home/admin/cestas)
const IMAGEM_PADRAO = require("../../../assets/images/produto-padrao.png");

/** Formata número respeitando unidade (UN inteiro, KG/g com decimal). */
function formatarQuantidade(qtd: number, unidade: string): string {
  if (unidade === "UN" || unidade === "CX") {
    return `${qtd.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} ${unidade.toLowerCase()}`;
  }
  // KG e g — exibe com até 3 casas decimais
  return `${qtd.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} ${unidade.toLowerCase()}`;
}

/** Cor de fundo do chip de categoria. Volta um cinza-claro se categoria desconhecida. */
function corCategoria(cat: string): { bg: string; fg: string } {
  const mapa: Record<string, { bg: string; fg: string }> = {
    FRUTAS: { bg: "#FFF3E0", fg: "#E65100" },
    LEGUMES: { bg: "#E8F5E8", fg: "#2E7D32" },
    VERDURAS: { bg: "#E8F5E9", fg: "#1B5E20" },
    TEMPEROS: { bg: "#F3E5F5", fg: "#6A1B9A" },
    OVOS: { bg: "#FFF8E1", fg: "#F57F17" },
    ORGANICOS: { bg: "#E0F7FA", fg: "#006064" },
    CARNES: { bg: "#FFEBEE", fg: "#B71C1C" },
    PEIXES: { bg: "#E3F2FD", fg: "#0D47A1" },
    LATICINIOS: { bg: "#FAFAFA", fg: "#424242" },
    GRAOS: { bg: "#EFEBE9", fg: "#4E342E" },
  };
  return mapa[cat] ?? { bg: "#F0F0F0", fg: "#666" };
}

export default function ProdutosASepararScreen() {
  useAdminGuard(2);
  useAdminTitulo("Produtos a Separar");
  const { admin } = useAdmin();

  const [dados, setDados] = React.useState<ProdutosASepararResposta | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [expandido, setExpandido] = React.useState<Set<number>>(new Set());

  const carregar = React.useCallback(async () => {
    if (!admin?.token) return;
    try {
      const r = await dashboardService.produtosASeparar(admin.token);
      setDados(r);
    } catch (e) {
      console.warn("[produtosASeparar] erro:", e);
      setDados({ pedidosConsiderados: 0, produtos: [] });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [admin?.token]);

  // Recarrega sempre que a tela ganha foco — assim novos pedidos que chegaram
  // entre uma visualização e outra já aparecem.
  useFocusEffect(
    React.useCallback(() => {
      carregar();
    }, [carregar]),
  );

  function toggle(id: number) {
    setExpandido((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function renderItem({ item }: { item: ProdutoASeparar }) {
    const aberto = expandido.has(item.mercadoria_id);
    const cor = corCategoria(String(item.categoria));
    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardHeader}
          activeOpacity={0.75}
          onPress={() => toggle(item.mercadoria_id)}
        >
          <Image
            source={item.foto ? { uri: item.foto } : IMAGEM_PADRAO}
            style={styles.foto}
            resizeMode="cover"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.nome} numberOfLines={1}>
              {item.nome}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.qtd}>
                {formatarQuantidade(item.quantidadeTotal, String(item.unidade))}
              </Text>
              <View
                style={[styles.categoriaChip, { backgroundColor: cor.bg }]}
              >
                <Text style={[styles.categoriaText, { color: cor.fg }]}>
                  {String(item.categoria).toLowerCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.pedidosLinha}>
              {item.pedidos.length}{" "}
              {item.pedidos.length === 1 ? "pedido" : "pedidos"}
            </Text>
          </View>
          <Ionicons
            name={aberto ? "chevron-up" : "chevron-down"}
            size={20}
            color="#999"
          />
        </TouchableOpacity>

        {aberto && (
          <View style={styles.expansao}>
            {item.pedidos.map((p, i) => (
              <TouchableOpacity
                key={`${p.pedido_id}-${i}`}
                style={styles.pedidoLinha}
                activeOpacity={0.75}
                onPress={() =>
                  router.push({
                    pathname: "/admin/pedidos/[id]",
                    params: { id: String(p.pedido_id) },
                  })
                }
              >
                <View style={styles.pedidoIconWrap}>
                  <Ionicons name="receipt-outline" size={16} color="#255336" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pedidoCliente}>{p.cliente_nome}</Text>
                  <Text style={styles.pedidoMeta}>
                    Pedido #{p.pedido_id}
                  </Text>
                </View>
                <Text style={styles.pedidoQtd}>
                  {formatarQuantidade(p.quantidade, String(item.unidade))}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#999" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color="#4A7C59" />
      </View>
    );
  }

  const totalProdutos = dados?.produtos.length ?? 0;
  const totalPedidos = dados?.pedidosConsiderados ?? 0;

  return (
    <View style={styles.container}>
      {/* Resumo do topo */}
      <View style={styles.resumoTopo}>
        <View style={styles.resumoBox}>
          <Text style={styles.resumoNumero}>{totalProdutos}</Text>
          <Text style={styles.resumoLabel}>
            {totalProdutos === 1 ? "Produto único" : "Produtos únicos"}
          </Text>
        </View>
        <View style={styles.resumoSep} />
        <View style={styles.resumoBox}>
          <Text style={styles.resumoNumero}>{totalPedidos}</Text>
          <Text style={styles.resumoLabel}>
            {totalPedidos === 1 ? "Pedido em aberto" : "Pedidos em aberto"}
          </Text>
        </View>
      </View>

      <FlatList
        data={dados?.produtos ?? []}
        keyExtractor={(p) => String(p.mercadoria_id)}
        renderItem={renderItem}
        contentContainerStyle={styles.lista}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              carregar();
            }}
            tintColor="#4A7C59"
          />
        }
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Ionicons name="leaf-outline" size={48} color="#CBD5C2" />
            <Text style={styles.vazioTitulo}>
              Nenhum produto para separar
            </Text>
            <Text style={styles.vazioSub}>
              Quando houver pedidos em aberto, eles aparecem aqui agregados
              por mercadoria.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7E4" },
  centro: { flex: 1, alignItems: "center", justifyContent: "center" },

  resumoTopo: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#EAEFEA",
  },
  resumoBox: { flex: 1, alignItems: "center" },
  resumoNumero: {
    fontSize: 26,
    fontFamily: "Poppins-SemiBold",
    color: "#255336",
  },
  resumoLabel: { fontSize: 11, color: "#666", marginTop: 2 },
  resumoSep: { width: 1, backgroundColor: "#EAEFEA" },

  lista: { padding: 12, paddingBottom: 100 },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#EAEFEA",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
  },
  foto: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: "#F5F5F5",
  },
  nome: {
    fontSize: 15,
    fontFamily: "Poppins-SemiBold",
    color: "#255336",
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  qtd: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4A7C59",
  },
  categoriaChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  categoriaText: { fontSize: 10, fontWeight: "600", textTransform: "capitalize" },
  pedidosLinha: { fontSize: 11, color: "#999" },

  expansao: {
    borderTopWidth: 1,
    borderTopColor: "#EAEFEA",
    backgroundColor: "#F8FBF8",
  },
  pedidoLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEFEA",
  },
  pedidoIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E8F5E8",
    alignItems: "center",
    justifyContent: "center",
  },
  pedidoCliente: {
    fontSize: 13,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
  },
  pedidoMeta: { fontSize: 11, color: "#999", marginTop: 1 },
  pedidoQtd: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4A7C59",
  },

  vazio: { alignItems: "center", paddingTop: 80, paddingHorizontal: 24 },
  vazioTitulo: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#255336",
  },
  vazioSub: {
    marginTop: 6,
    fontSize: 13,
    color: "#7A8A7C",
    textAlign: "center",
    lineHeight: 18,
  },
});
