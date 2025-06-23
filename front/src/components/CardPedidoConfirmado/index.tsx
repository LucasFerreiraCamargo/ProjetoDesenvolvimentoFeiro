import * as React from "react";
import { Text, View } from "react-native";
import { Image } from "react-native";
import Frame from "../../../assets/images/pin2.png"; 
import Frame1 from "../../../assets/images/relogio2.png";
import Frame2 from "../../../assets/images/dinheiro.png"; 
import { styles } from "./styles"; 

const CardPedidoConfirmado = () => {
  return (
    <View style={styles.view}>
      {/* Seção: Número do Pedido */}
      <View style={styles.orderNumberContainer}>
        <Text style={styles.nmeroDoPedido}>Número do Pedido</Text>
        <Text style={styles.feiro25987}>#FEIRO25987</Text>
      </View>

      {/* Separador e Detalhes do Pedido */}
      <View style={styles.detailsContainer}>
        {/* Detalhe: Endereço de Entrega */}
        <View style={styles.detailRow}>
          <Image source={Frame} style={[styles.icon, { width: 12, height: 16 }]} />
          <View style={styles.detailTextContainer}>
            <Text style={styles.endereoDeEntrega}>Endereço de Entrega</Text>
            <Text style={styles.ruaDasFlores}>Rua das Flores, 123 - Jardim Primavera</Text>
          </View>
        </View>

        {/* Detalhe: Previsão de Entrega */}
        <View style={styles.detailRow}>
          <Image source={Frame1} style={[styles.icon, { width: 16, height: 16 }]} />
          <View style={styles.detailTextContainer}>
            <Text style={styles.previsoDeEntrega}>Previsão de Entrega</Text>
            <Text style={styles.hojeEntre1400}>Hoje, entre 14:00 - 15:00</Text>
          </View>
        </View>

        {/* Detalhe: Valor Total */}
        <View style={styles.detailRow}>
          <Image source={Frame2} style={[styles.icon, { width: 18, height: 16 }]} />
          <View style={styles.detailTextContainer}>
            <Text style={styles.valorTotal}>Valor Total</Text>
            <Text style={styles.r1080}>R$ 10,80</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default CardPedidoConfirmado;