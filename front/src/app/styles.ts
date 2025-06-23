import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#FFF7E4",
  },
  innerContainer: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    paddingBottom: 20,
  },
  placeholderText: {
    fontSize: 20,
    fontFamily: "Poppins-Regular",
    color: "#000",
    textAlign: "center",
  },
  // Banner Principal
  bannerPrincipal: {
    backgroundColor: "#4A7C59",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    position: "relative",
  },
  bannerTitulo: {
    fontSize: 32,
    fontFamily: "Poppins-SemiBold",
    color: "#FFF7E4",
    textAlign: "center",
  },
  bannerSubtitulo: {
    fontSize: 28,
    fontFamily: "Poppins-SemiBold",
    color: "#FFF7E4",
    textAlign: "center",
    marginTop: -5,
  },
  bannerLocal: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#FFF7E4",
    textAlign: "center",
    marginTop: 5,
  },
  bannerData: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#FFF7E4",
    textAlign: "center",
    marginTop: 2,
  },
  // Busca
  buscaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buscaPlaceholder: {
    marginLeft: 10,
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#999",
    flex: 1,
  },
  // Seções
  secaoContainer: {
    marginBottom: 24,
  },
  secaoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  secaoTitulo: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
  },
  verTodos: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#4A7C59",
  },
  // Categorias
  categoriasList: {
    paddingHorizontal: 4,
  },
  categoriaItem: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  categoriaText: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#4A4A4A",
    marginTop: 4,
    textAlign: "center",
  },
  // Promoções
  promocoesList: {
    paddingHorizontal: 4,
  },
  promocaoCard: {
    width: 140,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
  },
  promocaoHeader: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FF4444",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  promocaoDesconto: {
    fontSize: 10,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  promocaoEmoji: {
    fontSize: 40,
    textAlign: "center",
    marginVertical: 8,
  },
  promocaoProduto: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    textAlign: "center",
    marginBottom: 4,
  },
  promocaoPreco: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#4A7C59",
    textAlign: "center",
  },
  promocaoPrecoAntigo: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#999",
    textAlign: "center",
    textDecorationLine: "line-through",
  },
  // Feiras Abertas
  feiraAbertaCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feiraAbertaInfo: {
    marginBottom: 12,
  },
  feiraAbertaNome: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    marginBottom: 4,
  },
  feiraAbertaHorario: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
  },
  feiraAbertaActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  feiraAbertaButton: {
    backgroundColor: "#4A7C59",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flex: 1,
    marginRight: 8,
  },
  feiraAbertaButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  feiraAbertaMapButton: {
    borderWidth: 1,
    borderColor: "#4A7C59",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flex: 1,
    marginLeft: 8,
  },
  feiraAbertaMapText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#4A7C59",
    textAlign: "center",
  },
});

export default styles;
