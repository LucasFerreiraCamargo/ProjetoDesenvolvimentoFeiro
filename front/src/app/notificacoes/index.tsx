/**
 * Tela: Notificações (cliente).
 *
 * Consome `GET /notificacoes` da API + escuta `notificacao:nova` no canal
 * pessoal do cliente via Socket.IO (já conectado pelo chat). Marca como
 * lida ao tocar e segue o deep link em `payload.target` (com fallback por
 * tipo).
 */

import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useUser } from "../../contexts/UserContext";
import { chatSocket } from "../../lib/chatSocket";
import { notificacoesService } from "../../services/notificacoes";
import type { Notificacao, TipoNotificacao } from "../../types/api";

/** Mapeia tipo → ícone + cor de fundo do círculo. */
function visualPorTipo(tipo: TipoNotificacao): { icone: string; cor: string } {
  switch (tipo) {
    case "PEDIDO_CONFIRMADO":
      return { icone: "checkmark-circle", cor: "#4CAF50" };
    case "PEDIDO_STATUS_MUDOU":
      return { icone: "sync-circle", cor: "#3B82F6" };
    case "CHAT_NOVA_MENSAGEM":
      return { icone: "chatbubbles", cor: "#4A7C59" };
    case "PROMOCAO":
      return { icone: "pricetag", cor: "#F59E0B" };
    case "SISTEMA":
    default:
      return { icone: "information-circle", cor: "#7A4F00" };
  }
}

/** Formata createdAt em "há 5 min" / "há 1 hora" / "há 2 dias". */
function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seg = Math.max(1, Math.floor(diff / 1000));
  if (seg < 60) return "agora mesmo";
  const min = Math.floor(seg / 60);
  if (min < 60) return `há ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `há ${hr} hora${hr === 1 ? "" : "s"}`;
  const dia = Math.floor(hr / 24);
  if (dia < 30) return `há ${dia} dia${dia === 1 ? "" : "s"}`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

/** Resolve deep link a partir do payload ou do tipo (fallback). */
function rotaDestino(n: Notificacao): string {
  const target = n.payload?.target;
  if (typeof target === "string" && target.startsWith("/")) return target;
  // Fallback por tipo
  switch (n.tipo) {
    case "PEDIDO_CONFIRMADO":
    case "PEDIDO_STATUS_MUDOU": {
      const id = n.payload?.pedido_id;
      return id ? `/acompanhar-pedido/${id}` : "/meus-pedidos";
    }
    case "CHAT_NOVA_MENSAGEM": {
      const id = n.payload?.pedido_id;
      return id ? `/chat/${id}` : "/meus-pedidos";
    }
    case "PROMOCAO":
      return "/busca?promo=true";
    default:
      return "/home";
  }
}

const NotificacoesScreen: React.FC = () => {
  const { user } = useUser();

  const [itens, setItens] = React.useState<Notificacao[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  // ── Carga ───────────────────────────────────────────────────────────────
  const carregar = React.useCallback(async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }
    try {
      const lista = await notificacoesService.listar(user.token, 100);
      setItens(lista);
    } catch (e) {
      console.warn("[Notificacoes] erro:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.token]);

  useFocusEffect(
    React.useCallback(() => {
      carregar();
    }, [carregar]),
  );

  // ── Socket: notificação nova no canal pessoal ───────────────────────────
  React.useEffect(() => {
    if (!user?.id) return;
    chatSocket.joinComoCliente(user.id);
    const handler = (n: Notificacao) => {
      setItens((atual) => {
        if (atual.some((x) => x.id === n.id)) return atual;
        return [n, ...atual];
      });
    };
    chatSocket.on("notificacao:nova", handler);
    return () => {
      chatSocket.off("notificacao:nova", handler);
    };
  }, [user?.id]);

  // ── Ações ───────────────────────────────────────────────────────────────
  async function abrir(n: Notificacao) {
    if (!user?.token) return;
    // Marca como lida otimisticamente (UI atualiza imediato)
    if (!n.lida) {
      setItens((atual) =>
        atual.map((x) => (x.id === n.id ? { ...x, lida: true } : x)),
      );
      notificacoesService.marcarLida(user.token, n.id).catch((e) => {
        console.warn("[Notificacoes] marcarLida falhou:", e);
      });
    }
    // Deep link
    const destino = rotaDestino(n);
    router.push(destino as any);
  }

  async function marcarTodas() {
    if (!user?.token) return;
    setItens((atual) => atual.map((x) => ({ ...x, lida: true })));
    try {
      await notificacoesService.marcarTodasLidas(user.token);
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Não foi possível marcar todas.");
      carregar();
    }
  }

  function confirmarRemover(n: Notificacao) {
    Alert.alert(
      "Remover notificação",
      "Tem certeza?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            if (!user?.token) return;
            setItens((atual) => atual.filter((x) => x.id !== n.id));
            try {
              await notificacoesService.remover(user.token, n.id);
            } catch (e: any) {
              Alert.alert("Erro", e?.message ?? "Não foi possível remover.");
              carregar();
            }
          },
        },
      ],
    );
  }

  const naoLidas = itens.filter((n) => !n.lida).length;

  function renderItem({ item }: { item: Notificacao }) {
    const v = visualPorTipo(item.tipo);
    return (
      <TouchableOpacity
        style={[styles.card, !item.lida && styles.cardNaoLido]}
        onPress={() => abrir(item)}
        activeOpacity={0.85}
      >
        <View style={[styles.iconeCirculo, { backgroundColor: v.cor }]}>
          <Ionicons name={v.icone as any} size={20} color="#FFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.titulo, !item.lida && styles.tituloNaoLido]}
            numberOfLines={1}
          >
            {item.titulo}
          </Text>
          <Text style={styles.corpo} numberOfLines={2}>
            {item.corpo}
          </Text>
          <Text style={styles.tempo}>{tempoRelativo(item.createdAt)}</Text>
        </View>
        <TouchableOpacity
          style={styles.botaoRemover}
          onPress={() => confirmarRemover(item)}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Ionicons name="close" size={18} color="#999" />
        </TouchableOpacity>
        {!item.lida && <View style={styles.pontoNaoLido} />}
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color="#4A7C59" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Notificações 🔔</Text>
        {naoLidas > 0 && (
          <TouchableOpacity
            onPress={marcarTodas}
            style={styles.marcarButton}
          >
            <Text style={styles.marcarTodasText}>Marcar todas como lidas</Text>
          </TouchableOpacity>
        )}
      </View>

      {naoLidas > 0 && (
        <View style={styles.resumoContainer}>
          <Text style={styles.resumoText}>
            {naoLidas} notificação{naoLidas > 1 ? "ões" : ""} não lida
            {naoLidas > 1 ? "s" : ""}
          </Text>
        </View>
      )}

      <FlatList
        data={itens}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listaContent}
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
          <View style={styles.vazioContainer}>
            <Ionicons name="notifications-outline" size={64} color="#CBD5C2" />
            <Text style={styles.vazioText}>Nenhuma notificação</Text>
            <Text style={styles.vazioSubtext}>
              Você verá aqui avisos de pedidos, mensagens e promoções.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7E4" },
  centro: { flex: 1, alignItems: "center", justifyContent: "center" },

  headerContainer: {
    padding: 16,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#255336",
    marginBottom: 8,
  },
  marcarButton: {
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  marcarTodasText: { fontSize: 13, color: "#255336", fontWeight: "600" },

  resumoContainer: {
    backgroundColor: "#E3F2FD",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  resumoText: { fontSize: 13, color: "#1976D2", fontWeight: "500" },

  listaContent: { paddingHorizontal: 16, paddingBottom: 100, flexGrow: 1 },

  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EAEFEA",
    position: "relative",
  },
  cardNaoLido: {
    borderLeftWidth: 4,
    borderLeftColor: "#4A7C59",
    backgroundColor: "#F8FBF8",
  },
  iconeCirculo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 4 },
  tituloNaoLido: { color: "#255336", fontWeight: "700" },
  corpo: { fontSize: 13, color: "#666", lineHeight: 18, marginBottom: 6 },
  tempo: { fontSize: 11, color: "#999" },
  botaoRemover: { padding: 4 },
  pontoNaoLido: {
    position: "absolute",
    top: 12,
    right: 36,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4A7C59",
  },

  vazioContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  vazioText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#255336",
    marginTop: 12,
    marginBottom: 6,
  },
  vazioSubtext: {
    fontSize: 13,
    color: "#7A8A7C",
    textAlign: "center",
    lineHeight: 18,
  },
});

export default NotificacoesScreen;
