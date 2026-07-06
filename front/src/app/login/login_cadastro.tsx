import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import BotaoVoltar from "../../components/BotaoVoltar";

// Base da API: mesma resolução usada no login (fallback local + strip da
// barra final pra não gerar "//usuarios").
const API_BASE = (
  (process.env.EXPO_PUBLIC_API_URL as string) || "http://localhost:3001"
).replace(/\/$/, "");

// Só dígitos — o backend exige telefone com 10-11 dígitos, sem máscara.
const soDigitos = (v: string) => v.replace(/\D/g, "");

// Extrai a primeira mensagem legível do corpo de erro da API. O /usuarios
// retorna { erro: [...] } (array Zod) em falha de validação, ou { erro: "..." }
// em outros casos. O código antigo lia `data.error` e nunca achava nada.
const extrairMensagemErro = (data: any): string | null => {
  const e = data?.erro ?? data?.error;
  if (!e) return null;
  if (typeof e === "string") return e;
  if (Array.isArray(e)) return e[0]?.message ?? "Dados inválidos";
  if (typeof e?.message === "string") return e.message;
  return null;
};

export default function RegisterScreen() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  // Art. 7°, I / Art. 8° LGPD — consentimento livre, informado e inequívoco.
  // O cadastro só é enviado com este flag em true.
  const [aceitouLgpd, setAceitouLgpd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validação client-side espelhando as regras do backend, pra dar
  // feedback imediato antes de bater na rede.
  const validar = (): string | null => {
    if (nome.trim().length < 2) return "Informe seu nome completo.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return "Informe um e-mail válido.";
    if (senha.length < 8)
      return "A senha deve ter no mínimo 8 caracteres.";
    if (!/[A-Z]/.test(senha))
      return "A senha deve conter ao menos uma letra maiúscula.";
    if (!/[^A-Za-z0-9]/.test(senha))
      return "A senha deve conter ao menos um caractere especial.";
    const tel = soDigitos(telefone);
    if (tel.length < 10 || tel.length > 11)
      return "Telefone deve ter 10 ou 11 dígitos (DDD + número).";
    if (!aceitouLgpd)
      return "É necessário aceitar a Política de Privacidade (LGPD) para se cadastrar.";
    return null;
  };

  const handleRegister = async () => {
    if (isLoading) return;

    const erroValidacao = validar();
    if (erroValidacao) {
      alert(erroValidacao);
      return;
    }

    setIsLoading(true);
    try {
      // Endereço é tratado como sub-objeto `endereco_inicial` — o backend
      // cria o Usuario e o EnderecoUsuario "Casa" (principal) em uma única
      // transação. Se o cliente não preencher endereço, cadastra só o user
      // e ele adiciona depois em /perfil/enderecos.
      const payload: any = {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha,
        telefone: soDigitos(telefone),
        // Backend exige z.literal(true) — registra consentimento (Art. 7°, I).
        consentimento_lgpd: aceitouLgpd,
      };
      if (endereco.trim() && bairro.trim()) {
        payload.endereco_inicial = {
          endereco: endereco.trim(),
          bairro: bairro.trim(),
        };
      }
      const response = await fetch(`${API_BASE}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Usuário cadastrado com sucesso!");
        router.replace("/login");
      } else {
        alert(extrairMensagemErro(data) || "Erro ao cadastrar usuário");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão com servidor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Fallback do botão Voltar: tela de login (cadastro normalmente é
          aberto a partir do "Criar conta" no login). */}
      <BotaoVoltar destinoFallback="/login" />
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
            placeholder="Telefone (DDD + número)"
            value={telefone}
            onChangeText={(t) => setTelefone(soDigitos(t))}
            keyboardType="phone-pad"
            maxLength={11}
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

          {/* Consentimento LGPD — obrigatório para habilitar o cadastro. */}
          <Pressable
            style={styles.consentRow}
            onPress={() => setAceitouLgpd((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: aceitouLgpd }}
          >
            <View style={[styles.checkbox, aceitouLgpd && styles.checkboxChecked]}>
              {aceitouLgpd && <Text style={styles.checkboxMark}>✓</Text>}
            </View>
            <Text style={styles.consentText}>
              Li e aceito a{" "}
              <Text style={styles.consentLink}>Política de Privacidade</Text> e o
              tratamento dos meus dados pessoais conforme a LGPD.
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.entrarButton,
              (isLoading || !aceitouLgpd) && styles.entrarButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={isLoading || !aceitouLgpd}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.entrarButtonText}>Cadastrar</Text>
            )}
          </Pressable>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Já tem conta? </Text>
            <Pressable onPress={() => router.replace("/login")}>
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
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#255336",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: "#255336",
  },
  checkboxMark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 16,
  },
  consentText: {
    flex: 1,
    fontSize: 13,
    color: "#4A4A4A",
    lineHeight: 18,
  },
  consentLink: {
    color: "#255336",
    fontWeight: "600",
    textDecorationLine: "underline",
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
