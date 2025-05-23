import * as React from "react";
import { FlatList, Text, View } from "react-native";
import Top from "../components/Top"; // Ajuste o caminho
import Nav from "../components/Nav"; // Ajuste o caminho
import styles from "../app/feiras/styles";

type Feira = {
  id: string;
  name: string;
  location: string;
};

const feiras: Feira[] = [
  { id: "1", name: "Feira do Centro", location: "Rua Principal, 123" },
  { id: "2", name: "Feira do Parque", location: "Av. das Flores, 456" },
];

const FeirasScreen = () => {
  const renderItem = ({ item }: { item: Feira }) => (
    <View style={styles.feiraItem}>
      <Text style={styles.feiraName}>{item.name}</Text>
      <Text style={styles.feiraLocation}>{item.location}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Top />
      <FlatList
        data={feiras}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.feirasList}
      />
      <Nav />
    </View>
  );
};

export default FeirasScreen;