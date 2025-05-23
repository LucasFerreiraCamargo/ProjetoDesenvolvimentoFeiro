import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  feirasList: {
    padding: 16,
    paddingBottom: 100,
    backgroundColor: "#FFFFFF", // Fundo branco para a lista
  },
  feiraItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 8,
    backgroundColor: "#FFFFFF", // Fundo branco para cada item
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