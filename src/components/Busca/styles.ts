import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    marginTop: 16, // Espaço entre o Top e o Busca
  },
  input: {
    borderRadius: 50, // Formato de cápsula
    backgroundColor: "#fff",
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    borderWidth: 1,
    width: width * 0.9, // 90% da largura da tela
    height: 40, // Altura ajustada para 40px
    justifyContent: "center", // Centraliza verticalmente o conteúdo
    overflow: "hidden",
  },
  inputContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12, // Espaçamento interno
  },
  lupaIcon: {
    width: 14,
    height: 14,
    marginRight: 6, // Espaço entre a lupa e o texto
  },
  buscarFeiraOu: {
    fontSize: 16,
    lineHeight: 40, // Ajustado para centralizar verticalmente com a altura de 40px
    fontFamily: "Poppins-Regular",
    color: "#000", // Cor do texto digitado
    textAlign: "left",
    textAlignVertical: "center", // Centraliza verticalmente no Android
    paddingVertical: 0, // Remove padding vertical para evitar deslocamento
    flexShrink: 1, // Garante que o texto se ajuste ao espaço disponível
  },
});

export default styles;