import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import * as React from "react";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import styles from "./styles";

const Header: React.FC = () => {
  const localizacoesPossiveis = [
    "Centro, Pelotas",
    "Fragata, Pelotas",
    "Areal, Pelotas",
    "Laranjal, Pelotas",
    "Porto, Pelotas",
  ];

  const [enderecoAtual, setEnderecoAtual] = React.useState(
    localizacoesPossiveis[0]
  );
  const [menuAdminVisivel, setMenuAdminVisivel] = React.useState(false);

  const handleLocationPress = () => {
    const proximaLocalizacao =
      localizacoesPossiveis[
        (localizacoesPossiveis.indexOf(enderecoAtual) + 1) %
          localizacoesPossiveis.length
      ];
    setEnderecoAtual(proximaLocalizacao);
  };

  const handleNotificationPress = () => {
    router.push("/notificacoes");
  };

  const handleEntrarAdmin = () => {
    setMenuAdminVisivel(false);
    router.push("/admin/login");
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        {/* Esquerda: logo + localização */}
        <View style={styles.leftSection}>
          <Image
            source={require("../../../assets/images/logo.png")}
            style={styles.logoSmall}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.locationContainer}
            onPress={handleLocationPress}
          >
            <Ionicons name="location" size={16} color="#4A4A4A" />
            <Text style={styles.locationText}>{enderecoAtual}</Text>
          </TouchableOpacity>
        </View>

        {/* Direita: ícones de ação */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {usePathname() === "/home" && (
            <TouchableOpacity onPress={() => router.push("/editar-perfil")}>
              <Ionicons name="person-outline" size={24} color="#4A4A4A" />
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={handleNotificationPress}>
            <Ionicons name="notifications-outline" size={24} color="#4A4A4A" />
          </TouchableOpacity>

          {/* Engrenagem de acesso à área admin */}
          <TouchableOpacity
            onPress={() => setMenuAdminVisivel(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={24} color="#4A4A4A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal menu admin */}
      <Modal
        visible={menuAdminVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuAdminVisivel(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuAdminVisivel(false)}>
          <View style={menuStyles.overlay}>
            <TouchableWithoutFeedback>
              <View style={menuStyles.menu}>
                <View style={menuStyles.cabecalho}>
                  <Ionicons name="settings" size={18} color="#255336" />
                  <Text style={menuStyles.cabecalhoText}>Configurações</Text>
                </View>

                <View style={menuStyles.divisor} />

                <TouchableOpacity
                  style={menuStyles.item}
                  onPress={handleEntrarAdmin}
                  activeOpacity={0.8}
                >
                  <View style={menuStyles.itemIcone}>
                    <Ionicons name="storefront-outline" size={20} color="#255336" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={menuStyles.itemTitulo}>Área do Feirante</Text>
                    <Text style={menuStyles.itemSub}>Acessar painel administrativo</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#999" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[menuStyles.item, { borderTopWidth: 1, borderTopColor: "#F0F0F0" }]}
                  onPress={() => setMenuAdminVisivel(false)}
                  activeOpacity={0.8}
                >
                  <View style={[menuStyles.itemIcone, { backgroundColor: "#FFF0F0" }]}>
                    <Ionicons name="close-outline" size={20} color="#999" />
                  </View>
                  <Text style={[menuStyles.itemTitulo, { color: "#999" }]}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const menuStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 90,
    paddingRight: 16,
  },
  menu: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    width: 240,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#F8FBF8",
  },
  cabecalhoText: {
    fontSize: 13,
    fontFamily: "Poppins-SemiBold",
    color: "#255336",
  },
  divisor: {
    height: 1,
    backgroundColor: "#F0F0F0",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemIcone: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#E8F5E8",
    justifyContent: "center",
    alignItems: "center",
  },
  itemTitulo: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#333333",
  },
  itemSub: {
    fontSize: 11,
    fontFamily: "Poppins-Regular",
    color: "#999999",
    marginTop: 1,
  },
});

export default Header;
