import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useUser } from "../../contexts/UserContext";

const API_BASE =
  (process.env.EXPO_PUBLIC_API_URL as string) || "http://localhost:3001";

// Tipos do estado da API
interface PedidoApi {
  id: number;
  status: string;
  valor_total: string | number;
  createdAt: string;
  updatedAt?: string | null;
  usuario_id: string;
  usuario?: {
    nome?: string;
    telefone?: string;
    endereco?: string;
    numero?: string | null;
    bairro?: string;
    cidade?: string | null;
    uf?: string | null;
    cep?: string | null;
  };
  items?: any[];
}

// Configuração das etapas. As ordens são fixas; o status do pedido decide
// quais ficam concluidas/ativas. A 3ª etapa muda de label conforme tipoEntrega.
type Etapa = {
  id:
    | "confirmado"
    | "preparando"
    | "saida" // "Pedido Pronto" (retirada) OU "Saiu para Entrega" (entrega)
    | "entregue";
  titulo: string;
  descricao: string;
  horario: string;
  concluido: boolean;
  ativo: boolean;
};

type TipoEntrega = "endereco" | "feira";

/**
 * Mapeia o status do pedido na API para o índice da etapa atual.
 * - PENDENTE   → 0 (ainda aguardando confirmação; etapa 0 ATIVA, nada concluído)
 * - EM_PREPARACAO → 1 (Preparando)
 * - EM_ANDAMENTO / EM_ROTA → 2 (Pronto / Saiu para Entrega)
 * - ENTREGUE / FINALIZADO → 3 (Entregue)
 * - CANCELADO → -1 (estado especial — UI mostra card de cancelamento)
 */
function indiceEtapaPorStatus(status: string): number {
  switch (status) {
    case "PENDENTE":
      return 0;
    case "EM_PREPARACAO":
      return 1;
    case "EM_ANDAMENTO":
    case "EM_ROTA":
      return 2;
    case "ENTREGUE":
    case "FINALIZADO":
      return 3;
    case "CANCELADO":
      return -1;
    default:
      return 0;
  }
}

/** Constrói a lista de etapas a partir do status atual + tipo de entrega. */
function montarEtapas(
  statusAtual: string,
  tipoEntrega: TipoEntrega,
  horariosPorEtapa: Partial<Record<Etapa["id"], string>>,
): Etapa[] {
  const idxAtual = indiceEtapaPorStatus(statusAtual);
  const ehRetirada = tipoEntrega === "feira";

  // PENDENTE: etapa 0 ativa (não concluída ainda), descrição diferente
  const tituloConfirmado = "Pedido Confirmado";
  const descricaoConfirmado =
    statusAtual === "PENDENTE"
      ? "Aguardando confirmação do feirante"
      : "Seu pedido foi confirmado e será preparado";

  const tituloSaida = ehRetirada ? "Pedido Pronto" : "Saiu para Entrega";
  const descricaoSaida = ehRetirada
    ? "Seu pedido está pronto para retirada na banca"
    : "Seu pedido está a caminho do endereço de entrega";

  const etapas: Etapa[] = [
    {
      id: "confirmado",
      titulo: tituloConfirmado,
      descricao: descricaoConfirmado,
      horario: horariosPorEtapa.confirmado ?? "",
      concluido: idxAtual > 0,
      ativo: idxAtual === 0,
    },
    {
      id: "preparando",
      titulo: "Preparando Pedido",
      descricao: "O feirante está separando seus produtos",
      horario: horariosPorEtapa.preparando ?? "",
      concluido: idxAtual > 1,
      ativo: idxAtual === 1,
    },
    {
      id: "saida",
      titulo: tituloSaida,
      descricao: descricaoSaida,
      horario: horariosPorEtapa.saida ?? "",
      concluido: idxAtual > 2,
      ativo: idxAtual === 2,
    },
    {
      id: "entregue",
      titulo: "Pedido Entregue",
      descricao: ehRetirada
        ? "Pedido retirado com sucesso"
        : "Pedido entregue com sucesso",
      horario: horariosPorEtapa.entregue ?? "",
      concluido: idxAtual >= 3,
      ativo: false,
    },
  ];
  return etapas;
}

function formatHora(d?: string) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function montarEnderecoTexto(p: PedidoApi["usuario"]): string {
  if (!p) return "Endereço não cadastrado";
  const rua = [p.endereco, p.numero].filter(Boolean).join(", ");
  const cidadeUf = [p.cidade, p.uf].filter(Boolean).join(" - ");
  return [rua, p.bairro, cidadeUf].filter(Boolean).join(" · ") || "Endereço não cadastrado";
}

export default function AcompanharPedidoScreen() {
  const { id } = useLocalSearchParams();
  const pedidoId = Array.isArray(id) ? id[0] : id;
  const { user } = useUser();

  const [pedido, setPedido] = useState<PedidoApi | null>(null);
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>("endereco");
  const [enderecoFallback, setEnderecoFallback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!pedidoId) {
      setErro("Pedido inválido");
      setLoading(false);
      return;
    }
    if (!user?.id) {
      setErro("Faça login para acompanhar seus pedidos");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErro(null);
    try {
      // /pedido/usuario/:id já traz só os pedidos do user (com items).
      // /pedido/:id direto exige nível admin — não usamos aqui.
      const res = await fetch(
        `${API_BASE.replace(/\/$/, "")}/pedido/usuario/${user.id}`,
        {
          headers: user.token
            ? { Authorization: `Bearer ${user.token}` }
            : undefined,
        },
      );
      if (!res.ok) {
        setErro(res.status === 401 ? "Sessão expirada" : `Erro ${res.status}`);
        return;
      }
      const lista = await res.json();
      const alvo = (Array.isArray(lista) ? lista : []).find(
        (p: any) => String(p.id) === String(pedidoId),
      );
      if (!alvo) {
        setErro("Pedido não encontrado no seu histórico");
        return;
      }
      setPedido(alvo);
    } catch (e: any) {
      console.error("[AcompanharPedido] erro:", e);
      setErro("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }, [pedidoId, user?.id, user?.token]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Carrega tipo de entrega salvo no checkout (chave dadosFinalizarPedido)
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("dadosFinalizarPedido");
        if (raw) {
          const dados = JSON.parse(raw);
          if (dados?.tipoEntrega === "feira" || dados?.tipoEntrega === "endereco") {
            setTipoEntrega(dados.tipoEntrega);
          }
          if (dados?.endereco) setEnderecoFallback(String(dados.endereco));
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  // Endereço REAL do usuário do pedido; usa AsyncStorage só se o cadastro estiver vazio
  const enderecoExibir = useMemo(() => {
    if (!pedido?.usuario) return enderecoFallback ?? "Endereço não cadastrado";
    const texto = montarEnderecoTexto(pedido.usuario);
    if (texto && texto !== "Endereço não cadastrado") return texto;
    return enderecoFallback ?? texto;
  }, [pedido?.usuario, enderecoFallback]);

  const cancelado = pedido?.status === "CANCELADO";

  // Horários por etapa: confirmado e entregue ganham timestamps reais quando aplicável
  const horariosPorEtapa = useMemo(() => {
    const horarios: Partial<Record<Etapa["id"], string>> = {};
    if (!pedido) return horarios;
    const idx = indiceEtapaPorStatus(pedido.status);
    if (idx > 0) horarios.confirmado = formatHora(pedido.createdAt);
    if (idx >= 3 && pedido.updatedAt) horarios.entregue = formatHora(pedido.updatedAt);
    return horarios;
  }, [pedido]);

  const etapas = useMemo(
    () => montarEtapas(pedido?.status ?? "PENDENTE", tipoEntrega, horariosPorEtapa),
    [pedido?.status, tipoEntrega, horariosPorEtapa],
  );

  const etapaAtiva = etapas.find((s) => s.ativo) ?? null;
  const totalConcluidoOuEntregue =
    etapas[etapas.length - 1].concluido;

  // Texto auxiliar embaixo do status
  const subtituloStatus = useMemo(() => {
    if (cancelado) return "Este pedido foi cancelado.";
    if (totalConcluidoOuEntregue) {
      return tipoEntrega === "feira" ? "Pedido retirado!" : "Pedido entregue!";
    }
    if (etapaAtiva) return etapaAtiva.descricao;
    return "Aguardando confirmação";
  }, [cancelado, totalConcluidoOuEntregue, etapaAtiva, tipoEntrega]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Acompanhar Pedido</Text>
        <TouchableOpacity onPress={carregar}>
          <Ionicons name="refresh" size={22} color="#333" />
        </TouchableOpacity>
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
      ) : !pedido ? (
        <View style={styles.centro}>
          <Text style={styles.erroText}>Pedido não encontrado</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Card de Status Atual */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.pedidoNumero}>Pedido #{pedido.id}</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: cancelado
                      ? "#DC2626"
                      : totalConcluidoOuEntregue
                      ? "#10B981"
                      : "#FF6B35",
                  },
                ]}
              >
                <Text style={styles.statusBadgeText}>
                  {cancelado
                    ? "Cancelado"
                    : totalConcluidoOuEntregue
                    ? tipoEntrega === "feira"
                      ? "Retirado"
                      : "Entregue"
                    : etapaAtiva?.titulo ?? "Aguardando"}
                </Text>
              </View>
            </View>

            <View style={styles.tempoEstimado}>
              <Ionicons
                name={cancelado ? "close-circle" : totalConcluidoOuEntregue ? "checkmark-circle" : "time"}
                size={20}
                color={cancelado ? "#DC2626" : totalConcluidoOuEntregue ? "#10B981" : "#2D5D31"}
              />
              <Text
                style={[
                  styles.tempoEstimadoTexto,
                  cancelado && { color: "#DC2626" },
                  totalConcluidoOuEntregue && { color: "#065F46" },
                ]}
              >
                {subtituloStatus}
              </Text>
            </View>
          </View>

          {/* Timeline do Pedido — escondida se cancelado */}
          {!cancelado && (
            <View style={styles.timelineContainer}>
              <Text style={styles.timelineTitle}>Status do Pedido</Text>

              {etapas.map((etapa, index) => (
                <View key={etapa.id} style={styles.timelineItem}>
                  <View style={styles.timelineIconContainer}>
                    {etapa.concluido ? (
                      <Ionicons name="checkmark-circle" size={24} color="#2D5D31" />
                    ) : etapa.ativo ? (
                      <Ionicons name="ellipse" size={24} color="#FF6B35" />
                    ) : (
                      <Ionicons name="ellipse-outline" size={24} color="#CCC" />
                    )}
                    {index < etapas.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          {
                            backgroundColor: etapa.concluido ? "#2D5D31" : "#E5E5E5",
                          },
                        ]}
                      />
                    )}
                  </View>

                  <View style={styles.timelineContent}>
                    <View style={styles.timelineHeader}>
                      <Text
                        style={[
                          styles.timelineTitulo,
                          {
                            color:
                              etapa.concluido || etapa.ativo ? "#333" : "#999",
                          },
                        ]}
                      >
                        {etapa.titulo}
                      </Text>
                      {etapa.horario ? (
                        <Text style={styles.timelineHorario}>{etapa.horario}</Text>
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.timelineDescricao,
                        {
                          color:
                            etapa.concluido || etapa.ativo ? "#666" : "#999",
                        },
                      ]}
                    >
                      {etapa.descricao}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Card de Informações de Entrega/Retirada */}
          <View style={styles.entregaCard}>
            <View style={styles.entregaHeader}>
              <Ionicons
                name={tipoEntrega === "feira" ? "storefront" : "location"}
                size={20}
                color="#2D5D31"
              />
              <Text style={styles.entregaTitle}>
                {tipoEntrega === "feira" ? "Local de Retirada" : "Endereço de Entrega"}
              </Text>
            </View>
            <Text style={styles.entregaEndereco}>
              {tipoEntrega === "feira" ? "Feira Central · Banca do feirante" : enderecoExibir}
            </Text>
            {pedido.usuario?.nome && tipoEntrega === "endereco" && (
              <Text style={styles.entregaReferencia}>
                Destinatário: {pedido.usuario.nome}
              </Text>
            )}
          </View>

          {/* Botão de voltar */}
          <View style={styles.botoesContainer}>
            <TouchableOpacity
              style={styles.botaoSecundario}
              onPress={() => router.push("/home")}
            >
              <Text style={styles.botaoSecundarioTexto}>Voltar ao Início</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7E4" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 44,
    paddingBottom: 20,
    backgroundColor: "#FFF7E4",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  scrollView: { flex: 1 },

  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  erroText: { fontSize: 14, color: "#666", textAlign: "center" },
  botaoRetry: {
    backgroundColor: "#4A7C59",
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  botaoRetryText: { color: "#FFF", fontWeight: "700" },

  statusCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  pedidoNumero: { fontSize: 18, fontWeight: "bold", color: "#333" },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusBadgeText: { color: "#FFF", fontSize: 12, fontWeight: "600" },
  tempoEstimado: { flexDirection: "row", alignItems: "center", gap: 8 },
  tempoEstimadoTexto: { fontSize: 15, color: "#2D5D31", fontWeight: "600", flex: 1 },

  timelineContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  timelineTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 20 },
  timelineItem: { flexDirection: "row", marginBottom: 20 },
  timelineIconContainer: { alignItems: "center", marginRight: 16, position: "relative" },
  timelineLine: { width: 2, height: 40, marginTop: 8 },
  timelineContent: { flex: 1 },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  timelineTitulo: { fontSize: 16, fontWeight: "600" },
  timelineHorario: { fontSize: 14, color: "#666" },
  timelineDescricao: { fontSize: 14, lineHeight: 20 },

  entregaCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  entregaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  entregaTitle: { fontSize: 16, fontWeight: "600", color: "#333" },
  entregaEndereco: { fontSize: 15, color: "#333", marginBottom: 4 },
  entregaReferencia: { fontSize: 13, color: "#666" },

  botoesContainer: { paddingHorizontal: 20, gap: 12 },
  botaoSecundario: { alignItems: "center", paddingVertical: 12 },
  botaoSecundarioTexto: {
    color: "#666",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  bottomSpacer: { height: 30 },
});
