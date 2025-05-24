import * as React from "react";
import { View, Text, Image, Pressable } from "react-native";
import { useRouter } from "expo-router";
import styles from "./styles";

const Top: React.FC = () => {
  const router = useRouter();

  return (
    <View style={styles.top}>
      <View style={styles.topContainer}>
        <Pressable
          style={styles.buttonBackIcon}
          onPress={() => router.back()}
        >
          <Image
            source={require("../../../assets/images/seta.png")} // Ajuste o caminho
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
          />
        </Pressable>
        <View style={styles.titleContainer}>
          <Text style={styles.feirasDaCidade}>Feiras da Cidade</Text>
        </View>
        <Pressable
          style={styles.buttonNotificationIcon}
          onPress={() => console.log("Notificações pressionado (futuro)")}
        >
          <Image
            source={require("../../../assets/images/sino.png")} // Ajuste o caminho
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
          />
        </Pressable>
      </View>
    </View>
  );
};

export default Top;