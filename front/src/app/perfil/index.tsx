import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { Pedido } from "@/src/contexts/UserContext";
import { useUser } from "../../contexts/UserContext";
import type { User } from "../../contexts/UserContext";

const API_BASE =
  (process.env.EXPO_PUBLIC_API_URL as string) || "http://localhost:3001";

// Formata telefone "11987654321" → "(11) 98765-4321"
function formataTelefone(tel?: string | null) {
  if (!tel) return "";
  const d = String(tel).replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return tel;
}

const PerfilScreen = () => {
  const { user, loading, logout, updateUser, setUser } = useUser();

  // ── Estado visual / preferências (local) ──────────────────────────────────
  const [notificacoesPush, setNotificacoesPush] = useState(true);
  const [notificacoesEmail, setNotificacoesEmail] = useState(false);
  const [localizacao, setLocalizacao] = useState(true);

  // ── Estado de fetch dos dados completos do usuário ────────────────────────
  const [fetching, setFetching] = useState(false);

  // ── Estado de edição inline ───────────────────────────────────────────────
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Campos editáveis (espelham o user para edição)
  const [nome, setNome] = useState(user?.nome ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [telefone, setTelefone] = useState(user?.telefone ?? "");
  const [endereco, setEndereco] = useState(user?.endereco ?? "");
  const [bairro, setBairro] = useState((user as any)?.bairro ?? "");
  const [avatar, setAvatar] = useState<string | null>(user?.avatar ?? null);

  // ── Troca de senha (opcional, sub-formulário) ─────────────────────────────
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  // Quando o user muda (ex: depois do fetch), sincroniza os campos.
  useEffect(() => {
    if (!editando) {
      setNome(user?.nome ?? "");
      setEmail(user?.email ?? "");
      setTelefone(user?.telefone ?? "");
      setEndereco(user?.endereco ?? "");
      setBairro((user as any)?.bairro ?? "");
      setAvatar(user?.avatar ?? null);
    }
  }, [user, editando]);

  // Busca dados frescos do usuário ao abrir a tela — apenas merge local
  // (sem disparar PUT). Mantém token e avatar locais.
  async function fetchUserDetails() {
    if (!user || !user.id) return;
    setFetching(true);
    try {
      const headers: any = {};
      if (user.token) headers.Authorization = `Bearer ${user.token}`;
      const res = await fetch(
        `${API_BASE.replace(/\/$/, "")}/usuarios/${user.id}`,
        { headers }
      );
      if (!res.ok) {
        console.warn("[Perfil] GET /usuarios/:id erro:", res.status);
        return;
      }
      const full = await res.json();
      if (full && full.id) {
        // Sem senha; preserva token e avatar locais.
        const { senha: _senha, ...semSenha } = full as any;
        const merged: User = {
          ...(user || {}),
          ...semSenha,
          token: user.token,
          avatar: user.avatar ?? null,
        } as User;
        setUser(merged);
      }
    } catch (e) {
      console.warn("[Perfil] Falha ao buscar dados do usuário:", e);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    fetchUserDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ── Avatar: câmera / galeria ──────────────────────────────────────────────
  async function tirarFoto() {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permissão negada", "Habilite a câmera nas configurações.");
        return;
      }
      const r = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      if (!r.canceled && r.assets?.[0]?.base64) {
        setAvatar(`data:image/jpeg;base64,${r.assets[0].base64}`);
      }
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Não foi possível abrir a câmera.");
    }
  }

  async function escolherDaGaleria() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permissão negada", "Habilite a galeria nas configurações.");
        return;
      }
      const r = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      if (!r.canceled && r.assets?.[0]?.base64) {
        setAvatar(`data:image/jpeg;base64,${r.assets[0].base64}`);
      }
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Não foi possível abrir a galeria.");
    }
  }

  function alterarAvatar() {
    Alert.alert("Alterar foto", "Escolha a origem da foto", [
      { text: "Câmera", onPress: tirarFoto },
      { text: "Galeria", onPress: escolherDaGaleria },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  // ── Validação local antes de salvar ───────────────────────────────────────
  function validar(): string | null {
    if (!nome.trim() || nome.trim().length < 2) return "Nome muito curto.";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "E-mail inválido.";
    const telDigitos = telefone.replace(/\D/g, "");
    if (telefone && !/^\d{10,11}$/.test(telDigitos))
      return "Telefone deve ter 10 ou 11 dígitos (com DDD).";
    if (endereco && endereco.trim().length < 2)
      return "Endereço muito curto.";
    if (bairro && bairro.trim().length < 2) return "Bairro muito curto.";
    if (mostrarSenha) {
      if (novaSenha.length < 8) return "A senha deve ter no mínimo 8 caracteres.";
      if (!/[A-Z]/.test(novaSenha))
        return "A senha deve conter ao menos uma letra maiúscula.";
      if (!/[^A-Za-z0-9]/.test(novaSenha))
        return "A senha deve conter ao menos um caractere especial.";
      if (novaSenha !== confirmarSenha) return "As senhas não conferem.";
    }
    return null;
  }

  // ── Salvar ────────────────────────────────────────────────────────────────
  async function salvar() {
    const erro = validar();
    if (erro) {
      Alert.alert("Validação", erro);
      return;
    }
    setSalvando(true);
    try {
      const patch: any = {
        nome: nome.trim(),
        email: email.trim(),
        // Manda só os dígitos do telefone (a API exige /^\d{10,11}$/)
        telefone: telefone.replace(/\D/g, ""),
        endereco: endereco.trim(),
        bairro: bairro.trim(),
        avatar, // local apenas (não vai pra API atualmente)
      };
      if (mostrarSenha && novaSenha) patch.senha = novaSenha;

      await updateUser(patch);

      setEditando(false);
      setMostrarSenha(false);
      setNovaSenha("");
      setConfirmarSenha("");
      Alert.alert("Sucesso", "Perfil atualizado.");
    } catch (e: any) {
      console.warn("[Perfil.salvar] erro:", e);
      Alert.alert(
        "Não foi possível salvar",
        e?.message ?? "Tente novamente em alguns segundos."
      );
    } finally {
      setSalvando(false);
    }
  }

  function cancelarEdicao() {
    // Volta os campos pro estado do user e sai do modo edição
    setNome(user?.nome ?? "");
    setEmail(user?.email ?? "");
    setTelefone(user?.telefone ?? "");
    setEndereco(user?.endereco ?? "");
    setBairro((user as any)?.bairro ?? "");
    setAvatar(user?.avatar ?? null);
    setMostrarSenha(false);
    setNovaSenha("");
    setConfirmarSenha("");
    setEditando(false);
  }

  function sair() {
    Alert.alert("Sair da conta", "Tem certeza que deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => {
          if (logout) logout();
          router.replace("/");
        },
      },
    ]);
  }

  // ── Loading inicial ───────────────────────────────────────────────────────
  if (loading || fetching) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#255336" />
        <Text style={{ marginTop: 12, color: "#666" }}>Carregando perfil...</Text>
      </View>
    );
  }

  const usuarioVazio = !user;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Cabeçalho */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Meu Perfil 👤</Text>
          {!usuarioVazio && !editando && (
            <TouchableOpacity
              style={styles.editarBtnSmall}
              onPress={() => setEditando(true)}
            >
              <Ionicons name="pencil-outline" size={16} color="#255336" />
              <Text style={styles.editarBtnSmallText}>Editar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Card do usuário */}
        <View style={styles.usuarioCard}>
          <View style={styles.avatarContainer}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#255336" />
              </View>
            )}
            {editando && (
              <TouchableOpacity
                style={styles.editarAvatarButton}
                onPress={alterarAvatar}
              >
                <Ionicons name="camera" size={16} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>

          {!editando ? (
            // ── Modo visualização ──
            <View style={styles.usuarioInfo}>
              <Text style={styles.usuarioNome}>{user?.nome ?? "—"}</Text>
              <Text style={styles.usuarioEmail}>{user?.email ?? "—"}</Text>
              {user?.telefone ? (
                <Text style={styles.usuarioTelefone}>
                  {formataTelefone(user.telefone)}
                </Text>
              ) : null}
              {user?.endereco ? (
                <Text style={styles.usuarioEndereco}>
                  {user.endereco}
                  {(user as any)?.bairro ? ` • ${(user as any).bairro}` : ""}
                </Text>
              ) : null}
            </View>
          ) : (
            // ── Modo edição ──
            <View style={styles.form}>
              <Text style={styles.label}>Nome *</Text>
              <TextInput
                style={styles.input}
                value={nome}
                onChangeText={setNome}
                placeholder="Seu nome completo"
                editable={!salvando}
              />

              <Text style={styles.label}>E-mail *</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="email@exemplo.com"
                editable={!salvando}
              />

              <Text style={styles.label}>Telefone</Text>
              <TextInput
                style={styles.input}
                value={telefone}
                onChangeText={setTelefone}
                keyboardType="phone-pad"
                placeholder="DDD + número (só dígitos)"
                editable={!salvando}
              />

              <Text style={styles.label}>Endereço</Text>
              <TextInput
                style={styles.input}
                value={endereco}
                onChangeText={setEndereco}
                placeholder="Rua, número"
                editable={!salvando}
              />

              <Text style={styles.label}>Bairro</Text>
              <TextInput
                style={styles.input}
                value={bairro}
                onChangeText={setBairro}
                placeholder="Bairro"
                editable={!salvando}
              />

              {/* Troca de senha (sub-formulário) */}
              <TouchableOpacity
                style={styles.toggleSenha}
                onPress={() => setMostrarSenha((v) => !v)}
                disabled={salvando}
              >
                <Ionicons
                  name={mostrarSenha ? "lock-open-outline" : "lock-closed-outline"}
                  size={16}
                  color="#255336"
                />
                <Text style={styles.toggleSenhaText}>
                  {mostrarSenha ? "Cancelar troca de senha" : "Trocar senha"}
                </Text>
              </TouchableOpacity>

              {mostrarSenha && (
                <>
                  <Text style={styles.label}>Nova senha</Text>
                  <TextInput
                    style={styles.input}
                    value={novaSenha}
                    onChangeText={setNovaSenha}
                    secureTextEntry
                    placeholder="Mín. 8, 1 maiúscula, 1 especial"
                    editable={!salvando}
                  />
                  <Text style={styles.label}>Confirmar nova senha</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmarSenha}
                    onChangeText={setConfirmarSenha}
                    secureTextEntry
                    placeholder="Repita a nova senha"
                    editable={!salvando}
                  />
                </>
              )}

              {/* Botões de salvar/cancelar */}
              <View style={styles.botoesRow}>
                <TouchableOpacity
                  style={[styles.btnCancelar, salvando && styles.btnDesabilitado]}
                  onPress={cancelarEdicao}
                  disabled={salvando}
                >
                  <Text style={styles.btnCancelarText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnSalvar, salvando && styles.btnDesabilitado]}
                  onPress={salvar}
                  disabled={salvando}
                >
                  {salvando ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.btnSalvarText}>Salvar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Últimos pedidos */}
        {!editando && (
          <View style={styles.pedidosSection}>
            <Text style={styles.sectionTitle}>Últimos Pedidos</Text>
            {user?.pedidos && user.pedidos.length > 0 ? (
              user.pedidos.map((p: Pedido) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.pedidoCard}
                  onPress={() =>
                    router.push({
                      pathname: "/acompanhar-pedido/[id]",
                      params: { id: p.id },
                    })
                  }
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pedidoId}>Pedido #{p.id}</Text>
                    <Text style={styles.pedidoMeta}>
                      {p.data} • {p.itens?.length ?? 0} itens
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.pedidoTotal}>
                      R$ {Number(p.total || 0).toFixed(2)}
                    </Text>
                    <Text style={styles.pedidoStatus}>{p.status || "—"}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noPedidos}>
                Você ainda não realizou pedidos.
              </Text>
            )}
          </View>
        )}

        {/* Notificações (preferências locais) */}
        {!editando && (
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>Notificações</Text>

            <View style={styles.notificacaoItem}>
              <View style={styles.notificacaoInfo}>
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color="#255336"
                />
                <Text style={styles.notificacaoTexto}>Notificações push</Text>
              </View>
              <Switch
                value={notificacoesPush}
                onValueChange={setNotificacoesPush}
                trackColor={{ false: "#DDD", true: "#255336" }}
                thumbColor="#FFF"
              />
            </View>

            <View style={styles.notificacaoItem}>
              <View style={styles.notificacaoInfo}>
                <Ionicons name="mail-outline" size={24} color="#255336" />
                <Text style={styles.notificacaoTexto}>
                  Notificações por e-mail
                </Text>
              </View>
              <Switch
                value={notificacoesEmail}
                onValueChange={setNotificacoesEmail}
                trackColor={{ false: "#DDD", true: "#255336" }}
                thumbColor="#FFF"
              />
            </View>

            <View style={styles.notificacaoItem}>
              <View style={styles.notificacaoInfo}>
                <Ionicons name="location-outline" size={24} color="#255336" />
                <Text style={styles.notificacaoTexto}>Localização</Text>
              </View>
              <Switch
                value={localizacao}
                onValueChange={setLocalizacao}
                trackColor={{ false: "#DDD", true: "#255336" }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        )}

        {/* Sobre o app */}
        {!editando && (
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>Aplicativo</Text>

            <TouchableOpacity
              style={styles.opcaoItem}
              onPress={() =>
                Alert.alert(
                  "Feirô",
                  "Aplicativo para encontrar as melhores feiras da sua região.\n\nVersão 1.0.0"
                )
              }
            >
              <View style={styles.opcaoIcone}>
                <Ionicons
                  name="information-circle-outline"
                  size={24}
                  color="#255336"
                />
              </View>
              <Text style={styles.opcaoTexto}>Sobre o Feirô</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.opcaoItem}
              onPress={() =>
                Alert.alert("Em breve", "Funcionalidade em desenvolvimento")
              }
            >
              <View style={styles.opcaoIcone}>
                <Ionicons
                  name="help-circle-outline"
                  size={24}
                  color="#255336"
                />
              </View>
              <Text style={styles.opcaoTexto}>Central de ajuda</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        )}

        {/* Botão sair (não aparece em modo edição) */}
        {!editando && (
          <TouchableOpacity style={styles.sairButton} onPress={sair}>
            <Ionicons name="log-out-outline" size={24} color="#FF5722" />
            <Text style={styles.sairTexto}>Sair da conta</Text>
          </TouchableOpacity>
        )}

        <View style={styles.navSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7E4" },
  content: { flex: 1 },
  loadingContainer: { justifyContent: "center", alignItems: "center" },

  headerContainer: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#255336" },
  editarBtnSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#255336",
    backgroundColor: "#E8F9F1",
  },
  editarBtnSmallText: {
    color: "#255336",
    fontWeight: "600",
    fontSize: 13,
  },

  usuarioCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatarContainer: { position: "relative", marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E8F5E8",
    justifyContent: "center",
    alignItems: "center",
  },
  editarAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#255336",
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },

  // visualização
  usuarioInfo: { alignItems: "center" },
  usuarioNome: { fontSize: 20, fontWeight: "bold", color: "#333", marginBottom: 4 },
  usuarioEmail: { fontSize: 14, color: "#666", marginBottom: 2 },
  usuarioTelefone: { fontSize: 14, color: "#666", marginBottom: 2 },
  usuarioEndereco: { fontSize: 13, color: "#999", textAlign: "center", lineHeight: 18 },

  // edição
  form: { width: "100%", gap: 4 },
  label: { color: "#333", marginTop: 8, marginBottom: 4, fontWeight: "600", fontSize: 13 },
  input: {
    backgroundColor: "#FAFAFA",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    fontSize: 14,
    color: "#333",
  },
  toggleSenha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
  },
  toggleSenhaText: { color: "#255336", fontWeight: "600", fontSize: 13 },
  botoesRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  btnCancelar: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  btnCancelarText: { color: "#666", fontWeight: "600" },
  btnSalvar: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#255336",
    alignItems: "center",
    justifyContent: "center",
  },
  btnSalvarText: { color: "#FFFFFF", fontWeight: "600" },
  btnDesabilitado: { opacity: 0.6 },

  // seções
  secao: { marginHorizontal: 16, marginBottom: 24 },
  secaoTitulo: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 12 },
  opcaoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  opcaoIcone: { marginRight: 16 },
  opcaoTexto: { flex: 1, fontSize: 16, color: "#333" },

  notificacaoItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  notificacaoInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  notificacaoTexto: { fontSize: 16, color: "#333", marginLeft: 16 },

  sairButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF3F3",
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFE0E0",
  },
  sairTexto: { fontSize: 16, fontWeight: "600", color: "#FF5722", marginLeft: 8 },

  navSpacer: { height: 20 },

  // últimos pedidos
  pedidosSection: { marginHorizontal: 16, marginTop: 4, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#333", marginBottom: 8 },
  pedidoCard: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEE",
  },
  pedidoId: { fontWeight: "700", color: "#255336" },
  pedidoMeta: { color: "#666", fontSize: 12 },
  pedidoTotal: { fontWeight: "700", color: "#255336" },
  pedidoStatus: { color: "#666", fontSize: 12 },
  noPedidos: { color: "#666", fontStyle: "italic" },
});

export default PerfilScreen;
