import * as React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import styles from "./styles";

interface BotaoFiltroProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const BotaoFiltro: React.FC<BotaoFiltroProps> = ({ label, isActive, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.button, isActive ? styles.buttonActive : styles.buttonInactive]}
      onPress={onPress}
    >
      <View style={styles.buttonContent}>
        <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default BotaoFiltro;