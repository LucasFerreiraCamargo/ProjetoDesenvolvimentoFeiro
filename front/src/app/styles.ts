import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#FFF7E4", 
  },
  innerContainer: {
    flex: 1,
    paddingTop: 16, 
    paddingHorizontal: 16,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  content: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 20,
    fontFamily: "Poppins-Regular",
    color: "#000",
    textAlign: "center",
  },
});

export default styles;