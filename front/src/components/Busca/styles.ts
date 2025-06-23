import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    marginTop: 16,
  },
  input: {
    borderRadius: 50,
    backgroundColor: "#fff",
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    borderWidth: 1,
    width: width * 0.9,
    height: 40,
    justifyContent: "center",
    overflow: "hidden",
  },
  inputContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start", 
    paddingHorizontal: 12,
  },
  lupaIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
  },
  buscarFeiraOu: {
    fontSize: 16,
    lineHeight: 40, 
    fontFamily: "Poppins-Regular",
    color: "#000",
    textAlign: "left", 
    textAlignVertical: "center",
    paddingVertical: 0,
    flexShrink: 0, 
  },
});

export default styles;