import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function RegisterScreen() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");

  const handleRegister = async () => {
    try {
      // Endereço é tratado como sub-objeto `endereco_inicial` — o backend
      // cria o Usuario e o EnderecoUsuario "Casa" (principal) em uma única
      // transação. Se o cliente não preencher endereço, cadastra só o user
      // e ele adiciona depois em /perfil/enderecos.
      const payload: any = { nome, email, senha, telefone };
      if (endereco.trim() && bairro.trim()) {
        payload.endereco_inicial = {
          endereco: endereco.trim(),
          bairro: bairro.trim(),
        };
      }
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Usuário cadastrado com sucesso!");
        router.replace("/"); // volta para login
      } else {
        alert(data.error || "Erro ao cadastrar usuário");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão com servidor");
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo
      <View style={styles.logoContainer}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>Criar conta</Text>
      </View> */}

      {/* Card de Cadastro */}
      <View style={styles.loginCard}>
        <Text style={styles.loginTitle}>Cadastro</Text>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nome completo"
            value={nome}
            onChangeText={setNome}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Telefone"
            value={telefone}
            onChangeText={setTelefone}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Endereço"
            value={endereco}
            onChangeText={setEndereco}
          />
          <TextInput
            style={styles.input}
            placeholder="Bairro"
            value={bairro}
            onChangeText={setBairro}
          />

          <Pressable style={styles.entrarButton} onPress={handleRegister}>
            <Text style={styles.entrarButtonText}>Cadastrar</Text>
          </Pressable>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Já tem conta? </Text>
            <Pressable onPress={() => router.replace("/")}>
              <Text style={styles.footerLink}>Entrar</Text>
            </Pressable>
          </View>
        </View>
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
