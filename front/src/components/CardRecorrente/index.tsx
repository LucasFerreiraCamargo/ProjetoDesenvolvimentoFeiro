import * as React from "react";
import { Text, View, Pressable } from "react-native";
import { styles } from "./styles";

const CardRecorrente = () => {
  const [isRecurrent, setIsRecurrent] = React.useState(false);

  const toggleRecurrent = () => {
    setIsRecurrent(prev => !prev);
    console.log("Cesta recorrente:", !isRecurrent);
  };

  return (
    <View style={styles.section}>
      <Pressable style={styles.label6} onPress={toggleRecurrent}>
        <View style={[styles.input9, isRecurrent && styles.input9Selected]}>
          {isRecurrent && (
            <Text style={styles.checkIcon}>✓</Text>
          )}
        </View>
        <View style={styles.div14}>
          <Text style={styles.tornarCestaRecorrente}>
            Tornar cesta recorrente
          </Text>
          <Text style={styles.recebaEstesItens}>
            Receba estes itens automaticamente
          </Text>
        </View>
      </Pressable>
    </View>
  );
};

export default CardRecorrente;