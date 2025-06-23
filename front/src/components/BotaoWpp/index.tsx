import * as React from "react";
import { Text, Pressable, Image } from "react-native";
import WppImage from "../../../assets/images/wpp-verde.png"; 
import { styles } from "./styles";

const BotaoWpp = () => {
  return (
    <Pressable style={styles.button} onPress={() => { /* lógica de WhatsApp*/ }}>
      {}
      <Image source={WppImage} style={styles.wppIcon} />
      <Text style={styles.queroFalarCom}>Quero falar com o feirante</Text>
    </Pressable>
  );
};

export default BotaoWpp;