import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useUser } from "../../contexts/UserContext";

const API_BASE =
  (process.env.EXPO_PUBLIC_API_URL as string) || "http://localhost:3001";

interface PedidoApi {
  id: number;
  valor_total: string | number;
  status: string;
  createdAt: string;
  items?: any[];
}

const STATUS_INFO: Record<string, { label: string; cor: string; corBg: string }> = {
  PENDENTE:      { label: "Pendente",      cor: "#92400E", corBg: "#FEF3C7" },
  EM_PREPARACAO: { label: "Em Preparação", cor: "#1E40AF", corBg: "#DBEAFE" },
  EM_ANDAMENTO:  { label: "Em Andamento",  cor: "#5B21B6", corBg: "#EDE9FE" },
  EM_ROTA:       { label: "Em Rota",       cor: "#7E22CE", corBg: "#F3E8FF" },
  ENTREGUE:      { label: "Entregue",      cor: "#065F46", corBg: "#D1FAE5" },
  RETORNANDO:    { label: "Retornando",    cor: "#C2410C", corBg: "#FFEDD5" },
  CANCELADO:     { label: "Cancelado",     cor: "#DC2626", corBg: "#FEE2E2" },
  FINALIZADO:    { label: "Finalizado",    cor: "#075985", corBg: "#E0F2FE" },
};

export default function MeusPedidosScreen() {
  const { user } = useUser();
  const [pedidos, setPedidos] = useState<PedidoApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!user?.id) {
      setErro("Você precisa estar logado para ver seus pedidos.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch(
        `${API_BASE.replace(/\/$/, "")}/pedido/usuario/${user.id}`,
        {
          headers: user.token
            ? { Authorization: `Bearer ${user.token}` }
            : undefined,
        }
      );
      if (!res.ok) {
        if (res.status === 401)
          setErro("Sessão expirada. Faça login novamente.");
        else setErro(`Erro ${res.status} ao carregar pedidos`);
        setPedidos([]);
        return;
      }
      const data = await res.json();
      setPedidos(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error("[MeusPedidos] erro:", e);
      setErro("Erro de conexão. Verifique sua internet.");
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.token]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function formataData(d?: string) {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return d;
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#2D5D31" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Pedidos</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color="#2D5D31" />
        </View>
      ) : erro ? (
        <View style={styles.centro}>
          <Ionicons name="warning-outline" size={48} color="#CCC" />
          <Text style={styles.erroText}>{erro}</Text>
          <TouchableOpacity style={styles.botaoRetry} onPress={carregar}>
            <Text style={styles.botaoRetryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : pedidos.length === 0 ? (
        <View style={styles.centro}>
          <Ionicons name="receipt-outline" size={64} color="#CCC" />
          <Text style={styles.vazioTitulo}>Nenhum pedido ainda</Text>
          <Text style={styles.vazioSub}>
            Quando você fizer seu primeiro pedido, ele aparecerá aqui.
          </Text>
          <TouchableOpacity
            style={styles.botaoCta}
            onPress={() => router.push("/home")}
          >
            <Text style={styles.botaoCtaText}>Começar a comprar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => {
            const info = STATUS_INFO[item.status] ?? {
              label: item.status,
              cor: "#666",
              corBg: "#F0F0F0",
            };
            const qtdItens = (item.items ?? []).length;
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  router.push(`/acompanhar-pedido/${item.id}` as any)
                }
                activeOpacity={0.7}
              >
                <View style={styles.cardTopo}>
                  <Text style={styles.pedidoId}>Pedido #{item.id}</Text>
                  <View
                    style={[styles.statusTag, { backgroundColor: info.corBg }]}
                  >
                    <Text style={[styles.statusText, { color: info.cor }]}>
                      {info.label}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardMeio}>
                  <Text style={styles.cardData}>
                    {formataData(item.createdAt)}
                  </Text>
                  <Text style={styles.cardValor}>
                    R$ {Number(item.valor_total ?? 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.cardRodape}>
                  <Text style={styles.cardItens}>
                    {qtdItens} {qtdItens === 1 ? "item" : "itens"}
                  </Text>
                  <View style={styles.acompanharLink}>
                    <Text style={styles.acompanharText}>Acompanhar</Text>
                    <Ionicons name="chevron-forward" size={14} color="#4A7C59" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7E4" },
  header: {
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  backButton: { padding: 8, borderRadius: 8 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#2D5D31" },

  centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  erroText: { fontSize: 14, color: "#666", textAlign: "center" },
  botaoRetry: {
    backgroundColor: "#4A7C59",
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  botaoRetryText: { color: "#FFF", fontWeight: "700" },

  vazioTitulo: { fontSize: 20, fontWeight: "bold", color: "#2D5D31", marginTop: 8 },
  vazioSub: { fontSize: 14, color: "#666", textAlign: "center", lineHeight: 20 },
  botaoCta: {
    marginTop: 12,
    backgroundColor: "#4A7C59",
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  botaoCtaText: { color: "#FFF", fontSize: 15, fontWeight: "700" },

  lista: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "rgba(0,0,0,0.05)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  cardTopo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  pedidoId: { fontSize: 15, fontWeight: "bold", color: "#2D5D31" },
  statusTag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: { fontSize: 11, fontWeight: "700" },

  cardMeio: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardData: { fontSize: 13, color: "#666" },
  cardValor: { fontSize: 16, fontWeight: "bold", color: "#4A7C59" },

  cardRodape: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  cardItens: { fontSize: 12, color: "#999" },
  acompanharLink: { flexDirection: "row", alignItems: "center", gap: 2 },
  acompanharText: { fontSize: 13, color: "#4A7C59", fontWeight: "600" },
});
