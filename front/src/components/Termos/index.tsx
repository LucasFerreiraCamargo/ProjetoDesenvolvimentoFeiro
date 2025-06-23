import * as React from "react";
import { Text, View, Pressable } from "react-native";
import { styles } from "./styles";

const Termos = () => {
  const [termsAccepted, setTermsAccepted] = React.useState(false);

  const toggleTermsAccepted = () => {
    setTermsAccepted(prev => !prev);
    console.log("Termos aceitos:", !termsAccepted);
  };

  return (
    <View style={styles.section}>
      <Pressable style={styles.label7} onPress={toggleTermsAccepted}>
        <View style={[styles.input10, termsAccepted && styles.input10Selected]}>
          {termsAccepted && (
            <Text style={styles.checkIcon}>✓</Text>
          )}
        </View>
        <Text style={styles.aceitoOsTermos}>Aceito os termos e condições</Text>
      </Pressable>
    </View>
  );
};

export default Termos;