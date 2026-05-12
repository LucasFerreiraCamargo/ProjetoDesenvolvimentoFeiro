import { useFonts } from "expo-font";
import { Slot, usePathname } from "expo-router";
import * as React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/Header";
import Nav from "../components/Nav";
import { AppProvider } from "../contexts/AppContext";
import { CestaProvider } from "../contexts/CestaContext";
import { UserProvider } from "../contexts/UserContext";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-SemiBold": require("../../assets/fonts/Poppins-SemiBold.ttf"),
  });

  const pathname = usePathname();

  // Páginas que não devem ter header e nav
  const pagesWithoutHeaderNav = ["/", "/login", "/onboarding"];
  const isAdminRoute = pathname.startsWith("/admin");

  // Páginas que têm header customizado (apenas cesta)
  const pagesWithCustomHeader = ["/cesta"];
  const hasCustomHeader = pagesWithCustomHeader.includes(pathname);

  const shouldShowHeaderNav = !pagesWithoutHeaderNav.includes(pathname) && !isAdminRoute;

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <UserProvider>
          <CestaProvider>
          <SafeAreaView style={styles.container} edges={[]}>
            {shouldShowHeaderNav && !hasCustomHeader && <Header />}
            <View style={styles.content}>
              <Slot />
            </View>
            {shouldShowHeaderNav && <Nav />}
          </SafeAreaView>
          </CestaProvider>
        </UserProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7E4",
  },
  content: {
    flex: 1,
  },
});
