import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  top: {
    backgroundColor: "#FFFFFF", // Fundo branco para o Top
    shadowColor: "rgba(0, 0, 0, 0.05)",
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
    shadowOpacity: 1,
    width: width, // Usa a largura da tela
    height: 60, // Altura definida anteriormente
    position: "absolute", // Garante que fique fixo no topo
    top: 0, // Fixa no topo
    left: 0, // Garante que comece no canto esquerdo
    right: 0, // Garante que termine no canto direito
  },
  topContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: "100%",
    width: "100%",
    paddingHorizontal: 16,
  },
  titleContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  feirasDaCidade: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    textAlign: "center",
    width: 155,
    height: 25,
  },
  buttonBackIcon: {
    position: "absolute",
    left: 16,
    zIndex: 1,
  },
  buttonNotificationIcon: {
    position: "absolute",
    right: 16,
    zIndex: 1,
  },
});

export default styles;