import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as React from "react";
import { useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import Nav from "../components/Nav/index";

const { width, height } = Dimensions.get("window");

const feiras = [
  {
    id: "1",
    nome: "Feira Central",
    endereco: "Av. Principal, 1234 - Centro",
    status: "Aberto",
    feirantes: "12 Feirantes",
    imagem: require("../../assets/images/banner.png"),
    coordinate: {
      latitude: -31.7654,
      longitude: -52.3376,
    },
  },
  {
    id: "2",
    nome: "Feira Vila Mariana",
    endereco: "Rua das Flores, 123 - Vila Mariana",
    status: "Aberto",
    feirantes: "8 Feirantes",
    imagem: require("../../assets/images/banner.png"),
    coordinate: {
      latitude: -31.7704,
      longitude: -52.3426,
    },
  },
  {
    id: "3",
    nome: "Feira Pinheiros",
    endereco: "Av. Pinheiros, 456 - Pinheiros",
    status: "Fechado",
    feirantes: "15 Feirantes",
    imagem: require("../../assets/images/banner.png"),
    coordinate: {
      latitude: -31.7604,
      longitude: -52.3326,
    },
  },
  {
    id: "4",
    nome: "Feira do Produtor",
    endereco: "Praça Central, s/n - Centro",
    status: "Fechado",
    feirantes: "10 Feirantes",
    imagem: require("../../assets/images/banner.png"),
    coordinate: {
      latitude: -31.7684,
      longitude: -52.3406,
    },
  },
  {
    id: "5",
    nome: "Feira Orgânica",
    endereco: "Rua Verde, 789 - Ecológico",
    status: "Aberto",
    feirantes: "6 Feirantes",
    imagem: require("../../assets/images/banner.png"),
    coordinate: {
      latitude: -31.7634,
      longitude: -52.3356,
    },
  },
];

const FeiraCard = ({
  feira,
  onVerFeirantes,
  onTracarRota,
  isSelected,
  onCardPress,
  showSelection = true,
}: {
  feira: any;
  onVerFeirantes: () => void;
  onTracarRota: () => void;
  isSelected: boolean;
  onCardPress: () => void;
  showSelection?: boolean;
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.feiraCard,
        showSelection && isSelected && styles.selectedFeiraCard,
      ]}
      onPress={onCardPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <Image source={feira.imagem} style={styles.feiraImage} />
        <View style={styles.feiraInfo}>
          <Text style={styles.feiraNome}>{feira.nome}</Text>
          <View style={styles.feiraDetailsRow}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.feiraEndereco}>{feira.endereco}</Text>
          </View>
          <View style={styles.feiraStatusRow}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    feira.status === "Aberto" ? "#10B981" : "#EF4444",
                },
              ]}
            >
              <Text style={styles.statusText}>{feira.status}</Text>
            </View>
            <View style={styles.feirantesInfo}>
              <Ionicons name="people-outline" size={14} color="#666" />
              <Text style={styles.feiranteCount}>{feira.feirantes}</Text>
            </View>
          </View>

          {/* Botões de Ação */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.verFeirantesButton}
              onPress={(e) => {
                e.stopPropagation();
                onVerFeirantes();
              }}
            >
              <Ionicons name="storefront-outline" size={16} color="#FFF" />
              <Text style={styles.buttonText}>Ver Feirantes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tracarRotaButton}
              onPress={(e) => {
                e.stopPropagation();
                onTracarRota();
              }}
            >
              <Ionicons name="navigate-outline" size={16} color="#255336" />
              <Text style={styles.tracarRotaText}>Traçar Rota</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const CustomPin = ({
  feira,
  isSelected,
}: {
  feira: any;
  isSelected: boolean;
}) => {
  console.log(`Pin ${feira.nome} - isSelected:`, isSelected);

  return (
    <View
      style={[
        styles.customPin,
        {
          backgroundColor: feira.status === "Aberto" ? "#10B981" : "#EF4444",
          width: isSelected ? 40 : 32,
          height: isSelected ? 40 : 32,
          borderRadius: isSelected ? 20 : 16,
        },
        isSelected && styles.selectedPin,
      ]}
    >
      <Ionicons name="storefront" size={isSelected ? 20 : 16} color="#FFF" />
    </View>
  );
};

export default function MapaScreen() {
  const [highlightedPinId, setHighlightedPinId] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  const scrollRef = useRef<ScrollView>(null);

  const initialRegion = {
    latitude: -31.7654,
    longitude: -52.3376,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const handleMarkerPress = (feira: any) => {
    // Mesma lógica do card: apenas destaca o pin e rola para o card
    setHighlightedPinId(feira.id); // Destaca o pin

    // Rola para o card correspondente na lista
    const index = feiras.findIndex((f) => f.id === feira.id);
    scrollRef.current?.scrollTo({
      x: index * (width * 0.85 + 12),
      animated: true,
    });

    console.log("Pin clicado:", feira.nome, "ID:", feira.id);
  };

  const handleCardPress = (feira: any) => {
    // Apenas destaca o pin, sem mostrar o card overlay
    console.log("Card clicado:", feira.nome, "ID:", feira.id);
    setHighlightedPinId(feira.id); // Destaca o pin
    console.log("Pin destacado:", feira.id);
  };

  const handleVerFeirantes = (feira: any) => {
    Alert.alert("Feirantes", `Navegando para os feirantes da ${feira.nome}`, [
      {
        text: "OK",
        onPress: () => {
          router.push(`/feirantes/${feira.id}`);
        },
      },
    ]);
  };

  const handleTracarRota = (feira: any) => {
    const { latitude, longitude } = feira.coordinate;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert("Erro", "Não foi possível abrir o aplicativo de mapas");
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Header Personalizado */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Feiras Próximas</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="options" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="search" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Google Maps */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {feiras.map((feira) => {
            const isSelected = highlightedPinId === feira.id;
            console.log(
              `Marker ${feira.nome} (${feira.id}) - highlightedPinId: ${highlightedPinId} - isSelected: ${isSelected}`
            );

            return (
              <Marker
                key={feira.id}
                coordinate={feira.coordinate}
                onPress={() => handleMarkerPress(feira)}
              >
                <CustomPin feira={feira} isSelected={isSelected} />
              </Marker>
            );
          })}
        </MapView>

        {/* Lista de Todas as Feiras - SEMPRE VISÍVEL */}
        <View style={styles.feirasListContainer}>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.feirasScrollContent}
            style={styles.feirasScroll}
            decelerationRate="fast"
            snapToInterval={width * 0.85 + 12}
            snapToAlignment="start"
          >
            {feiras.map((feira) => (
              <FeiraCard
                key={feira.id}
                feira={feira}
                onVerFeirantes={() => handleVerFeirantes(feira)}
                onTracarRota={() => handleTracarRota(feira)}
                isSelected={highlightedPinId === feira.id}
                onCardPress={() => handleCardPress(feira)}
                showSelection={false}
              />
            ))}
          </ScrollView>
        </View>
      </View>

      <Nav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    zIndex: 1000,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  headerActions: {
    flexDirection: "row",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  customPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    position: "relative",
  },
  selectedPin: {
    borderWidth: 3,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 12,
  },
  pinGlow: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.3)",
    top: -8,
    left: -8,
  },
  selectedFeiraContainer: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
    zIndex: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  cardHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  feirasListContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginLeft: 16,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: "hidden",
  },
  feirasScroll: {
    maxHeight: 180,
  },
  feirasScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  feiraCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    marginBottom: 8,
    width: width * 0.85,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedFeiraCard: {
    borderColor: "#255336",
    elevation: 8,
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  cardContent: {
    flexDirection: "row",
    padding: 16,
  },
  feiraImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 14,
  },
  feiraInfo: {
    flex: 1,
  },
  feiraNome: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  feiraDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  feiraEndereco: {
    fontSize: 13,
    color: "#666",
    marginLeft: 4,
    flex: 1,
  },
  feiraStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "600",
  },
  feirantesInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  feiranteCount: {
    fontSize: 13,
    color: "#666",
    marginLeft: 3,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  verFeirantesButton: {
    flex: 1,
    backgroundColor: "#255336",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tracarRotaButton: {
    flex: 1,
    backgroundColor: "#F0F9FF",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#255336",
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 12,
  },
  tracarRotaText: {
    color: "#255336",
    fontWeight: "600",
    fontSize: 12,
  },
});
