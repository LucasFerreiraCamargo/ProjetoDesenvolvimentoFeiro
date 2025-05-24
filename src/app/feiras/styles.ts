import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#FFF7E4",
  },
  innerContainer: {
    flex: 1,
    paddingTop: 60, // Espaço para o Top
    paddingHorizontal: 16,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: "transparent",
    marginTop: 8, // Espaço entre o Busca e a lista
  },
  feirasList: {
    padding: 16,
    paddingBottom: 100,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
  },
  feiraItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  feiraName: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
  },
  feiraLocation: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
  },
});

export default styles;