import * as React from "react";
import { FlatList, View } from "react-native";
import styles from "../app/feiras/styles";
import BotaoFiltro from "../components/BotaoFiltro";
import Busca from "../components/Busca";
import Card from "../components/Card";
import Nav from "../components/Nav";
import Top from "../components/Top";

type Feira = {
  id: string;
  name: string;
  neighborhood: string;
  hours: string;
  distance: string;
  isOpen: boolean;
};

const feiras: Feira[] = [
  {
    id: "1",
    name: "Feira do Lobão",
    neighborhood: "Centro",
    hours: "7h às 14h",
    distance: "1.2 km",
    isOpen: true,
  },
  {
    id: "2",
    name: "Feira da Duque",
    neighborhood: "Fragata",
    hours: "8h às 12h",
    distance: "2.5 km",
    isOpen: false,
  },
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

  const renderFilterItem = ({ item }: { item: string }) => (
    <BotaoFiltro
      label={item}
      isActive={selectedDay === item}
      onPress={() => setSelectedDay(item)}
    />
  );

  const renderCard = ({ item }: { item: Feira }) => (
    <Card
      id={item.id}
      name={item.name}
      neighborhood={item.neighborhood}
      hours={item.hours}
      distance={item.distance}
      isOpen={item.isOpen}
      onMapPress={() => console.log(`Ver no mapa: ${item.name}`)}
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
            contentContainerStyle={[styles.filterList, { gap: 12 }]}
          />
        </View>
        <View style={styles.contentWrapper}>
          <FlatList
            data={feiras}
            renderItem={renderCard}
            keyExtractor={(item) => item.id}
            style={styles.feirasList}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        </View>
        <Nav />
      </View>
    </View>
  );
};

export default FeirasScreen;
