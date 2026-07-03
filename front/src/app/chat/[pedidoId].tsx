/**
 * Tela de chat compartilhada — cliente ↔ feirante (1 conversa por pedido).
 *
 * Funciona para os dois lados; o backend resolve o papel a partir do token
 * e devolve quem é "eu" no histórico. O front usa isso pra renderizar os
 * balões à direita/esquerda.
 *
 * Tempo real: socket.io. A tela entra na sala `pedido:{id}` no mount e
 * escuta `mensagem:nova`. Polling de fallback a cada 8s garante consistência
 * se o socket cair.
 */

import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as React from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "../../contexts/UserContext";
import { useAdmin } from "../../contexts/AdminContext";
import { chatSocket } from "../../lib/chatSocket";
import { chatService } from "../../services/chat";
import type { ChatMensagem, RemetenteChat } from "../../types/api";

const STATUS_SEM_CHAT = ["PENDENTE", "CANCELADO", "FINALIZADO"];

const ChatScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { admin } = useAdmin();
  const params = useLocalSearchParams<{ pedidoId: string }>();
  const pedidoIdParam = Array.isArray(params.pedidoId)
    ? params.pedidoId[0]
    : params.pedidoId;
  const pedidoId = Number(pedidoIdParam);

  // Token pode vir do cliente (UserContext) OU do feirante (AdminContext)
  const token = admin?.token ?? user?.token ?? "";

  const [mensagens, setMensagens] = React.useState<ChatMensagem[]>([]);
  const [carregando, setCarregando] = React.useState(true);
  const [enviando, setEnviando] = React.useState(false);
  const [texto, setTexto] = React.useState("");
  const [eu, setEu] = React.useState<{
    tipo: RemetenteChat;
    remetenteId: string;
  } | null>(null);
  const [statusPedido, setStatusPedido] = React.useState<string>("");
  const [tecladoVisivel, setTecladoVisivel] = React.useState(false);
  const flatListRef = React.useRef<FlatList<ChatMensagem>>(null);

  // Quando o teclado abre, o sistema redimensiona a tela e a barra de input
  // sobe junto. Aí NÃO queremos o inset inferior (geraria um vão acima do
  // teclado). Quando fecha, aplicamos o inset pra não colidir com os botões
  // de navegação do Android (barra de gestos / home / voltar).
  React.useEffect(() => {
    const showEvt = Platform.OS === "android" ? "keyboardDidShow" : "keyboardWillShow";
    const hideEvt = Platform.OS === "android" ? "keyboardDidHide" : "keyboardWillHide";
    const s = Keyboard.addListener(showEvt, () => setTecladoVisivel(true));
    const h = Keyboard.addListener(hideEvt, () => setTecladoVisivel(false));
    return () => {
      s.remove();
      h.remove();
    };
  }, []);

  // Espaço inferior da barra de input: respeita a área segura quando o
  // teclado está fechado; some quando ele abre.
  const padInferior = tecladoVisivel ? 8 : insets.bottom + 8;

  const podeEnviar =
    !!eu && !!statusPedido && !STATUS_SEM_CHAT.includes(statusPedido);

  // ── Carga inicial ────────────────────────────────────────────────────────
  const carregar = React.useCallback(async () => {
    if (!token || !pedidoId) return;
    try {
      const data = await chatService.historico(token, pedidoId);
      setMensagens(data.mensagens);
      setEu(data.eu);
      setStatusPedido(String(data.pedido.status));
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Falha ao carregar conversa");
    } finally {
      setCarregando(false);
    }
  }, [token, pedidoId]);

  React.useEffect(() => {
    carregar();
  }, [carregar]);

  // ── Socket: entra na sala e escuta novas mensagens ───────────────────────
  React.useEffect(() => {
    if (!pedidoId) return;
    chatSocket.joinPedido(pedidoId);

    const onNova = (m: ChatMensagem) => {
      if (Number(m.pedido_id) !== pedidoId) return;
      setMensagens((atual) => {
        if (atual.some((x) => x.id === m.id)) return atual;
        return [...atual, m];
      });
    };
    chatSocket.on("mensagem:nova", onNova);

    // Polling de fallback (caso o WS caia). 8s é "rápido o suficiente".
    const interval = setInterval(carregar, 8000);

    return () => {
      chatSocket.off("mensagem:nova", onNova);
      chatSocket.leavePedido(pedidoId);
      clearInterval(interval);
    };
  }, [pedidoId, carregar]);

  // Marca como lidas quando a tela fica visível (já é feito no GET, mas
  // chamamos PATCH explícito caso receba novas mensagens com a tela aberta).
  React.useEffect(() => {
    if (!token || !pedidoId || mensagens.length === 0) return;
    chatService.marcarLidas(token, pedidoId).catch(() => {});
  }, [token, pedidoId, mensagens.length]);

  // Auto-scroll pro fim quando chegam mensagens novas
  React.useEffect(() => {
    if (mensagens.length === 0) return;
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);
  }, [mensagens.length]);

  async function enviar() {
    const corpo = texto.trim();
    if (!corpo || !token || !pedidoId || !podeEnviar) return;
    setEnviando(true);
    setTexto("");
    try {
      const nova = await chatService.enviar(token, pedidoId, corpo);
      // Atualiza UI imediatamente (o socket vai chegar logo em seguida e o
      // dedup por id evita duplicar).
      setMensagens((atual) =>
        atual.some((x) => x.id === nova.id) ? atual : [...atual, nova],
      );
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Falha ao enviar mensagem");
      setTexto(corpo); // devolve o texto pra ele tentar de novo
    } finally {
      setEnviando(false);
    }
  }

  function renderItem({ item }: { item: ChatMensagem }) {
    const ehMeu = eu && item.remetente_tipo === eu.tipo;
    const hora = new Date(item.createdAt).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return (
      <View
        style={[
          styles.balaoLinha,
          ehMeu ? styles.balaoDireita : styles.balaoEsquerda,
        ]}
      >
        <View
          style={[
            styles.balao,
            ehMeu ? styles.balaoMeu : styles.balaoOutro,
          ]}
        >
          <Text
            style={[
              styles.balaoTexto,
              ehMeu ? styles.balaoTextoMeu : styles.balaoTextoOutro,
            ]}
          >
            {item.texto}
          </Text>
          <Text
            style={[
              styles.balaoHora,
              ehMeu ? styles.balaoHoraMeu : styles.balaoHoraOutro,
            ]}
          >
            {hora}
          </Text>
        </View>
      </View>
    );
  }

  // Decide para onde voltar quando o usuário tocar no chevron-back.
  // - Se há histórico, volta natural (sucessor padrão do iOS/Android).
  // - Senão: feirante volta pro detalhe do pedido na área admin; cliente
  //   volta pro acompanhar-pedido. Diferenciamos pelo token presente.
  function voltar() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    const destino = admin?.token
      ? `/admin/pedidos/${pedidoId}`
      : `/acompanhar-pedido/${pedidoId}`;
    router.replace(destino as any);
  }

  return (
    <View style={styles.container}>
      {/* Header inline — funciona em ambos os fluxos (cliente e feirante)
          porque a tela é fullscreen no _layout raiz (sem Stack envolvendo,
          então Stack.Screen aqui seria ignorado). */}
      <View style={[styles.headerInline, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={voltar}
          style={styles.headerBackBtn}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#255336" />
        </TouchableOpacity>
        <Text style={styles.headerInlineTitulo} numberOfLines={1}>
          Pedido #{pedidoId}
        </Text>
        {/* Espaço-reservado simétrico pro título ficar centralizado */}
        <View style={styles.headerBackBtn} />
      </View>

      {carregando ? (
        <View style={styles.centro}>
          <ActivityIndicator color="#4A7C59" />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 56 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={mensagens}
            keyExtractor={(m) => String(m.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.lista}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            ListEmptyComponent={
              <View style={styles.vazio}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={40}
                  color="#CBD5C2"
                />
                <Text style={styles.vazioTexto}>
                  Sem mensagens ainda. Mande a primeira!
                </Text>
              </View>
            }
          />

          {!podeEnviar && eu && (
            <View style={styles.avisoStatus}>
              <Ionicons name="information-circle" size={16} color="#92400E" />
              <Text style={styles.avisoStatusTexto}>
                Chat indisponível: pedido em status {statusPedido}.
              </Text>
            </View>
          )}

          <View style={[styles.barraInput, { paddingBottom: padInferior }]}>
            <TextInput
              style={styles.input}
              placeholder="Digite sua mensagem..."
              value={texto}
              onChangeText={setTexto}
              multiline
              maxLength={2000}
              editable={podeEnviar && !enviando}
            />
            <TouchableOpacity
              style={[
                styles.botaoEnviar,
                (!podeEnviar || enviando || !texto.trim()) &&
                  styles.botaoEnviarDesabilitado,
              ]}
              onPress={enviar}
              disabled={!podeEnviar || enviando || !texto.trim()}
            >
              {enviando ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Ionicons name="send" size={18} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F9F7" },
  centro: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Header inline da tela de chat — substitui o Stack.Screen header
  // padrão (que era ignorado porque o layout raiz usa Slot, não Stack).
  headerInline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    // paddingTop é aplicado inline com o inset superior (insets.top + 10)
    // pra respeitar notch/status bar em qualquer aparelho.
    paddingBottom: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEFEA",
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  headerInlineTitulo: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#255336",
  },
  lista: { padding: 12, paddingBottom: 20 },

  vazio: { alignItems: "center", paddingTop: 60 },
  vazioTexto: { color: "#7A8A7C", marginTop: 8, fontSize: 13 },

  balaoLinha: { flexDirection: "row", marginBottom: 6 },
  balaoEsquerda: { justifyContent: "flex-start" },
  balaoDireita: { justifyContent: "flex-end" },
  balao: {
    maxWidth: "80%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  balaoMeu: {
    backgroundColor: "#4A7C59",
    borderBottomRightRadius: 4,
  },
  balaoOutro: {
    backgroundColor: "#FFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#EAEFEA",
  },
  balaoTexto: { fontSize: 14, lineHeight: 18 },
  balaoTextoMeu: { color: "#FFF" },
  balaoTextoOutro: { color: "#333" },
  balaoHora: { fontSize: 10, marginTop: 2, alignSelf: "flex-end" },
  balaoHoraMeu: { color: "#D8E4D8" },
  balaoHoraOutro: { color: "#999" },

  avisoStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF3C7",
    borderTopWidth: 1,
    borderTopColor: "#FCD34D",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  avisoStatusTexto: { color: "#7A4F00", fontSize: 12, flex: 1 },

  barraInput: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#EAEFEA",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    borderRadius: 20,
    backgroundColor: "#F7F9F7",
    fontSize: 14,
    color: "#333",
  },
  botaoEnviar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4A7C59",
    alignItems: "center",
    justifyContent: "center",
  },
  botaoEnviarDesabilitado: { opacity: 0.4 },
});

export default ChatScreen;
