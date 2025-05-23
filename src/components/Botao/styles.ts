import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  buttonContainer: {
    backgroundColor: "rgba(0, 0, 0, 0)",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "column",
    alignItems: "center",
    minWidth: 60,
  },
  buttonImage: {
    width: 24,
    height: 24,
    marginBottom: 6,
  },
  buttonText: {
    fontSize: 12,
    fontFamily: "Poppins-SemiBold", // Títulos em Poppins-SemiBold
    color: "#000",
    textAlign: "center",
    lineHeight: 16,
    flexWrap: "nowrap",
    width: "100%",
  },
  buttonTextActive: {
    color: "#255336",
  },
});

export default styles;