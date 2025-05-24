import * as React from "react";
import { useFonts } from "expo-font";
import { Slot } from "expo-router";
import { View, StyleSheet } from "react-native";

export default function Layout() {
  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-SemiBold": require("../../assets/fonts/Poppins-SemiBold.ttf"),
  });

  if (!fontsLoaded) {
    return null; // Retorna null enquanto as fontes não são carregadas
  }

  return (
    <View style={styles.container}>
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7E4", // Fundo pastel global
  },
});