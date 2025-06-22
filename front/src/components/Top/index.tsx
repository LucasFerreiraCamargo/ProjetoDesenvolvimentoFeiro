import { useRouter } from "expo-router";
import * as React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "./styles";

const Top: React.FC = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.top}>
      <View style={styles.topContainer}>
        <Pressable style={styles.buttonBackIcon} onPress={() => router.back()}>
          <Image
            source={require("../../../assets/images/seta.png")}
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
          />
        </Pressable>
        <View style={styles.titleContainer}>
          <Text style={styles.feirasDaCidade}>Feiras da Cidade</Text>
        </View>
        <Pressable
          style={styles.buttonNotificationIcon}
          onPress={() => router.push("/notificacoes")}
        >
          <Image
            source={require("../../../assets/images/sino.png")}
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default Top;
