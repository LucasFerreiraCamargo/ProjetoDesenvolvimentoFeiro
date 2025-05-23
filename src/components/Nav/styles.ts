import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  nav: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    height: 80,
    position: "absolute",
    bottom: 0,
    shadowColor: "rgba(0, 0, 0, 0.05)",
    shadowOffset: { width: 0, height: -1 },
    shadowRadius: 2,
    elevation: 2,
    shadowOpacity: 1,
  },
  div: {
    flexDirection: "row",
    justifyContent: "space-around", // Distribui os botões com espaço igual
    alignItems: "center",
    height: 48,
    paddingVertical: 16,
    paddingHorizontal: 10, // Espaçamento lateral mínimo
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  divLayout: {
    height: 48,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
    left: 0, // Centraliza o ícone dentro do div
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
    position: "relative", // Mudança para relativo para alinhamento interno
    alignItems: "center",
  },
});

export default styles;