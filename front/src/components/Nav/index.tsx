import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import * as React from "react";
import { Text, TouchableOpacity, View } from "react-native";
// 1. Importamos o SafeAreaView da biblioteca correta
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "./styles";

const Nav: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { name: "Início", icon: "home", route: "/home" },
    { name: "Mapa", icon: "map", route: "/mapa" },
    { name: "Cesta", icon: "basket", route: "/cesta/cesta" },
    { name: "Recorrente", icon: "repeat", route: "/minhas-cestas" },
    { name: "Feiras", icon: "storefront", route: "/feiras" },
  ];

  return (
    // 2. Substituímos a View externa pelo SafeAreaView
    // 3. Usamos edges={['bottom']} para aplicar o espaçamento APENAS na parte inferior
    <SafeAreaView edges={['bottom']} style={styles.nav}>
      <View style={styles.div}>
        {navItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.navItem}
            onPress={() => router.push(item.route as any)}
          >
            <Ionicons
              name={item.icon as any}
              size={24}
              color={pathname === item.route ? "#255336" : "#666"}
            />
            <Text
              style={[
                styles.navText,
                { color: pathname === item.route ? "#255336" : "#666" },
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

export default Nav;