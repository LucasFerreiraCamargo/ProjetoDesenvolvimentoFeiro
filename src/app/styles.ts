import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#FFF7E4", // Fundo pastel global
  },
  innerContainer: {
    flex: 1,
    paddingTop: 16, // Padding apenas no topo para o Header
    paddingHorizontal: 16, // Padding nas laterais para o conteúdo
  },
  contentWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  content: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 20,
    fontFamily: "Poppins-Regular",
    color: "#000",
    textAlign: "center",
  },
});

export default styles;