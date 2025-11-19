import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface StatusPedido {
  id: string;
  titulo: string;
  descricao: string;
  horario: string;
  concluido: boolean;
  ativo: boolean;
}

export default function AcompanharPedidoScreen() {
  const { id } = useLocalSearchParams();
  const pedidoId = Array.isArray(id) ? id[0] : id || "25987";

  const [statusPedido, setStatusPedido] = useState<StatusPedido[]>([
    {
      id: "confirmado",
      titulo: "Pedido Confirmado",
      descricao: "Seu pedido foi confirmado e está sendo preparado",
      horario: "14:32",
      concluido: true,
      ativo: false,
    },
    {
      id: "preparando",
      titulo: "Preparando Pedido",
      descricao: "O feirante está separando seus produtos",
      horario: "14:45",
      concluido: true,
      ativo: false,
    },
    {
      id: "pronto",
      titulo: "Pedido Pronto",
      descricao: "Seu pedido está pronto e aguardando retirada",
      horario: "15:10",
      concluido: true,
      ativo: true,
    },
    {
      id: "saiu-entrega",
      titulo: "Saiu para Entrega",
      descricao: "Seu pedido está a caminho do endereço de entrega",
      horario: "",
      concluido: false,
      ativo: false,
    },
    {
      id: "entregue",
      titulo: "Pedido Entregue",
      descricao: "Seu pedido foi entregue com sucesso",
      horario: "",
      concluido: false,
      ativo: false,
    },
  ]);

  const [tempoEstimado, setTempoEstimado] = useState("15-25 min");

  useEffect(() => {
    // Simular atualização do status do pedido
    const interval = setInterval(() => {
      setStatusPedido((prev) => {
        const newStatus = [...prev];
        const proximoIndex = newStatus.findIndex((status) => !status.concluido);

        if (proximoIndex !== -1 && proximoIndex < newStatus.length) {
          // Desativar status atual
          const ativoIndex = newStatus.findIndex((status) => status.ativo);
          if (ativoIndex !== -1) {
            newStatus[ativoIndex].ativo = false;
          }

          // Ativar próximo status
          newStatus[proximoIndex].concluido = true;
          newStatus[proximoIndex].ativo = true;
          newStatus[proximoIndex].horario = new Date().toLocaleTimeString(
            "pt-BR",
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          );

          // Atualizar tempo estimado
          if (proximoIndex === 3) {
            // Saiu para entrega
            setTempoEstimado("10-15 min");
          } else if (proximoIndex === 4) {
            // Entregue
            setTempoEstimado("Entregue!");
          }
        }

        return newStatus;
      });
    }, 10000); // Atualiza a cada 10 segundos para demonstração

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: StatusPedido) => {
    if (status.concluido) {
      return <Ionicons name="checkmark-circle" size={24} color="#2D5D31" />;
    } else if (status.ativo) {
      return <Ionicons name="ellipse" size={24} color="#FF6B35" />;
    } else {
      return <Ionicons name="ellipse-outline" size={24} color="#CCC" />;
    }
  };

  const statusAtivo = statusPedido.find((status) => status.ativo);
  const pedidoEntregue = statusPedido[statusPedido.length - 1].concluido;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Acompanhar Pedido</Text>
        <TouchableOpacity>
          <Ionicons name="help-circle-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Card de Status Atual */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.pedidoNumero}>Pedido #FEIRO{pedidoId}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: pedidoEntregue ? "#10B981" : "#FF6B35" },
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {pedidoEntregue
                  ? "Entregue"
                  : statusAtivo?.titulo || "Em andamento"}
              </Text>
            </View>
          </View>

          {!pedidoEntregue && (
            <View style={styles.tempoEstimado}>
              <Ionicons name="time" size={20} color="#2D5D31" />
              <Text style={styles.tempoEstimadoTexto}>
                Tempo estimado: {tempoEstimado}
              </Text>
            </View>
          )}
        </View>

        {/* Timeline do Pedido */}
        <View style={styles.timelineContainer}>
          <Text style={styles.timelineTitle}>Status do Pedido</Text>

          {statusPedido.map((status, index) => (
            <View key={status.id} style={styles.timelineItem}>
              <View style={styles.timelineIconContainer}>
                {getStatusIcon(status)}
                {index < statusPedido.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      {
                        backgroundColor: status.concluido
                          ? "#2D5D31"
                          : "#E5E5E5",
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
                          status.concluido || status.ativo ? "#333" : "#999",
                      },
                    ]}
                  >
                    {status.titulo}
                  </Text>
                  {status.horario && (
                    <Text style={styles.timelineHorario}>{status.horario}</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.timelineDescricao,
                    {
                      color: status.concluido || status.ativo ? "#666" : "#999",
                    },
                  ]}
                >
                  {status.descricao}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Card de Informações de Entrega */}
        <View style={styles.entregaCard}>
          <View style={styles.entregaHeader}>
            <Ionicons name="location" size={20} color="#2D5D31" />
            <Text style={styles.entregaTitle}>Endereço de Entrega</Text>
          </View>
          <Text style={styles.entregaEndereco}>
            Rua das Flores, 123 - Jardim Primavera
          </Text>
          <Text style={styles.entregaReferencia}>
            Próximo ao mercado central
          </Text>
        </View>

        {/* Botões de Ação */}
        <View style={styles.botoesContainer}>
          {!pedidoEntregue && (
            <TouchableOpacity style={styles.botaoContato}>
              <Ionicons name="call" size={20} color="#2D5D31" />
              <Text style={styles.botaoContatoTexto}>
                Ligar para Entregador
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.botaoSecundario}
            onPress={() => router.push("/home")}
          >
            <Text style={styles.botaoSecundarioTexto}>Voltar ao Início</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

    </SafeAreaView>
  );
}

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
    paddingTop: 44,
    paddingBottom: 20,
    backgroundColor: "#FFF7E4",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
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
  pedidoNumero: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusBadgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  tempoEstimado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tempoEstimadoTexto: {
    fontSize: 16,
    color: "#2D5D31",
    fontWeight: "600",
  },
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
  timelineTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 20,
  },
  timelineIconContainer: {
    alignItems: "center",
    marginRight: 16,
    position: "relative",
  },
  timelineLine: {
    width: 2,
    height: 40,
    marginTop: 8,
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  timelineTitulo: {
    fontSize: 16,
    fontWeight: "600",
  },
  timelineHorario: {
    fontSize: 14,
    color: "#666",
  },
  timelineDescricao: {
    fontSize: 14,
    lineHeight: 20,
  },
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
  entregaTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  entregaEndereco: {
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
  },
  entregaReferencia: {
    fontSize: 14,
    color: "#666",
  },
  botoesContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  botaoContato: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: "#2D5D31",
    gap: 8,
  },
  botaoContatoTexto: {
    color: "#2D5D31",
    fontSize: 16,
    fontWeight: "bold",
  },
  botaoSecundario: {
    alignItems: "center",
    paddingVertical: 12,
  },
  botaoSecundarioTexto: {
    color: "#666",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  bottomSpacer: {
    height: 30,
  },
});
