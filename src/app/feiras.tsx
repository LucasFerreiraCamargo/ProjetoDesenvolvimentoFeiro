import * as React from "react";
import { FlatList, Text, View } from "react-native";
import Top from "../components/Top";
import Nav from "../components/Nav";
import Busca from "../components/Busca";
import BotaoFiltro from "../components/BotaoFiltro";
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

const diasDaSemana = [
  "Todos",
  "Hoje",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

const FeirasScreen = () => {
  const [selectedDay, setSelectedDay] = React.useState<string>("Todos");

  const renderItem = ({ item }: { item: Feira }) => (
    <View style={styles.feiraItem}>
      <Text style={styles.feiraName}>{item.name}</Text>
      <Text style={styles.feiraLocation}>{item.location}</Text>
    </View>
  );

  const renderFilterItem = ({ item }: { item: string }) => (
    <BotaoFiltro
      label={item}
      isActive={selectedDay === item}
      onPress={() => setSelectedDay(item)}
    />
  );

  return (
    <View style={styles.outerContainer}>
      <Top />
      <View style={styles.innerContainer}>
        <Busca />
        <View style={styles.filterContainer}>
          <FlatList
            data={diasDaSemana}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            renderItem={renderFilterItem}
            contentContainerStyle={[styles.filterList, { gap: 5 }]} // Adiciona espaço entre os botões
          />
        </View>
        <View style={styles.contentWrapper}>
          <FlatList
            data={feiras}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            style={styles.feirasList}
          />
        </View>
        <Nav />
      </View>
    </View>
  );
};

export default FeirasScreen;