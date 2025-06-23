import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  view: {
    width: "100%", 
    shadowColor: "rgba(0, 0, 0, 0.05)",
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
    shadowOpacity: 1,
    borderRadius: 12,
    backgroundColor: "#fff", 
    padding: 24, 
  },

  // Seção: Número do Pedido
  orderNumberContainer: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 20, 
  },
  nmeroDoPedido: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#4b5563",
    textAlign: "left",
    lineHeight: 20, 
  },
  feiro25987: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    fontWeight: "600",
    color: "#000",
    textAlign: "right",
    lineHeight: 20,
  },

  // Separador e Detalhes do Pedido (antes era 'div2')
  detailsContainer: {
    borderTopWidth: 1, 
    borderColor: "#f3f4f6", 
    paddingTop: 24, 
  },

  // Estilo comum para cada item de detalhe (endereço, previsão, total)
  detailItem: {
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: 20, 
  },
  icon: { 
    height: 16, 
    resizeMode: 'contain',
    marginRight: 12, 
    marginTop: 2, 
    
  },
  detailTextContainer: {
    flex: 1, 
    flexDirection: 'column',
  },

  // Estilos de texto para Títulos de Detalhe (Endereço, Previsão, Valor Total)
  endereoDeEntrega: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#4b5563",
    textAlign: "left",
    lineHeight: 18,
  },
  previsoDeEntrega: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#4b5563",
    textAlign: "left",
    lineHeight: 18,
  },
  valorTotal: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#4b5563",
    textAlign: "left",
    lineHeight: 18,
  },

  // Estilos de texto para Conteúdo de Detalhe (Rua, Hoje, R$)
  ruaDasFlores: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    fontWeight: "600",
    color: "#000",
    textAlign: "left",
    marginTop: 2, 
    lineHeight: 18,
  },
  hojeEntre1400: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    fontWeight: "600",
    color: "#000",
    textAlign: "left",
    marginTop: 2,
    lineHeight: 18,
  },
  r1080: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    fontWeight: "600",
    color: "#000",
    textAlign: "left",
    marginTop: 2,
    lineHeight: 18,
  },
  detailRow: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 8,
},
});