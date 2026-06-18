/**
 * Tela: Meus endereços (cliente).
 *
 * Lista todos os endereços do usuário em cards estilo iFood. O endereço
 * marcado como "Principal" aparece com badge verde. Cada card tem botões
 * para editar, excluir e tornar principal.
 *
 * O FAB inferior leva à tela de cadastro (/perfil/enderecos/novo).
 */

import { Ionicons } from "@expo/vector-icons";
import {
  router,
  Stack,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import * as React from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useUser } from "../../../contexts/UserContext";
import { enderecosService } from "../../../services/enderecos";
import type { EnderecoUsuario } from "../../../types/api";

const MeusEnderecos: React.FC = () => {
  const {
    user,
    enderecos,
    enderecoSelecionadoId,
    setEnderecoSelecionado,
    recarregarEnderecos,
  } = useUser();

  const [carregando, setCarregando] = React.useState(enderecos.length === 0);
  const [erro, setErro] = React.useState<string | null>(null);

  // Quando a tela é aberta com `?selecionado=ID` (ex: vindo de
  // /finalizapedido), seleciona automaticamente esse endereço no contexto
  // pra que o card apareça destacado.
  const params = useLocalSearchParams<{ selecionado?: string }>();
  React.useEffect(() => {
    const raw = Array.isArray(params.selecionado)
      ? params.selecionado[0]
      : params.selecionado;
    if (!raw) return;
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0 && n !== enderecoSelecionadoId) {
      setEnderecoSelecionado(n);
    }
    // só queremos rodar quando o param muda — não no resto
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.selecionado]);

  const carregar = React.useCallback(async () => {
    if (!user?.id || !user?.token) {
      setCarregando(false);
      setErro("Você precisa estar logado.");
      return;
    }
    setCarregando(true);
    setErro(null);
    try {
      await recarregarEnderecos();
    } catch (e: any) {
      setErro(e?.message ?? "Erro ao carregar endereços");
    } finally {
      setCarregando(false);
    }
  }, [user?.id, user?.token, recarregarEnderecos]);

  useFocusEffect(
    React.useCallback(() => {
      carregar();
    }, [carregar]),
  );

  async function tornarPrincipal(end: EnderecoUsuario) {
    if (!user?.token) return;
    try {
      await enderecosService.marcarComoPrincipal(user.token, end.id);
      setEnderecoSelecionado(end.id);
      await recarregarEnderecos();
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Não foi possível atualizar");
    }
  }

  function selecionar(end: EnderecoUsuario) {
    setEnderecoSelecionado(end.id);
    Alert.alert(
      "Endereço selecionado",
      `"${end.label}" será usado para entrega.`,
    );
  }

  function confirmarRemover(end: EnderecoUsuario) {
    Alert.alert(
      "Remover endereço",
      `Deseja realmente remover "${end.label}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            if (!user?.token) return;
            try {
              await enderecosService.remover(user.token, end.id);
              if (enderecoSelecionadoId === end.id) {
                setEnderecoSelecionado(null);
              }
              await recarregarEnderecos();
            } catch (e: any) {
              Alert.alert("Erro", e?.message ?? "Não foi possível remover");
            }
          },
        },
      ],
    );
  }

  function editar(end: EnderecoUsuario) {
    router.push({
      pathname: "/perfil/enderecos/[id]",
      params: { id: String(end.id) },
    });
  }

  function adicionar() {
    router.push({
      pathname: "/perfil/enderecos/[id]",
      params: { id: "novo" },
    });
  }

  function formatarLinhaPrincipal(end: EnderecoUsuario) {
    const partes = [end.endereco];
    if (end.numero) partes.push(end.numero);
    return partes.filter(Boolean).join(", ");
  }

  function formatarLinhaSecundaria(end: EnderecoUsuario) {
    const partes = [end.bairro, end.cidade, end.uf].filter(Boolean);
    return partes.join(" • ");
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Meus endereços",
          headerStyle: { backgroundColor: "#FFF" },
          headerTitleStyle: {
            fontSize: 16,
            fontFamily: "Poppins-SemiBold",
            color: "#255336",
          },
          headerTintColor: "#255336",
        }}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {carregando && (
          <View style={styles.centro}>
            <ActivityIndicator color="#4A7C59" />
          </View>
        )}

        {!carregando && erro && (
          <View style={styles.erroBox}>
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
            <Text style={styles.erroTexto}>{erro}</Text>
          </View>
        )}

        {!carregando && !erro && enderecos.length === 0 && (
          <View style={styles.vazioBox}>
            <Ionicons name="location-outline" size={48} color="#CBD5C2" />
            <Text style={styles.vazioTitulo}>Nenhum endereço cadastrado</Text>
            <Text style={styles.vazioSub}>
              Adicione um endereço para começar a receber suas feiras.
            </Text>
          </View>
        )}

        {enderecos.map((end) => {
          const selecionado = end.id === enderecoSelecionadoId;
          return (
            <View
              key={end.id}
              style={[
                styles.card,
                selecionado && styles.cardSelecionado,
              ]}
            >
              <View style={styles.cardCabecalho}>
                <View style={styles.cardCabecalhoEsq}>
                  <Ionicons
                    name={iconePorLabel(end.label)}
                    size={20}
                    color="#255336"
                  />
                  <Text style={styles.cardLabel}>{end.label}</Text>
                </View>
                <View style={styles.cardBadges}>
                  {end.principal && (
                    <View style={styles.badgePrincipal}>
                      <Ionicons name="star" size={11} color="#FFF" />
                      <Text style={styles.badgePrincipalTexto}>Principal</Text>
                    </View>
                  )}
                  {selecionado && !end.principal && (
                    <View style={styles.badgeSelecionado}>
                      <Ionicons name="checkmark" size={11} color="#FFF" />
                      <Text style={styles.badgePrincipalTexto}>Selecionado</Text>
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.linhaPrincipal}>
                {formatarLinhaPrincipal(end)}
              </Text>
              {end.complemento ? (
                <Text style={styles.linhaSecundaria}>{end.complemento}</Text>
              ) : null}
              <Text style={styles.linhaSecundaria}>
                {formatarLinhaSecundaria(end)}
              </Text>
              {end.cep ? (
                <Text style={styles.linhaSecundaria}>CEP: {formatarCep(end.cep)}</Text>
              ) : null}

              <View style={styles.acoesRow}>
                {!selecionado && (
                  <TouchableOpacity
                    style={styles.botaoSecundario}
                    onPress={() => selecionar(end)}
                  >
                    <Ionicons name="checkmark-circle-outline" size={16} color="#255336" />
                    <Text style={styles.botaoSecundarioTexto}>Usar este</Text>
                  </TouchableOpacity>
                )}
                {!end.principal && (
                  <TouchableOpacity
                    style={styles.botaoSecundario}
                    onPress={() => tornarPrincipal(end)}
                  >
                    <Ionicons name="star-outline" size={16} color="#255336" />
                    <Text style={styles.botaoSecundarioTexto}>Tornar principal</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.botaoSecundario}
                  onPress={() => editar(end)}
                >
                  <Ionicons name="create-outline" size={16} color="#255336" />
                  <Text style={styles.botaoSecundarioTexto}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.botaoSecundario, styles.botaoPerigo]}
                  onPress={() => confirmarRemover(end)}
                >
                  <Ionicons name="trash-outline" size={16} color="#DC2626" />
                  <Text
                    style={[styles.botaoSecundarioTexto, { color: "#DC2626" }]}
                  >
                    Excluir
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <View style={{ height: 80 }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={adicionar}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={24} color="#FFF" />
        <Text style={styles.fabTexto}>Adicionar endereço</Text>
      </TouchableOpacity>
    </View>
  );
};

function iconePorLabel(label: string): React.ComponentProps<typeof Ionicons>["name"] {
  const l = label.toLowerCase();
  if (l.includes("casa")) return "home-outline";
  if (l.includes("trabalho") || l.includes("escritó") || l.includes("escrito")) return "briefcase-outline";
  if (l.includes("família") || l.includes("familia")) return "people-outline";
  if (l.includes("sítio") || l.includes("sitio") || l.includes("chácara") || l.includes("chacara"))
    return "leaf-outline";
  return "location-outline";
}

function formatarCep(cep: string): string {
  const d = cep.replace(/\D/g, "");
  if (d.length !== 8) return cep;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F9F7" },
  scroll: { padding: 16, paddingBottom: 100 },

  centro: { alignItems: "center", paddingVertical: 40 },

  erroBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  erroTexto: { color: "#991B1B", flex: 1, fontSize: 13 },

  vazioBox: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
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
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EAEFEA",
  },
  cardSelecionado: {
    borderColor: "#4A7C59",
    backgroundColor: "#F4FAF5",
  },
  cardCabecalho: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardCabecalhoEsq: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardLabel: {
    fontSize: 15,
    fontFamily: "Poppins-SemiBold",
    color: "#255336",
  },
  cardBadges: { flexDirection: "row", gap: 6 },
  badgePrincipal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#4A7C59",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeSelecionado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#255336",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgePrincipalTexto: {
    color: "#FFF",
    fontSize: 10,
    fontFamily: "Poppins-SemiBold",
  },

  linhaPrincipal: {
    fontSize: 14,
    color: "#222",
    marginBottom: 2,
  },
  linhaSecundaria: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },

  acoesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  botaoSecundario: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#D8E4D8",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FFF",
  },
  botaoSecundarioTexto: {
    fontSize: 12,
    color: "#255336",
    fontFamily: "Poppins-SemiBold",
  },
  botaoPerigo: {
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
  },

  fab: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4A7C59",
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  fabTexto: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
  },
});

export default MeusEnderecos;
