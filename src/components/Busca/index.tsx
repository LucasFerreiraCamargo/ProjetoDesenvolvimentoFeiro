import * as React from "react";
import { TextInput, View, Image, TouchableOpacity } from "react-native";
import styles from "./styles";

const Busca: React.FC = () => {
  const [searchText, setSearchText] = React.useState<string>("");

  const handlePress = () => {
    console.log("Barra de busca clicada!");
    // Não retorna nada por enquanto, apenas loga a interação
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress} style={styles.input}>
        <View style={styles.inputContent}>
          <Image
            source={require("../../../assets/images/lupa.png")} // Ajuste o caminho
            style={styles.lupaIcon}
            resizeMode="contain"
          />
          <TextInput
            style={styles.buscarFeiraOu}
            placeholder="Buscar feira ou bairro"
            placeholderTextColor="#adaebc"
            value={searchText}
            onChangeText={(text) => setSearchText(text)}
            returnKeyType="search"
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default Busca;