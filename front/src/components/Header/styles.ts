import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#FFF7E4",
    width: "100%",
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 30,
    shadowColor: "rgba(0, 0, 0, 0.05)",
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
    shadowOpacity: 1,
  },
  headerContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    width: "100%",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoSmall: {
    width: 60,
    height: 100,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: "#4A4A4A",
    fontWeight: "500",
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#255336",
    textAlign: "center",
    marginTop: 4,
  },
});

export default styles;
