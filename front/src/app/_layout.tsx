import { useFonts } from "expo-font";
import { Slot, usePathname } from "expo-router";
import * as React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import CestaFlutuante from "../components/CestaFlutuante";
import Header from "../components/Header";
import Nav from "../components/Nav";
import { AdminProvider } from "../contexts/AdminContext";
import { AppProvider } from "../contexts/AppContext";
import { CestaProvider } from "../contexts/CestaContext";
import { UserProvider } from "../contexts/UserContext";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-SemiBold": require("../../assets/fonts/Poppins-SemiBold.ttf"),
  });

  const pathname = usePathname();

  // Telas fullscreen — sem header e sem navbar global. Duas listas:
  //   - exact: match exato de pathname
  //   - prefix: pathname começa com (rota dinâmica)
  //
  // Por que pedido-confirmado: como o cliente acabou de finalizar, vamos
  // forçá-lo a usar os CTAs explícitos da tela ('Acompanhar', 'Ver meus
  // pedidos', 'Voltar') em vez de cair por engano em 'Recorrente' da navbar.
  //
  // Por que /chat: a tela é COMPARTILHADA entre cliente e feirante. Com a
  // navbar do cliente aparecendo, o feirante vinha da área admin e ficava
  // com a UI errada. Solução: chat é fullscreen com seu próprio Stack.Screen
  // header — válido pros dois lados.
  const pagesWithoutHeaderNav = [
    "/",
    "/login",
    "/onboarding",
    "/pedido-confirmado",
  ];
  const prefixesWithoutHeaderNav = ["/chat"];
  const isAdminRoute = pathname.startsWith("/admin");

  // Páginas que têm header customizado (apenas cesta)
  const pagesWithCustomHeader = ["/cesta"];
  const hasCustomHeader = pagesWithCustomHeader.includes(pathname);

  const isPaginaSemHeaderNav =
    pagesWithoutHeaderNav.includes(pathname) ||
    prefixesWithoutHeaderNav.some((p) => pathname.startsWith(p));
  const shouldShowHeaderNav = !isPaginaSemHeaderNav && !isAdminRoute;

  // Onde NÃO mostrar a cestinha flutuante. Lista por que cada uma:
  //  - /cesta/*       → já estamos vendo a cesta
  //  - /finalizapedido → estamos finalizando, botão repetido confunde
  //  - /pedido-confirmado → pedido fechado, cesta já foi limpa
  //  - /chat/*        → tela compartilhada cliente+feirante, não faz sentido
  //  - /login, /, /onboarding → sem usuário logado
  //  - rotas admin → não tem fluxo de cesta
  const pagesWithoutFloatingCart = [
    "/cesta/cesta",
    "/finalizapedido",
    "/pedido-confirmado",
    "/chat",
  ];
  const shouldShowFloatingCart =
    !isAdminRoute &&
    !isPaginaSemHeaderNav &&
    !pagesWithoutFloatingCart.some((p) => pathname.startsWith(p));

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <UserProvider>
          <AdminProvider>
          <CestaProvider>
          <SafeAreaView style={styles.container} edges={[]}>
            {shouldShowHeaderNav && !hasCustomHeader && <Header />}
            <View style={styles.content}>
              <Slot />
            </View>
            {/* Cestinha flutuante global — fica acima da navbar quando ela
                está visível, encostada no fundo quando não está. */}
            {shouldShowFloatingCart && (
              <CestaFlutuante bottomOffset={shouldShowHeaderNav ? 90 : 20} />
            )}
            {shouldShowHeaderNav && <Nav />}
          </SafeAreaView>
          </CestaProvider>
          </AdminProvider>
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
