import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useUser } from "../../contexts/UserContext";


const PerfilScreen = () => {
  const [notificacoesPush, setNotificacoesPush] = useState(true);
  const [notificacoesEmail, setNotificacoesEmail] = useState(false);
  const [localizacao, setLocalizacao] = useState(true);
  // Usuário vindo do contexto
  const { user, loading, logout, updateUser } = useUser();
  const [fetching, setFetching] = useState(false);

  const usuario =
    user ||
    ({
      nome: "Usuário",
      email: "",
      telefone: "",
      endereco: "",
      avatar: null,
      membro_desde: "",
      pedidos_realizados: 0,
      feira_favorita: "",
    } as any);

  const opcoesPerfil = [
    {
      id: "dados",
      titulo: "Dados pessoais",
      icone: "person-outline",
      acao: () => Alert.alert("Em breve", "Funcionalidade em desenvolvimento"),
    },
    {
      id: "endereco",
      titulo: "Endereços",
      icone: "location-outline",
      acao: () => Alert.alert("Em breve", "Funcionalidade em desenvolvimento"),
    },
    {
      id: "pagamento",
      titulo: "Formas de pagamento",
      icone: "card-outline",
      acao: () => Alert.alert("Em breve", "Funcionalidade em desenvolvimento"),
    },
    {
      id: "historico",
      titulo: "Histórico de pedidos",
      icone: "time-outline",
      acao: () => Alert.alert("Em breve", "Funcionalidade em desenvolvimento"),
    },
    {
      id: "favoritos",
      titulo: "Feiras favoritas",
      icone: "heart-outline",
      acao: () => Alert.alert("Em breve", "Funcionalidade em desenvolvimento"),
    },
  ];

  const opcoesApp = [
    {
      id: "ajuda",
      titulo: "Central de ajuda",
      icone: "help-circle-outline",
      acao: () => Alert.alert("Em breve", "Funcionalidade em desenvolvimento"),
    },
    {
      id: "sobre",
      titulo: "Sobre o Feiro",
      icone: "information-circle-outline",
      acao: () =>
        Alert.alert(
          "Feiro",
          "Aplicativo para encontrar as melhores feiras da sua região.\n\nVersão 1.0.0"
        ),
    },
    {
      id: "termos",
      titulo: "Termos de uso",
      icone: "document-text-outline",
      acao: () => Alert.alert("Em breve", "Funcionalidade em desenvolvimento"),
    },
    {
      id: "privacidade",
      titulo: "Política de privacidade",
      icone: "shield-outline",
      acao: () => Alert.alert("Em breve", "Funcionalidade em desenvolvimento"),
    },
  ];

  const sair = () => {
    Alert.alert("Sair da conta", "Tem certeza que deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => {
          // usar logout do contexto quando disponível
          if (logout) logout();
          router.replace("/");
        },
      },
    ]);
  };

  // Função que busca os dados completos do usuário
  async function fetchUserDetails() {
    if (!user || !user.id) return;
    setFetching(true);
    const API_BASE = (process.env.EXPO_PUBLIC_API_URL as string) || "http://localhost:3001";
    try {
      const headers: any = {};
      if ((user as any).token) headers.Authorization = `Bearer ${(user as any).token}`;
      const res = await fetch(`${API_BASE.replace(/\/$/, "")}/usuarios/${user.id}`, { headers });
      if (!res.ok) return;
      const full = await res.json();
      // atualizar o contexto com os dados retornados (telefone, endereco, etc)
      if (full) {
        await updateUser(full as any);
      }
    } catch (e) {
      console.warn("Falha ao buscar dados do usuário:", e);
    }
    setFetching(false);
  }

  // Ao montar ou quando mudar o usuário, busca os detalhes
  useEffect(() => {
    fetchUserDetails();
  }, [user?.id]);

  // (Removido pull-to-refresh: arrastar agora apenas rola o conteúdo)

  const renderOpcao = (opcao: any) => (
    <TouchableOpacity
      key={opcao.id}
      style={styles.opcaoItem}
      onPress={opcao.acao}
    >
      <View style={styles.opcaoIcone}>
        <Ionicons name={opcao.icone} size={24} color="#255336" />
      </View>
      <Text style={styles.opcaoTexto}>{opcao.titulo}</Text>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading || fetching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#255336" />
          <Text style={{ marginTop: 12, color: "#666" }}>Carregando perfil...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          alwaysBounceVertical={true}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
        {/* Cabeçalho da tela */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Meu Perfil 👤</Text>
        </View>

        {/* Informações do usuário */}
        <View style={styles.usuarioCard}>
          <View style={styles.avatarContainer}>
            {usuario.avatar ? (
              <Image source={{ uri: usuario.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#255336" />
              </View>
            )}
            <TouchableOpacity
              style={styles.editarAvatarButton}
              onPress={() => router.push("/editar-perfil")}
            >
              <Ionicons name="camera" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.usuarioInfo}>
            <Text style={styles.usuarioNome}>{usuario.nome}</Text>
            <Text style={styles.usuarioEmail}>{usuario.email}</Text>
            <Text style={styles.usuarioTelefone}>{usuario.telefone}</Text>
            <Text style={styles.usuarioEndereco}>{usuario.endereco}</Text>
          </View>
        </View>

        {/* Estatísticas simplificadas: apenas Pedidos + botão para ver pedidos */}
        <View style={styles.estatisticasContainerSingle}>
          <View style={styles.estatisticaItemSingle}>
            <Text style={styles.estatisticaNumero}>{usuario.pedidos_realizados}</Text>
            <Text style={styles.estatisticaLabel}>Pedidos</Text>
          </View>
          <TouchableOpacity
            style={styles.verPedidosButton}
            onPress={() => router.push("/editar-perfil")}
          >
            <Text style={styles.verPedidosText}>Ver pedidos realizados</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de pedidos diretamente na página de perfil */}
        <View style={styles.pedidosSection}>
          <Text style={styles.sectionTitle}>Últimos Pedidos</Text>
          {user?.pedidos && user.pedidos.length > 0 ? (
            user.pedidos.map((p: any) => (
              <TouchableOpacity
                key={p.id}
                style={styles.pedidoCard}
                onPress={() => router.push(`/acompanhar-pedido?id=${p.id}`)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.pedidoId}>Pedido #{p.id}</Text>
                  <Text style={styles.pedidoMeta}>{p.data} • {p.itens?.length ?? 0} itens</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.pedidoTotal}>R$ {Number(p.total || 0).toFixed(2)}</Text>
                  <Text style={styles.pedidoStatus}>{p.status || '—'}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noPedidos}>Você ainda não realizou pedidos.</Text>
          )}
        </View>

        {/* Configurações de notificações */}
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
                Notificações por email
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

        {/* Opções do perfil */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Conta</Text>
          {opcoesPerfil.map(renderOpcao)}
        </View>

        {/* Opções do app */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Aplicativo</Text>
          {opcoesApp.map(renderOpcao)}
        </View>

        {/* Botão sair */}
        <TouchableOpacity style={styles.sairButton} onPress={sair}>
          <Ionicons name="log-out-outline" size={24} color="#FF5722" />
          <Text style={styles.sairTexto}>Sair da conta</Text>
        </TouchableOpacity>

        {/* Botão editar perfil */}
        <TouchableOpacity
          style={[styles.sairButton, { marginTop: 8, backgroundColor: "#E8F9F1" }]}
          onPress={() => router.push("/editar-perfil")}
        >
          <Ionicons name="pencil-outline" size={20} color="#255336" />
          <Text style={[styles.sairTexto, { color: "#255336", marginLeft: 8 }]}>Editar perfil</Text>
        </TouchableOpacity>

        {/* Espaço para o Nav */}
        <View style={styles.navSpacer} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7E4",
  },
  content: {
    flex: 1,
  },
  headerContainer: {
    padding: 16,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#255336",
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
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
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
  usuarioInfo: {
    alignItems: "center",
  },
  usuarioNome: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  usuarioEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  usuarioTelefone: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  usuarioEndereco: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    lineHeight: 18,
  },
  estatisticasContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  estatisticaItem: {
    flex: 1,
    alignItems: "center",
  },
  estatisticaDivisor: {
    width: 1,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 16,
  },
  estatisticaNumero: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#255336",
    marginBottom: 4,
  },
  estatisticaTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: "#255336",
    marginBottom: 4,
    textAlign: "center",
  },
  estatisticaLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  estatisticasContainerSingle: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  estatisticaItemSingle: {
    alignItems: "flex-start",
  },
  verPedidosButton: {
    backgroundColor: "#255336",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  verPedidosText: {
    color: "#fff",
    fontWeight: "600",
  },
  secao: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  secaoTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
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
  opcaoIcone: {
    marginRight: 16,
  },
  opcaoTexto: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
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
  notificacaoInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  notificacaoTexto: {
    fontSize: 16,
    color: "#333",
    marginLeft: 16,
  },
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
  sairTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF5722",
    marginLeft: 8,
  },
  navSpacer: {
    height: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pedidosSection: { marginHorizontal: 16, marginTop: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 8 },
  pedidoCard: { backgroundColor: '#FFF', padding: 12, borderRadius: 10, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  pedidoId: { fontWeight: '700', color: '#255336' },
  pedidoMeta: { color: '#666', fontSize: 12 },
  pedidoTotal: { fontWeight: '700', color: '#255336' },
  pedidoStatus: { color: '#666', fontSize: 12 },
  noPedidos: { color: '#666', fontStyle: 'italic' },
});

export default PerfilScreen;
