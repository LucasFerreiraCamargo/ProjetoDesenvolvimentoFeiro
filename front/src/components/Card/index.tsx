import { router } from "expo-router";
import * as React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "./styles";

interface CardProps {
  name?: string;
  neighborhood?: string;
  hours?: string;
  distance?: string;
  isOpen?: boolean;
  onMapPress?: () => void;
}

const Card: React.FC<CardProps> = ({
  name = "Feira do Lobão",
  neighborhood = "Bairro Centro",
  hours = "7h às 14h",
  distance = "1.2 km",
  isOpen = true,
  onMapPress = () => router.push("/mapa"),
}) => {
  return (
    <SafeAreaView style={styles.card}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {name}
          </Text>
          <Text
            style={styles.neighborhood}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {neighborhood}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.status,
              isOpen ? styles.statusOpen : styles.statusClosed,
            ]}
          >
            <Text
              style={[styles.statusText, !isOpen && styles.statusTextClosed]}
            >
              {isOpen ? "Aberto" : "Fechado"}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.details}>
        <View style={styles.hours}>
          <Image
            source={require("../../../assets/images/relogio.png")}
            style={styles.icon}
            resizeMode="contain"
          />
          <Text
            style={styles.detailText}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {hours}
          </Text>
        </View>
        <View style={styles.distance}>
          <Image
            source={require("../../../assets/images/pin.png")}
            style={styles.icon}
            resizeMode="contain"
          />
          <Text
            style={styles.detailText}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {distance}
          </Text>
        </View>
      </View>
      <Pressable style={styles.mapButton} onPress={onMapPress}>
        <Text
          style={styles.mapButtonText}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          Ver no mapa
        </Text>
        <Image
          source={require("../../../assets/images/pin.png")}
          style={styles.mapButtonIcon}
          resizeMode="contain"
        />
      </Pressable>
    </SafeAreaView>
  );
};

export default Card;
