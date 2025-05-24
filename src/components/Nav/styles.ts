import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  nav: {
    backgroundColor: "#FFFFFF", // Fundo branco para o Nav
    width: width, // Usa a largura da tela diretamente
    height: 55,
    position: "absolute",
    bottom: 0,
    left: 0, // Garante que começa no canto esquerdo
    right: 0, // Garante que termina no canto direito
    shadowColor: "rgba(0, 0, 0, 0.05)",
    shadowOffset: { width: 0, height: -1 },
    shadowRadius: 2,
    elevation: 2,
    shadowOpacity: 1,
  },
  div: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 48,
    paddingVertical: 16,
    paddingHorizontal: 0, // Remove padding horizontal para garantir largura total
    width: "100%", // Reforça a largura total
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  divLayout: {
    height: 48,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%", // Reforça a largura total
  },
  div1: {
    flex: 1,
    height: 48,
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  div2: {
    flex: 1,
    height: 48,
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  div3: {
    flex: 1,
    height: 48,
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  div4: {
    flex: 1,
    height: 48,
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  div5: {
    flex: 1,
    height: 48,
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  frameIcon: {
    top: 0,
    left: 0,
  },
  frameIcon1: {
    top: 0,
    left: 0,
  },
  frameIcon2: {
    top: 0,
    left: 0,
  },
  frameIcon3: {
    top: 0,
    left: 0,
  },
  frameIcon4: {
    top: 0,
    left: 0,
  },
  frameIconLayout: {
    height: 48,
    width: 24,
    position: "relative",
    alignItems: "center",
  },
});

export default styles;