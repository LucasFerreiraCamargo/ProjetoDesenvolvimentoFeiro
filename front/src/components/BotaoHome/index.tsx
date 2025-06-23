import * as React from "react";
import { Text, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import I from "../../../assets/images/home.png"; 
import { styles } from "./styles";

const BotaoHome = () => {
  const router = useRouter();

  const handleGoHome = () => {
    console.log("Voltando para a Home...");
    router.push("/"); 
  };

  return (
    <Pressable style={styles.button} onPress={handleGoHome}>
      <Image source={I} style={[styles.iIcon, { width: 18, height: 16 }]} /> {}
      {}
      <Text style={styles.voltarParaHome}>Voltar para Home</Text>
    </Pressable>
  );
};

export default BotaoHome;