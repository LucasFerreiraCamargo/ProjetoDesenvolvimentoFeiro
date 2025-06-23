import { useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export default function SplashScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>
          Da feira para sua casa em{"\n"}poucos cliques
        </Text>

        {/* Ícones decorativos */}
        <View style={styles.iconsContainer}>
          <Text style={styles.icon}>🥕</Text>
          <Text style={styles.icon}>🥬</Text>
          <Text style={styles.icon}>🍎</Text>
        </View>
      </View>

      {/* Botões */}
      <View style={styles.buttonsContainer}>
        <Pressable
          style={styles.entrarButton}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.entrarButtonText}>Entrar</Text>
        </Pressable>

        <Pressable
          style={styles.criarContaButton}
          onPress={() => router.push("/onboarding")}
        >
          <Text style={styles.criarContaButtonText}>Criar conta</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7E4",
    justifyContent: "space-between",
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  logoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 200,
    height: 120,
    marginBottom: 40,
  },
  tagline: {
    fontSize: 16,
    color: "#4A4A4A",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  iconsContainer: {
    flexDirection: "row",
    gap: 20,
  },
  icon: {
    fontSize: 24,
  },
  buttonsContainer: {
    gap: 16,
  },
  entrarButton: {
    backgroundColor: "#255336",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  entrarButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  criarContaButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#255336",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  criarContaButtonText: {
    color: "#255336",
    fontSize: 16,
    fontWeight: "600",
  },
});
