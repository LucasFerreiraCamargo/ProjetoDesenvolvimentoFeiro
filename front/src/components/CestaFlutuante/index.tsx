/**
 * CestaFlutuante — botão verde fixo no canto inferior direito que aparece
 * sempre que o cliente tem itens no carrinho. Estilo iFood: serve como
 * atalho global pra abrir a cesta sem precisar voltar pela navbar.
 *
 * Lê `getTotalItens()` do CestaContext e some quando a cesta fica vazia.
 * O badge vermelho mostra a quantidade de itens distintos (não a soma das
 * quantidades) — mesma regra do botão original que estava na tela de
 * produtos do feirante.
 */

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useCesta } from "../../contexts/CestaContext";

interface Props {
  /**
   * Distância do bottom em px. O layout passa um valor maior quando há
   * navbar visível (pra não sobrepor) e 20 quando não tem navbar.
   */
  bottomOffset?: number;
}

const CestaFlutuante: React.FC<Props> = ({ bottomOffset = 90 }) => {
  const { getTotalItens } = useCesta();
  const totalItens = getTotalItens();

  if (totalItens <= 0) return null;

  return (
    <TouchableOpacity
      style={[styles.botao, { bottom: bottomOffset }]}
      onPress={() => router.push("/cesta/cesta")}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Abrir cesta com ${totalItens} ${totalItens === 1 ? "item" : "itens"}`}
    >
      <Ionicons name="bag" size={24} color="#FFF" />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{totalItens}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  botao: {
    position: "absolute",
    right: 20,
    backgroundColor: "#4A7C59",
    borderRadius: 28,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 50,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#E74C3C",
    borderRadius: 11,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  badgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
});

export default CestaFlutuante;
