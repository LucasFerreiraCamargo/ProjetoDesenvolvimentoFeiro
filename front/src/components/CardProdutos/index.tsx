import * as React from "react";
import { Text, View } from "react-native";
import { styles } from "./styles";

const CardProdutos = () => {
  return (
    <View style={styles.section}>
      <View style={styles.h2}>
        <Text style={styles.resumoDoPedido}>Resumo do Pedido</Text>
      </View>
      <View style={styles.div}>
        <View style={styles.div1}>
          <View style={styles.productInfo}>
            <Text style={styles.tomateOrgnico}>Tomate Orgânico</Text>
            <Text style={styles.xR890kg}>2 x R$ 8,90/kg</Text>
          </View>
          <Text style={styles.r280}>R$ 2,80</Text>
        </View>
        <View style={styles.div3}>
          <View style={styles.productInfo}>
            <Text style={styles.alfaceCrespa}>Alface Crespa</Text>
            <Text style={styles.xR350un}>1 x R$ 3,50/un</Text>
          </View>
          <Text style={styles.r350}>R$ 3,50</Text>
        </View>
        <View style={styles.div5}>
          <Text style={styles.total}>Total</Text>
          <Text style={styles.r630}>R$ 6,30</Text>
        </View>
      </View>
    </View>
  );
};

export default CardProdutos;