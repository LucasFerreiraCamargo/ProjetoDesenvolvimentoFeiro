import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  section: {
    backgroundColor: 'transparent', 
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  label7: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 20,
  },
  input10: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#000",
    marginRight: 10,
    backgroundColor: "#fff",
    justifyContent: 'center',
    alignItems: 'center',
  },
  input10Selected: {
    backgroundColor: "#255336",
    borderColor: "#255336",
  },
  checkIcon: {
    color: "#fff",
    fontSize: 14,
    fontWeight: 'bold',
  },
  aceitoOsTermos: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#0075ff",
    textAlign: "left",
    textDecorationLine: "underline",
    lineHeight: 18,
  },
});