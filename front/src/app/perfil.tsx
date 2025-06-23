import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";


const PerfilScreen = () => {
  const [notificacoesPush, setNotificacoesPush] = useState(true);
  const [notificacoesEmail, setNotificacoesEmail] = useState(false);
  const [localizacao, setLocalizacao] = useState(true);

  const usuario = {
    nome: "Maria Silva",
    email: "maria.silva@email.com",
    telefone: "(11) 99999-9999",
    endereco: "Rua das Flores, 123 - Vila Mariana, São Paulo",
    avatar: null,
    membro_desde: "Janeiro 2024",
    pedidos_realizados: 15,
    feira_favorita: "Feira Central",
  };

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
          Alert.alert("Sucesso", "Você saiu da sua conta");
          router.replace("/");
        },
      },
    ]);
  };

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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
            <TouchableOpacity style={styles.editarAvatarButton}>
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

        {/* Estatísticas */}
        <View style={styles.estatisticasContainer}>
          <View style={styles.estatisticaItem}>
            <Text style={styles.estatisticaNumero}>
              {usuario.pedidos_realizados}
            </Text>
            <Text style={styles.estatisticaLabel}>Pedidos</Text>
          </View>
          <View style={styles.estatisticaDivisor} />
          <View style={styles.estatisticaItem}>
            <Text style={styles.estatisticaTexto}>
              {usuario.feira_favorita}
            </Text>
            <Text style={styles.estatisticaLabel}>Feira favorita</Text>
          </View>
          <View style={styles.estatisticaDivisor} />
          <View style={styles.estatisticaItem}>
            <Text style={styles.estatisticaTexto}>{usuario.membro_desde}</Text>
            <Text style={styles.estatisticaLabel}>Membro desde</Text>
          </View>
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

        {/* Espaço para o Nav */}
        <View style={styles.navSpacer} />
      </ScrollView>
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
});

export default PerfilScreen;
