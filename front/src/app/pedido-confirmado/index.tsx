import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";


interface PedidoInfo {
  numero: string;
  endereco: string;
  horario: string;
  total: string;
  tipoEntrega: "entrega" | "retirada";
  metodoPagamento: string;
}

export default function PedidoConfirmadoScreen() {
  const [pedidoInfo, setPedidoInfo] = useState<PedidoInfo>({
    numero: "#FEIRO25987",
    endereco: "Rua das Flores, 123 - Jardim Primavera",
    horario: "Hoje, entre 14:00 - 15:00",
    total: "R$ 10,80",
    tipoEntrega: "entrega",
    metodoPagamento: "Cartão de Crédito",
  });

  useEffect(() => {
    carregarDadosPedido();
  }, []);

  const carregarDadosPedido = async () => {
    try {
      const dadosFormulario = await AsyncStorage.getItem(
        "dadosFinalizarPedido"
      );
      if (dadosFormulario) {
        const dados = JSON.parse(dadosFormulario);
        setPedidoInfo((prev) => ({
          ...prev,
          tipoEntrega: dados.tipoEntrega || "entrega",
          endereco: dados.endereco || prev.endereco,
          horario: dados.horario || prev.horario,
          metodoPagamento: dados.metodoPagamento || prev.metodoPagamento,
        }));
      }
    } catch (error) {
      console.log("Erro ao carregar dados do pedido:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Ícone de Sucesso */}
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={40} color="#FFF" />
        </View>

        {/* Título */}
        <Text style={styles.title}>Pedido Confirmado!</Text>
        <Text style={styles.subtitle}>Obrigado por comprar na Feirô</Text>

        {/* Card de Informações */}
        <View style={styles.infoCard}>
          {/* Número do Pedido */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Número do Pedido</Text>
            <Text style={styles.infoValue}>{pedidoInfo.numero}</Text>
          </View>

          {/* Endereço de Entrega */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="location" size={16} color="#2D5D31" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>
                {pedidoInfo.tipoEntrega === "entrega"
                  ? "Endereço de Entrega"
                  : "Local de Retirada"}
              </Text>
              <Text style={styles.infoValue}>
                {pedidoInfo.tipoEntrega === "entrega"
                  ? pedidoInfo.endereco
                  : "Feira do João - Banca 23"}
              </Text>
            </View>
          </View>

          {/* Previsão de Entrega */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="time" size={16} color="#2D5D31" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>
                {pedidoInfo.tipoEntrega === "entrega"
                  ? "Previsão de Entrega"
                  : "Horário de Retirada"}
              </Text>
              <Text style={styles.infoValue}>{pedidoInfo.horario}</Text>
            </View>
          </View>

          {/* Valor Total */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="wallet" size={16} color="#2D5D31" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Valor Total</Text>
              <Text style={styles.infoValueTotal}>{pedidoInfo.total}</Text>
            </View>
          </View>
        </View>

        {/* Botões */}
        <View style={styles.buttonsContainer}>
          {/* Botão Acompanhar Pedido - só aparece se for entrega */}
          {pedidoInfo.tipoEntrega === "entrega" && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                const pedidoId = pedidoInfo.numero.replace("#FEIRO", "");
                // router.push(`/acompanhar-pedido?id=${pedidoId}`);
                router.push(`/acompanhar-pedido/${pedidoId}`);
              }}
            >
              <Ionicons name="car" size={20} color="#FFF" />
              <Text style={styles.primaryButtonText}>Acompanhar Pedido</Text>
            </TouchableOpacity>
          )}

          {/* Botão Voltar para Home */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/home")}
          >
            <Ionicons name="home" size={20} color="#2D5D31" />
            <Text style={styles.secondaryButtonText}>Voltar para Home</Text>
          </TouchableOpacity>
        </View>

        {/* Espaçamento para a barra de navegação */}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2D5D31",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
  },
  infoCard: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  iconContainer: {
    width: 24,
    marginRight: 12,
    alignItems: "center",
    paddingTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  infoValueTotal: {
    fontSize: 18,
    color: "#2D5D31",
    fontWeight: "bold",
  },
  buttonsContainer: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2D5D31",
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
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
  secondaryButtonText: {
    color: "#2D5D31",
    fontSize: 16,
    fontWeight: "bold",
  },
  bottomSpacer: {
    height: 30,
  },
});
