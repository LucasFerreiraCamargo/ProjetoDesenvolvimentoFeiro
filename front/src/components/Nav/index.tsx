import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import * as React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "../Botao";
import styles from "./styles";

const Nav: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [activeButton, setActiveButton] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (pathname === "/") {
      setActiveButton("inicio");
    } else if (pathname === "/feiras") {
      setActiveButton("feiras");
    } else if (pathname === "/mapa") {
      setActiveButton("mapa");
    } else if (pathname === "/cesta") {
      setActiveButton("cesta");
    } else if (pathname === "/recorrente") {
      setActiveButton("recorrente");
    } else if (pathname === "/perfil") {
      setActiveButton("perfil");
    } else {
      setActiveButton(null);
    }
    console.log("Rota atual:", pathname, "ActiveButton:", activeButton);
  }, [pathname]);

  const handlePress = (buttonName: string, route?: string) => {
    console.log("Botão pressionado:", buttonName);
    setActiveButton(buttonName);
    if (route) {
      console.log("Redirecionando para:", route);
      router.push(route as any);
    } else {
      console.log(`${buttonName} pressionado (futuro)`);
    }
  };

  return (
    <SafeAreaView style={styles.nav} edges={["bottom"]}>
      <View style={[styles.div, styles.divLayout]}>
        <View style={styles.div1}>
          <CustomButton
            imagePath={require("../../../assets/images/frame.png")}
            activeImagePath={require("../../../assets/images/frame-active.png")}
            text="Início"
            onPress={() => handlePress("inicio", "/")}
            isActive={activeButton === "inicio"}
            style={[styles.frameIcon, styles.frameIconLayout]}
          />
        </View>
        <View style={styles.div2}>
          <CustomButton
            imagePath={require("../../../assets/images/frame1.png")}
            activeImagePath={require("../../../assets/images/frame1-active.png")}
            text="Mapa"
            onPress={() => handlePress("mapa", "/mapa")}
            isActive={activeButton === "mapa"}
            style={[styles.frameIcon1, styles.frameIconLayout]}
          />
        </View>
        <View style={styles.div3}>
          <CustomButton
            imagePath={require("../../../assets/images/frame2.png")}
            activeImagePath={require("../../../assets/images/frame2-active.png")}
            text="Cesta"
            onPress={() => handlePress("cesta", "/cesta")}
            isActive={activeButton === "cesta"}
            style={[styles.frameIcon2, styles.frameIconLayout]}
          />
        </View>
        <View style={styles.div4}>
          <CustomButton
            imagePath={require("../../../assets/images/frame3.png")}
            activeImagePath={require("../../../assets/images/frame3-active.png")}
            text="Recorrente"
            onPress={() => handlePress("recorrente", "/recorrente")}
            isActive={activeButton === "recorrente"}
            style={[
              styles.frameIcon3,
              styles.frameIconLayout,
              { marginTop: 0, paddingTop: 0 },
            ]}
          />
        </View>
        <View style={styles.div5}>
          <CustomButton
            imagePath={require("../../../assets/images/frame4.png")}
            activeImagePath={require("../../../assets/images/frame4-active.png")}
            text="Feiras"
            onPress={() => handlePress("feiras", "/feiras")}
            isActive={activeButton === "feiras"}
            style={[styles.frameIcon4, styles.frameIconLayout]}
          />
        </View>
        <View style={styles.div6}>
          <TouchableOpacity
            onPress={() => handlePress("perfil", "/perfil")}
            style={[
              styles.perfilButton,
              activeButton === "perfil" && styles.perfilButtonActive,
            ]}
          >
            <Ionicons
              name="person"
              size={20}
              color={activeButton === "perfil" ? "#4A7C59" : "#999"}
            />
            <Text
              style={[
                styles.perfilText,
                activeButton === "perfil" && styles.perfilTextActive,
              ]}
            >
              Perfil
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Nav;
