import { StyleSheet } from "react-native";

export default StyleSheet.create({
  nav: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingBottom: 20,
    paddingTop: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  div: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    height: 60,
  },

  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },

  navText: {
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
    fontWeight: "500",
  },

  // Os estilos para div1, div2, etc. (os wrappers de CustomButton)
  div1: { flex: 1, alignItems: "center", justifyContent: "center" },
  div2: { flex: 1, alignItems: "center", justifyContent: "center" },
  div3: { flex: 1, alignItems: "center", justifyContent: "center" },
  div4: { flex: 1, alignItems: "center", justifyContent: "center" },
  div5: { flex: 1, alignItems: "center", justifyContent: "center" },
});
