import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  top: {
    backgroundColor: "#FFFFFF",
    shadowColor: "rgba(0, 0, 0, 0.05)",
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
    shadowOpacity: 1,
    width: width,
    height: 60,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  topContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: "100%",
    width: "100%",
    paddingHorizontal: 16,
  },
  titleContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  feirasDaCidade: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    textAlign: "center",
    height: 25,
  },
  buttonBackIcon: {
    position: "absolute",
    left: 16,
    zIndex: 1,
  },
  buttonNotificationIcon: {
    position: "absolute",
    right: 16,
    zIndex: 1,
  },
});

export default styles;