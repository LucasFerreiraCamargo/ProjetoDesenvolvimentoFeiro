import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    paddingVertical: 0,
    margin: 0,
  },
  content: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  buttonImage: {
    width: 24,
    height: 24,
  },
  buttonText: {
    fontSize: 12,
    color: "#000",
    textAlign: "center",
    marginTop: 2,
    paddingHorizontal: 2,
  },
  buttonTextActive: {
    color: "#89a463",
  },
});

export default styles;
