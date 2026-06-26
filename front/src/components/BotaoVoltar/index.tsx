/**
 * Botão "Voltar" reutilizável — chevron-back no canto superior esquerdo,
 * pensado para telas que vivem fora dos layouts com Header global (login,
 * cadastro, recuperação, etc.).
 *
 * Estratégia de navegação:
 *   - `router.canGoBack()` → `router.back()` (mantém histórico natural).
 *   - Senão (deep link direto, primeiro mount) → `router.replace('/')`
 *     pra mandar o cliente pra splash/home em vez de deixar ele preso.
 *
 * Props opcionais permitem ajustes cosméticos sem precisar duplicar o JSX
 * em cada tela:
 *   - `cor`           cor do ícone (default escuro pra cima de fundo claro)
 *   - `top` / `left`  ajuste de posicionamento absoluto
 *   - `destinoFallback` rota alternativa quando não há back stack
 *   - `aoVoltar`      callback executado antes da navegação (ex: limpar form)
 */

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as React from "react";
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

interface BotaoVoltarProps {
  cor?: string;
  top?: number;
  left?: number;
  destinoFallback?: string;
  aoVoltar?: () => void;
  style?: StyleProp<ViewStyle>;
}

const BotaoVoltar: React.FC<BotaoVoltarProps> = ({
  cor = "#2D5D31",
  top,
  left = 16,
  destinoFallback = "/",
  aoVoltar,
  style,
}) => {
  const topResolvido = top ?? (Platform.OS === "ios" ? 56 : 36);

  function handlePress() {
    aoVoltar?.();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    // Sem histórico (ex: cliente abriu o app direto na rota de login via deep
    // link) → joga pra rota de fallback.
    router.replace(destinoFallback as any);
  }

  return (
    <View
      style={[
        styles.wrap,
        { top: topResolvido, left },
        style,
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        style={({ pressed }) => [styles.botao, pressed && styles.botaoPressed]}
      >
        <Ionicons name="chevron-back" size={24} color={cor} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    zIndex: 10,
  },
  botao: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  botaoPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
});

export default BotaoVoltar;
