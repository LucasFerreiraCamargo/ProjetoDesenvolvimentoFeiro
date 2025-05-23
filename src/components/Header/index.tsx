import * as React from "react";
import { Image, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "./styles";

const Header = () => {
  return (
    <SafeAreaView style={styles.header}>
      <View style={styles.headerContent}>
        <Image
          source={require("../../../assets/images/logo_feiro_certa_certa_1.png")} // Caminho do logotipo
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </SafeAreaView>
  );
};

export default Header;