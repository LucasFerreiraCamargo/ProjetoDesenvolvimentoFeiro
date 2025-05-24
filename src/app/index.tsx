import * as React from "react";
import { Text, View } from "react-native";
import { useFonts } from "expo-font";
import Header from "../components/Header"; 
import Nav from "../components/Nav"; 
import styles from "./styles";

const HomeScreen = () => {
  return (
    <View style={styles.outerContainer}>
      <View style={styles.innerContainer}>
        <Header />
        <View style={styles.contentWrapper}>
          <View style={styles.content}>
            <Text style={styles.placeholderText}>Explore as feiras da sua cidade!</Text>
          </View>
        </View>
        <Nav />
      </View>
    </View>
  );
};

export default function App() {
  const [fontsLoaded, error] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-SemiBold": require("../../assets/fonts/Poppins-SemiBold.ttf"),
  });

  if (!fontsLoaded) {
    if (error) {
      console.error("Erro ao carregar fontes:", error);
    }
    return <Text style={{ textAlign: "center", marginTop: 50 }}>Carregando fontes...</Text>;
  }

  return <HomeScreen />;
}