import * as React from "react";
import { View, Image } from "react-native";
import styles from "./styles";

const Header: React.FC = () => {
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Image
          source={require("../../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

export default Header;