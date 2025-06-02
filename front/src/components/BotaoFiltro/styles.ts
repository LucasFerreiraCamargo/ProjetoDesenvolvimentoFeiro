import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  button: {
    borderRadius: 9999,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  buttonInactive: {
    backgroundColor: "#fff",
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    borderWidth: 1,
  },
  buttonActive: {
    backgroundColor: "#89a463",
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
    color: "#000",
  },
  labelActive: {
    color: "#fff",
  },
});

export default styles;