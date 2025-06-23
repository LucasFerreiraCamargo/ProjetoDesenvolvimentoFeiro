import * as React from "react";
import { Text, Pressable, Image } from "react-native";
import I from "../../../assets/images/caminhao.png"; 
import { styles } from "./styles";

const BotaoAcompanhaPedido = () => {
  return (
    <Pressable style={styles.button} onPress={() => { /*  lógica aqui */ }}>
      <Image source={I} style={styles.iIcon} /> {}
      {}
      <Text style={styles.acompanharPedido}>Acompanhar Pedido</Text>
    </Pressable>
  );
};

export default BotaoAcompanhaPedido;