import { router } from "expo-router";
import * as React from "react";
import { Alert, Image, TextInput, TouchableOpacity, View } from "react-native";
import styles from "./styles";

interface BuscaProps {
  onSearch?: (text: string) => void;
  placeholder?: string;
}

const Busca: React.FC<BuscaProps> = ({
  onSearch,
  placeholder = "Buscar feira ou bairro",
}) => {
  const [searchText, setSearchText] = React.useState<string>("");

  const handlePress = () => {
    if (searchText.trim()) {
      performSearch();
    }
  };

  const performSearch = () => {
    if (onSearch) {
      onSearch(searchText);
    } else {
      // Navegar para a tela de busca
      router.push("/busca" as any);
    }
  };

  const handleSubmit = () => {
    if (searchText.trim()) {
      performSearch();
    } else {
      Alert.alert("Busca vazia", "Digite algo para buscar");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress} style={styles.input}>
        <View style={styles.inputContent}>
          <Image
            source={require("../../../assets/images/lupa.png")}
            style={styles.lupaIcon}
            resizeMode="contain"
          />
          <TextInput
            style={styles.buscarFeiraOu}
            placeholder={placeholder}
            placeholderTextColor="#adaebc"
            value={searchText}
            onChangeText={(text) => setSearchText(text)}
            returnKeyType="search"
            onSubmitEditing={handleSubmit}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default Busca;
