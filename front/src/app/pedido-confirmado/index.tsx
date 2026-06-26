/**
 * Tela: Pedido confirmado.
 *
 * Recebe via params (router.push) os dados reais do pedido recém criado:
 *  - id          → número do pedido (vindo da API)
 *  - total       → valor total já formatado (sem o "R$")
 *  - endereco    → endereço resumido de entrega (vazio quando retirada)
 *  - tipoEntrega → "endereco" | "feira"
 *  - horario     → janela escolhida pelo cliente
 *  - pagamento   → método (Cartão, PIX, Dinheiro)
 *
 * Nada é mockado — sem params, exibe placeholders neutros ("—").
 */

import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCesta } from "../../contexts/CestaContext";

type Params = {
  id?: string;
  total?: string;
  endereco?: string;
  tipoEntrega?: "endereco" | "feira";
  horario?: string;
  pagamento?: string;
};

export default function PedidoConfirmadoScreen() {
  const raw = useLocalSearchParams<Params>();
  // Reset preventivo do flag de cesta recorrente — evita que estado residual
  // de fluxos anteriores (cliente clicou "Tornar cesta recorrente" antes)
  // afete a navegação a partir desta tela.
  const { state: cestaState, resetarCestaRecorrente } = useCesta();
  React.useEffect(() => {
    if (cestaState.cestaRecorrenteId != null) {
      resetarCestaRecorrente();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useLocalSearchParams pode devolver string ou string[]; normaliza.
  const pick = (v: string | string[] | undefined): string =>
    Array.isArray(v) ? v[0] ?? "" : v ?? "";

  const idStr = pick(raw.id);
  const totalStr = pick(raw.total);
  const enderecoStr = pick(raw.endereco);
  const tipoEntrega: "endereco" | "feira" =
    (pick(raw.tipoEntrega) as "endereco" | "feira") || "endereco";
  const horarioStr = pick(raw.horario);
  const pagamentoStr = pick(raw.pagamento);

  // Número do pedido formatado: "#FEIRO00042" (zero-padded de 5 dígitos)
  const numeroPedido = idStr
    ? `#FEIRO${idStr.padStart(5, "0")}`
    : "#FEIRO—";

  // Total já chega como "10.80"; formata em R$.
  const totalFormatado = totalStr
    ? `R$ ${Number(totalStr).toFixed(2).replace(".", ",")}`
    : "—";

  const ehEntrega = tipoEntrega === "endereco";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={40} color="#FFF" />
        </View>

        <Text style={styles.title}>Pedido Confirmado!</Text>
        <Text style={styles.subtitle}>Obrigado por comprar na Feirô</Text>

        <View style={styles.infoCard}>
          {/* Número do Pedido */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="receipt" size={16} color="#2D5D31" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Número do Pedido</Text>
              <Text style={styles.infoValue}>{numeroPedido}</Text>
            </View>
          </View>

          {/* Endereço de Entrega / Local de Retirada */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="location" size={16} color="#2D5D31" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>
                {ehEntrega ? "Endereço de Entrega" : "Local de Retirada"}
              </Text>
              <Text style={styles.infoValue}>
                {ehEntrega
                  ? enderecoStr || "—"
                  : "Feira do João - Banca 23"}
              </Text>
            </View>
          </View>

          {/* Previsão / Horário */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="time" size={16} color="#2D5D31" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>
                {ehEntrega ? "Previsão de Entrega" : "Horário de Retirada"}
              </Text>
              <Text style={styles.infoValue}>{horarioStr || "—"}</Text>
            </View>
          </View>

          {/* Forma de pagamento */}
          {pagamentoStr ? (
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="card" size={16} color="#2D5D31" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Pagamento</Text>
                <Text style={styles.infoValue}>{pagamentoStr}</Text>
              </View>
            </View>
          ) : null}

          {/* Valor Total */}
          <View style={[styles.infoRow, { marginBottom: 0 }]}>
            <View style={styles.iconContainer}>
              <Ionicons name="wallet" size={16} color="#2D5D31" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Valor Total</Text>
              <Text style={styles.infoValueTotal}>{totalFormatado}</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonsContainer}>
          {/* Acompanhar Pedido — primário, sempre que há um id válido.
              Pra entrega no endereço, mostra trajeto/etapas; pra retirada
              na feira, mostra o status atual do pedido (mesma tela). */}
          {idStr ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() =>
                router.push({
                  pathname: "/acompanhar-pedido/[id]",
                  params: { id: idStr },
                })
              }
            >
              <Ionicons
                name={ehEntrega ? "car" : "storefront"}
                size={20}
                color="#FFF"
              />
              <Text style={styles.primaryButtonText}>Acompanhar Pedido</Text>
            </TouchableOpacity>
          ) : null}

          {/* Meus Pedidos — secundário (sempre visível). Dá uma rota direta
              caso o cliente queira ver histórico em vez de o pedido específico,
              e elimina a tentação de buscar isso pela navbar (que tem
              'Recorrente' → /minhas-cestas, fácil de confundir). */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/meus-pedidos")}
          >
            <Ionicons name="receipt-outline" size={20} color="#2D5D31" />
            <Text style={styles.secondaryButtonText}>Ver meus pedidos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/home")}
          >
            <Ionicons name="home" size={20} color="#2D5D31" />
            <Text style={styles.secondaryButtonText}>Voltar para Home</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7E4" },
  scrollView: { flex: 1 },
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
  infoTextContainer: { flex: 1 },
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
  buttonsContainer: { width: "100%", gap: 12 },
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
  bottomSpacer: { height: 30 },
});
