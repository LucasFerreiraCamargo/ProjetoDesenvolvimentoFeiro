import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useUser } from "../../contexts/UserContext";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator, // <--- 1. Importado aqui
} from "react-native";
import BotaoVoltar from "../../components/BotaoVoltar";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false); // <--- 2. Novo estado de carregamento
  const { setUser } = useUser();

  const handleLogin = async () => {
    // Se já estiver carregando, não faz nada (evita duplo clique)
    if (isLoading) return;

    setIsLoading(true); // <--- Ativa o loading

    const API_BASE = (process.env.EXPO_PUBLIC_API_URL as string) || "http://localhost:3001";
    
    try {
      const response = await fetch(`${API_BASE.replace(/\/$/, "")}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Se der erro, paramos o loading aqui para mostrar o alerta
        setIsLoading(false); 
        alert(data.erro || data.message || "Erro ao fazer login");
        return;
      }

      console.log("Login OK:", data);

      try {
        setUser({
          id: data.id,
          nome: data.nome,
          email: data.email,
          token: data.token,
          nivel: data.nivel as any,
          telefone: data.telefone,
          endereco: data.endereco,
          numero: data.numero ?? null,
          bairro: data.bairro,
          cep: data.cep ?? null,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          avatar: undefined,
          membro_desde: undefined,
        } as any);
      } catch (e) {
        console.warn("Falha ao salvar usuário no contexto:", e);
      }

      // Não precisamos dar setIsLoading(false) aqui porque vamos mudar de tela
      router.replace("/home");
      
    } catch (err) {
      console.error(err);
      alert("Erro de conexão");
      setIsLoading(false); // <--- Desativa o loading em caso de erro de rede
    }
  };

  return (
    <View style={styles.container}>
      <BotaoVoltar destinoFallback="/" />
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require("../../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>Sua feira online</Text>
      </View>

      {/* Card de Login */}
      <View style={styles.loginCard}>
        <Text style={styles.loginTitle}>Login</Text>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading} // Bloqueia input enquanto carrega
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#999"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              editable={!isLoading} // Bloqueia input enquanto carrega
            />
          </View>

          <Pressable style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
          </Pressable>

          {/* --- 4. Botão Atualizado com a Animação --- */}
          <Pressable
            style={[styles.entrarButton, isLoading && styles.entrarButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.entrarButtonText}>Entrar</Text>
            )}
          </Pressable>

          <Pressable style={styles.googleButton} disabled={isLoading}>
            <Ionicons name="logo-google" size={20} color="#4285F4" />
            <Text style={styles.googleButtonText}>Continuar com Google</Text>
          </Pressable>
        </View>
      </View>

      {/* Link para criar conta */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>Ainda não tem uma conta? </Text>
        <Pressable onPress={() => router.replace("../onboarding/index.tsx")} disabled={isLoading}>
          <Text style={styles.footerLink}>Cadastre-se</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7E4",
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 60,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#4A4A4A",
  },
  loginCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 32,
  },
  formContainer: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
  },
  forgotPassword: {
    alignSelf: "flex-end",
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#255336",
  },
  entrarButton: {
    backgroundColor: "#255336",
    height: 56,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  // Estilo opcional para dar feedback visual que está desabilitado
  entrarButtonDisabled: {
    opacity: 0.7, 
  },
  entrarButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    height: 56,
    borderRadius: 8,
    gap: 12,
  },
  googleButtonText: {
    fontSize: 16,
    color: "#333",
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#666",
  },
  footerLink: {
    fontSize: 14,
    color: "#255336",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});