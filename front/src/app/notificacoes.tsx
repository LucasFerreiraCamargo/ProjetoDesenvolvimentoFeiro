import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Nav from "../components/Nav";
import Top from "../components/Top";

type Notificacao = {
  id: string;
  tipo: "pedido" | "promocao" | "feira" | "sistema";
  titulo: string;
  mensagem: string;
  tempo: string;
  lida: boolean;
  icone: string;
  cor: string;
};

const NotificacoesScreen = () => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([
    {
      id: "1",
      tipo: "pedido",
      titulo: "Pedido confirmado!",
      mensagem:
        "Seu pedido da Feira Central foi confirmado pelo feirante João da Silva",
      tempo: "há 5 min",
      lida: false,
      icone: "checkmark-circle",
      cor: "#4CAF50",
    },
    {
      id: "2",
      tipo: "promocao",
      titulo: "Promoção especial!",
      mensagem: "Tomates com 20% de desconto na Feira do Lobão até amanhã",
      tempo: "há 1 hora",
      lida: false,
      icone: "pricetag",
      cor: "#FF9800",
    },
    {
      id: "3",
      tipo: "feira",
      titulo: "Feira próxima aberta",
      mensagem: "A Feira Vila Mariana está aberta e fica a apenas 500m de você",
      tempo: "há 2 horas",
      lida: true,
      icone: "storefront",
      cor: "#2196F3",
    },
    {
      id: "4",
      tipo: "sistema",
      titulo: "Bem-vindo ao Feiro!",
      mensagem:
        "Explore as melhores feiras da sua região e encontre produtos frescos",
      tempo: "há 1 dia",
      lida: true,
      icone: "heart",
      cor: "#E91E63",
    },
  ]);

  const marcarComoLida = (id: string) => {
    setNotificacoes(
      notificacoes.map((notif) =>
        notif.id === id ? { ...notif, lida: true } : notif
      )
    );
  };

  const marcarTodasComoLidas = () => {
    setNotificacoes(notificacoes.map((notif) => ({ ...notif, lida: true })));
  };

  const removerNotificacao = (id: string) => {
    Alert.alert(
      "Remover notificação",
      "Tem certeza que deseja remover esta notificação?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => {
            setNotificacoes(notificacoes.filter((notif) => notif.id !== id));
          },
        },
      ]
    );
  };

  const navegarParaNotificacao = (notificacao: Notificacao) => {
    marcarComoLida(notificacao.id);

    switch (notificacao.tipo) {
      case "pedido":
        router.push("/cesta");
        break;
      case "promocao":
        router.push("/feiras");
        break;
      case "feira":
        router.push("/mapa");
        break;
      default:
        break;
    }
  };

  const renderNotificacao = ({ item }: { item: Notificacao }) => (
    <TouchableOpacity
      style={[styles.notificacaoCard, !item.lida && styles.notificacaoNaoLida]}
      onPress={() => navegarParaNotificacao(item)}
    >
      <View style={styles.notificacaoHeader}>
        <View style={[styles.iconeContainer, { backgroundColor: item.cor }]}>
          <Ionicons name={item.icone as any} size={20} color="#FFFFFF" />
        </View>
        <View style={styles.notificacaoInfo}>
          <Text style={styles.notificacaoTitulo}>{item.titulo}</Text>
          <Text style={styles.notificacaoMensagem}>{item.mensagem}</Text>
          <Text style={styles.notificacaoTempo}>{item.tempo}</Text>
        </View>
        <TouchableOpacity
          style={styles.removerButton}
          onPress={() => removerNotificacao(item.id)}
        >
          <Ionicons name="close" size={20} color="#999" />
        </TouchableOpacity>
      </View>
      {!item.lida && <View style={styles.indicadorNaoLida} />}
    </TouchableOpacity>
  );

  const notificacaosPendentes = notificacoes.filter((n) => !n.lida).length;

  return (
    <View style={styles.container}>
      <Top />

      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Notificações</Text>
          {notificacaosPendentes > 0 && (
            <TouchableOpacity onPress={marcarTodasComoLidas}>
              <Text style={styles.marcarTodasText}>Marcar todas</Text>
            </TouchableOpacity>
          )}
        </View>

        {notificacaosPendentes > 0 && (
          <View style={styles.resumoContainer}>
            <Text style={styles.resumoText}>
              {notificacaosPendentes} notificação
              {notificacaosPendentes > 1 ? "ões" : ""} não lida
              {notificacaosPendentes > 1 ? "s" : ""}
            </Text>
          </View>
        )}

        {notificacoes.length > 0 ? (
          <FlatList
            data={notificacoes}
            renderItem={renderNotificacao}
            keyExtractor={(item) => item.id}
            style={styles.lista}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listaContent}
          />
        ) : (
          <View style={styles.vazioContainer}>
            <Ionicons name="notifications-outline" size={80} color="#CCC" />
            <Text style={styles.vazioText}>Nenhuma notificação</Text>
            <Text style={styles.vazioSubtext}>
              Você receberá notificações sobre pedidos, promoções e novidades
            </Text>
          </View>
        )}
      </View>

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
  marcarTodasText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#4A7C59",
  },
  resumoContainer: {
    backgroundColor: "#E8F5E8",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  resumoText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#4CAF50",
    textAlign: "center",
  },
  lista: {
    flex: 1,
  },
  listaContent: {
    paddingBottom: 100,
  },
  notificacaoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
  },
  notificacaoNaoLida: {
    borderLeftWidth: 4,
    borderLeftColor: "#4A7C59",
  },
  notificacaoHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconeContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificacaoInfo: {
    flex: 1,
  },
  notificacaoTitulo: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    marginBottom: 4,
  },
  notificacaoMensagem: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
  notificacaoTempo: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#999",
  },
  removerButton: {
    padding: 4,
  },
  indicadorNaoLida: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4A7C59",
  },
  vazioContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  vazioText: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
  vazioSubtext: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#999",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});

export default NotificacoesScreen;
