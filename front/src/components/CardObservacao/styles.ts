import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  h2: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  observacoes: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    textAlign: "left",
    flex: 1,
  },
  textareaWrapper: {
    height: 96,
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    borderWidth: 1,
    overflow: "hidden",
    width: '100%',
  },
  instrucoesEspeciaisPara: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#000",
    lineHeight: 24,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
});