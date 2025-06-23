import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import styles from "./styles";

const Header: React.FC = () => {
  // Lista de localizações possíveis para simular dinamismo
  const localizacoesPossiveis = [
    "Centro, Pelotas",
    "Fragata, Pelotas",
    "Areal, Pelotas",
    "Laranjal, Pelotas",
    "Porto, Pelotas",
  ];

  // Por enquanto usando localização estática, mas pode ser expandido com GPS
  const [enderecoAtual, setEnderecoAtual] = React.useState(
    localizacoesPossiveis[0]
  );

  const handleLocationPress = () => {
    // Simula mudança de localização (pode ser expandido para GPS real)
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

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
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

        <TouchableOpacity onPress={handleNotificationPress}>
          <Ionicons name="notifications-outline" size={24} color="#4A4A4A" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;
