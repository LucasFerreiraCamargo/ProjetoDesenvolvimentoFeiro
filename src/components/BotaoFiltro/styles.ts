import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  button: {
    borderRadius: 9999, // Formato de cápsula
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20, // Espaço interno para o texto
  },
  buttonInactive: {
    backgroundColor: "#fff",
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    borderWidth: 1,
  },
  buttonActive: {
    backgroundColor: "#89a463", // Verde quando ativo
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    textAlign: "center",
  },
  labelInactive: {
    color: "#000", // Preto quando inativo
  },
  labelActive: {
    color: "#fff", // Branco quando ativo
  },
});

export default styles;