import * as React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePathname } from "expo-router"; // Para detectar a rota atual
import CustomButton from "../Botao"; // Ajuste o caminho
import styles from "./styles";

const Top = () => {
  const pathname = usePathname(); // Detecta a rota atual
  const handleBackPress = () => {
    console.log("Voltar para a página anterior (futuro)");
  };

  const handleNotificationPress = () => {
    console.log("Abrir tela de notificações (futuro)");
  };

  const getTitle = () => {
    if (pathname === "/feiras") return "Feiras da Cidade";
    return ""; // Título vazio para outras páginas
  };

  return (
    <SafeAreaView style={styles.top}>
      <View style={styles.topContainer}>
        <CustomButton
          imagePath={require("../../../assets/images/seta.png")} // Botão voltar no canto esquerdo
          activeImagePath={require("../../../assets/images/seta.png")}
          onPress={handleBackPress}
          isActive={false}
          style={styles.buttonBackIcon}
        />
        <View style={styles.titleContainer}>
          <Text style={styles.feirasDaCidade}>{getTitle()}</Text>
        </View>
        <CustomButton
          imagePath={require("../../../assets/images/sino.png")} // Botão notificações no canto direito
          activeImagePath={require("../../../assets/images/sino.png")}
          onPress={handleNotificationPress}
          isActive={false}
          style={styles.buttonNotificationIcon}
        />
      </View>
    </SafeAreaView>
  );
};

export default Top;