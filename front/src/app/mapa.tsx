import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, Region } from "react-native-maps";
import Nav from "../components/Nav";
import Top from "../components/Top";

type Feira = {
  id: string;
  name: string;
  neighborhood: string;
  hours: string;
  isOpen: boolean;
  latitude: number;
  longitude: number;
  distance: string;
};

const feiras: Feira[] = [
  {
    id: "1",
    name: "Feira Central",
    neighborhood: "Centro",
    hours: "7h às 14h",
    isOpen: true,
    latitude: -31.7654,
    longitude: -52.3376,
    distance: "1.2 km",
  },
  {
    id: "2",
    name: "Feira do Lobão",
    neighborhood: "Fragata",
    hours: "8h às 12h",
    isOpen: true,
    latitude: -31.77,
    longitude: -52.34,
    distance: "2.1 km",
  },
  {
    id: "3",
    name: "Feira Vila Mariana",
    neighborhood: "Vila Mariana",
    hours: "6h às 13h",
    isOpen: false,
    latitude: -31.76,
    longitude: -52.33,
    distance: "3.5 km",
  },
  {
    id: "4",
    name: "Feira Pinheiros",
    neighborhood: "Pinheiros",
    hours: "7h às 15h",
    isOpen: true,
    latitude: -31.775,
    longitude: -52.345,
    distance: "1.8 km",
  },
];

const MapaScreen = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [region, setRegion] = useState<Region>({
    latitude: -31.7654,
    longitude: -52.3376,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedFeira, setSelectedFeira] = useState<Feira | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [customAddress, setCustomAddress] = useState("");

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissão negada",
          "Precisamos da sua localização para mostrar as feiras próximas."
        );
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    })();
  }, []);

  const centerOnUser = async () => {
    if (location) {
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  };

  const changeLocation = async () => {
    setShowLocationModal(true);
  };

  const setCustomLocation = async () => {
    if (!customAddress.trim()) {
      Alert.alert("Erro", "Por favor, digite um endereço válido");
      return;
    }

    try {
      // Simulando geocoding - em um app real, você usaria um serviço como Google Geocoding
      // Por enquanto, vamos usar coordenadas fixas para demonstração
      const geocodedLocation = await Location.geocodeAsync(customAddress);

      if (geocodedLocation.length > 0) {
        const newLocation = {
          coords: {
            latitude: geocodedLocation[0].latitude,
            longitude: geocodedLocation[0].longitude,
            altitude: null,
            accuracy: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        };

        setLocation(newLocation);
        setRegion({
          latitude: geocodedLocation[0].latitude,
          longitude: geocodedLocation[0].longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        setShowLocationModal(false);
        setCustomAddress("");
      } else {
        Alert.alert("Erro", "Endereço não encontrado");
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível encontrar o endereço");
    }
  };

  const traceRouteToFeira = (feira: Feira) => {
    if (!location) {
      Alert.alert("Erro", "Localização não disponível");
      return;
    }

    // Simulando uma rota simples (linha reta)
    // Em um app real, você usaria um serviço de roteamento como Google Directions API
    const route = [
      {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
      {
        latitude: feira.latitude,
        longitude: feira.longitude,
      },
    ];

    setRouteCoordinates(route);
    setSelectedFeira(feira);

    // Ajustar a região para mostrar toda a rota
    const minLat = Math.min(location.coords.latitude, feira.latitude);
    const maxLat = Math.max(location.coords.latitude, feira.latitude);
    const minLng = Math.min(location.coords.longitude, feira.longitude);
    const maxLng = Math.max(location.coords.longitude, feira.longitude);

    const latDelta = (maxLat - minLat) * 1.5;
    const lngDelta = (maxLng - minLng) * 1.5;

    setRegion({
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01),
    });

    Alert.alert(
      "Rota traçada",
      `Rota até ${feira.name} foi traçada no mapa. Distância aproximada: ${feira.distance}`,
      [
        {
          text: "Ver feirantes",
          onPress: () => router.push(`/feirantes/${feira.id}`),
        },
        { text: "OK" },
      ]
    );
  };

  const clearRoute = () => {
    setRouteCoordinates([]);
    setSelectedFeira(null);
  };

  const renderFeiraCard = ({ item }: { item: Feira }) => (
    <TouchableOpacity
      style={styles.feiraCard}
      onPress={() => traceRouteToFeira(item)}
    >
      <View style={styles.feiraCardHeader}>
        <Text style={styles.feiraCardName}>{item.name}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: item.isOpen ? "#4CAF50" : "#FF5722" },
          ]}
        >
          <Text style={styles.statusText}>
            {item.isOpen ? "Aberto" : "Fechado"}
          </Text>
        </View>
      </View>
      <Text style={styles.feiraCardNeighborhood}>{item.neighborhood}</Text>
      <Text style={styles.feiraCardHours}>{item.hours}</Text>
      <Text style={styles.feiraCardDistance}>{item.distance}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Top />
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
          mapType="standard"
        >
          {feiras.map((feira) => (
            <Marker
              key={feira.id}
              coordinate={{
                latitude: feira.latitude,
                longitude: feira.longitude,
              }}
              title={feira.name}
              description={`${feira.neighborhood} - ${feira.hours}`}
              pinColor={feira.isOpen ? "#4CAF50" : "#FF5722"}
              onPress={() => traceRouteToFeira(feira)}
            />
          ))}

          {/* Mostrar rota se existir */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#4A7C59"
              strokeWidth={4}
              lineDashPattern={[5, 5]}
            />
          )}
        </MapView>

        <TouchableOpacity style={styles.locationButton} onPress={centerOnUser}>
          <Ionicons name="locate" size={24} color="#4A7C59" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.changeLocationButton}
          onPress={changeLocation}
        >
          <Ionicons name="search" size={24} color="#4A7C59" />
        </TouchableOpacity>

        {routeCoordinates.length > 0 && (
          <TouchableOpacity
            style={styles.clearRouteButton}
            onPress={clearRoute}
          >
            <Ionicons name="close" size={24} color="#FF5722" />
          </TouchableOpacity>
        )}

        <View style={styles.feirasListContainer}>
          <Text style={styles.feirasListTitle}>Feiras Próximas</Text>
          <Text style={styles.feirasListSubtitle}>
            Toque em uma feira para traçar rota
          </Text>
          <FlatList
            data={feiras}
            renderItem={renderFeiraCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.feirasList}
          />
        </View>
      </View>

      {/* Modal para mudar localização */}
      <Modal
        visible={showLocationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mudar Localização</Text>
            <TextInput
              style={styles.addressInput}
              placeholder="Digite seu endereço..."
              value={customAddress}
              onChangeText={setCustomAddress}
              multiline={false}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowLocationModal(false);
                  setCustomAddress("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={setCustomLocation}
              >
                <Text style={styles.confirmButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Nav />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7E4",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  locationButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  changeLocationButton: {
    position: "absolute",
    top: 80,
    right: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  clearRouteButton: {
    position: "absolute",
    top: 140,
    right: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  feirasListContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  feirasListTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  feirasListSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  feirasList: {
    paddingHorizontal: 16,
  },
  feiraCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 200,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  feiraCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  feiraCardName: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    flex: 1,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 10,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  feiraCardNeighborhood: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginBottom: 4,
  },
  feiraCardHours: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginBottom: 4,
  },
  feiraCardDistance: {
    fontSize: 12,
    fontFamily: "Poppins-SemiBold",
    color: "#4A7C59",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  addressInput: {
    borderWidth: 1,
    borderColor: "#E9ECEF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    marginBottom: 20,
    backgroundColor: "#F8F9FA",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  confirmButton: {
    backgroundColor: "#4A7C59",
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#666",
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
});

export default MapaScreen;
