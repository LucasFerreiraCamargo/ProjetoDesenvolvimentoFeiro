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
import Nav from "../components/Nav";
import Top from "../components/Top";

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
        <Ionicons name={opcao.icone} size={24} color="#4A7C59" />
      </View>
      <Text style={styles.opcaoTexto}>{opcao.titulo}</Text>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Top />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Meu Perfil</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Informações do usuário */}
        <View style={styles.usuarioCard}>
          <View style={styles.avatarContainer}>
            {usuario.avatar ? (
              <Image source={{ uri: usuario.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#4A7C59" />
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
                color="#4A7C59"
              />
              <Text style={styles.notificacaoTexto}>Notificações push</Text>
            </View>
            <Switch
              value={notificacoesPush}
              onValueChange={setNotificacoesPush}
              trackColor={{ false: "#DDD", true: "#4A7C59" }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.notificacaoItem}>
            <View style={styles.notificacaoInfo}>
              <Ionicons name="mail-outline" size={24} color="#4A7C59" />
              <Text style={styles.notificacaoTexto}>
                Notificações por email
              </Text>
            </View>
            <Switch
              value={notificacoesEmail}
              onValueChange={setNotificacoesEmail}
              trackColor={{ false: "#DDD", true: "#4A7C59" }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.notificacaoItem}>
            <View style={styles.notificacaoInfo}>
              <Ionicons name="location-outline" size={24} color="#4A7C59" />
              <Text style={styles.notificacaoTexto}>
                Compartilhar localização
              </Text>
            </View>
            <Switch
              value={localizacao}
              onValueChange={setLocalizacao}
              trackColor={{ false: "#DDD", true: "#4A7C59" }}
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
          <Ionicons name="log-out-outline" size={24} color="#E53E3E" />
          <Text style={styles.sairTexto}>Sair da conta</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Nav />
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
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
  },
  usuarioCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
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
    right: "35%",
    backgroundColor: "#4A7C59",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  usuarioInfo: {
    alignItems: "center",
  },
  usuarioNome: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    marginBottom: 4,
  },
  usuarioEmail: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginBottom: 2,
  },
  usuarioTelefone: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginBottom: 2,
  },
  usuarioEndereco: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#999",
    textAlign: "center",
    marginTop: 4,
  },
  estatisticasContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  estatisticaItem: {
    flex: 1,
    alignItems: "center",
  },
  estatisticaNumero: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: "#4A7C59",
  },
  estatisticaTexto: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#4A7C59",
    textAlign: "center",
  },
  estatisticaLabel: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  estatisticaDivisor: {
    width: 1,
    height: 40,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 8,
  },
  secao: {
    marginBottom: 24,
  },
  secaoTitulo: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    marginBottom: 12,
  },
  notificacaoItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  notificacaoInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  notificacaoTexto: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#333",
    marginLeft: 12,
  },
  opcaoItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  opcaoIcone: {
    marginRight: 12,
  },
  opcaoTexto: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#333",
    flex: 1,
  },
  sairButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E53E3E",
  },
  sairTexto: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#E53E3E",
    marginLeft: 8,
  },
});

export default PerfilScreen;
