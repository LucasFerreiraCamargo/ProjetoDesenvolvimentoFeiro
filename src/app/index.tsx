import * as React from "react";
import { Text, View } from "react-native";
import Header from "../components/Header"; // Ajuste o caminho
import Nav from "../components/Nav"; // Ajuste o caminho
import styles from "./styles";

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Explore as feiras da sua cidade!</Text>
      </View>
      <Nav />
    </View>
  );
};

export default HomeScreen;