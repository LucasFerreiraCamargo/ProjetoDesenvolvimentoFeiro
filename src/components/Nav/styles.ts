import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  nav: {
    backgroundColor: "#FFFFFF",
    width: width,
    height: 60,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: "rgba(0, 0, 0, 0.05)",
    shadowOffset: { width: 0, height: -1 },
    shadowRadius: 2,
    elevation: 2,
    shadowOpacity: 1,
  },
  div: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 60,
    paddingVertical: 0,
    paddingHorizontal: 0,
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  divLayout: {
    height: 60,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
  },
  div1: {
    flex: 1,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  div2: {
    flex: 1,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  div3: {
    flex: 1,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  div4: {
    flex: 1,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  div5: {
    flex: 1,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  frameIcon: {
    left: 0,
  },
  frameIcon1: {
    left: 0,
  },
  frameIcon2: {
    left: 0,
  },
  frameIcon3: {
    left: 0,
  },
  frameIcon4: {
    left: 0,
  },
  frameIconLayout: {
    height: 60,
    width: 80,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    overflow: "visible",
    paddingBottom: 0,
  },
});

export default styles;