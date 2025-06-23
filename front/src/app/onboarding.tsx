import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

interface BenefitCardProps {
  emoji: string;
  title: string;
  description: string;
}

function BenefitCard({ emoji, title, description }: BenefitCardProps) {
  return (
    <View style={styles.benefitCard}>
      <Text style={styles.benefitEmoji}>{emoji}</Text>
      <Text style={styles.benefitTitle}>{title}</Text>
      <Text style={styles.benefitDescription}>{description}</Text>
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeTitle}>Bem-vindo ao Feirô!</Text>
        <Text style={styles.welcomeSubtitle}>
          Sua feira online com produtos{"\n"}frescos e de qualidade
        </Text>
      </View>

      {/* Cards de Benefícios */}
      <View style={styles.benefitsContainer}>
        <BenefitCard
          emoji="🥕"
          title="Produtos Frescos"
          description="Frutas e verduras selecionadas direto dos produtores"
        />

        <BenefitCard
          emoji="🚀"
          title="Entrega Rápida"
          description="Receba seus produtos em casa no mesmo dia"
        />

        <BenefitCard
          emoji="💰"
          title="Preços Justos"
          description="Os melhores preços sem intermediários"
        />

        <BenefitCard
          emoji="🌱"
          title="Sustentável"
          description="Apoie produtores locais e o meio ambiente"
        />
      </View>

      {/* Botões */}
      <View style={styles.buttonsContainer}>
        <Pressable
          style={styles.comecarButton}
          onPress={() => router.replace("/home")}
        >
          <Text style={styles.comecarButtonText}>Começar a comprar</Text>
        </Pressable>

        <Pressable
          style={styles.loginButton}
          onPress={() => router.replace("/login")}
        >
          <Text style={styles.loginButtonText}>Já tenho uma conta</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7E4",
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#255336",
    textAlign: "center",
    marginBottom: 16,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#4A4A4A",
    textAlign: "center",
    lineHeight: 24,
  },
  benefitsContainer: {
    flex: 1,
    gap: 16,
    marginBottom: 40,
  },
  benefitCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  benefitEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#255336",
    marginBottom: 8,
    textAlign: "center",
  },
  benefitDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  buttonsContainer: {
    gap: 12,
  },
  comecarButton: {
    backgroundColor: "#255336",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  comecarButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: "transparent",
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonText: {
    color: "#255336",
    fontSize: 16,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
