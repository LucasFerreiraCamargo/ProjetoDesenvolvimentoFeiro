import * as React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";
import styles from "./styles";
import CustomButton from "../Botao";

const Nav: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [activeButton, setActiveButton] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (pathname === "/") {
      setActiveButton("inicio");
    } else if (pathname === "/feiras") {
      setActiveButton("feiras");
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
    <SafeAreaView style={styles.nav}>
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
            onPress={() => handlePress("mapa")}
            isActive={activeButton === "mapa"}
            style={[styles.frameIcon1, styles.frameIconLayout]}
          />
        </View>
        <View style={styles.div3}>
          <CustomButton
            imagePath={require("../../../assets/images/frame2.png")}
            activeImagePath={require("../../../assets/images/frame2-active.png")}
            text="Cesta"
            onPress={() => handlePress("cesta")}
            isActive={activeButton === "cesta"}
            style={[styles.frameIcon2, styles.frameIconLayout]}
          />
        </View>
        <View style={styles.div4}>
          <CustomButton
            imagePath={require("../../../assets/images/frame3.png")}
            activeImagePath={require("../../../assets/images/frame3-active.png")}
            text="Recorrente"
            onPress={() => handlePress("recorrente")}
            isActive={activeButton === "recorrente"}
            style={[styles.frameIcon3, styles.frameIconLayout]}
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
      </View>
    </SafeAreaView>
  );
};

export default Nav;