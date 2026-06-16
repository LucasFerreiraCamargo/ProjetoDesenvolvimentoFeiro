import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import * as React from "react";
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useUser } from "../../contexts/UserContext";
import type { EnderecoUsuario } from "../../types/api";
import styles from "./styles";

const Header: React.FC = () => {
  const {
    user,
    logout,
    enderecos: meusEnderecos,
    enderecoAtual,
    enderecoSelecionadoId,
    setEnderecoSelecionado,
  } = useUser();

  const [dropdownEnderecosVisivel, setDropdownEnderecosVisivel] =
    React.useState(false);
  const [menuAdminVisivel, setMenuAdminVisivel] = React.useState(false);
  const [menuPerfilVisivel, setMenuPerfilVisivel] = React.useState(false);

  // Texto resumido para o header (mantém compacto)
  const enderecoResumido = (() => {
    if (!user) return "Faça login";
    if (!enderecoAtual) return "Adicionar endereço";
    // Ex: "Rua das Flores, 123 — Centro"
    const partes: string[] = [];
    if (enderecoAtual.endereco) {
      const trecho = enderecoAtual.numero
        ? `${enderecoAtual.endereco}, ${enderecoAtual.numero}`
        : enderecoAtual.endereco;
      partes.push(trecho);
    }
    if (enderecoAtual.bairro) partes.push(enderecoAtual.bairro);
    // Limite curto. A elipse final do React Native (numberOfLines+ellipsizeMode)
    // ainda cuida do corte visual quando o container fica apertado.
    let texto = partes.join(" • ");
    if (texto.length > 20) texto = `${texto.slice(0, 20)}…`;
    return texto;
  })();

  const handleAbrirPerfil = () => {
    setMenuPerfilVisivel(false);
    router.push("/perfil");
  };

  const handleAbrirMeusPedidos = () => {
    setMenuPerfilVisivel(false);
    router.push("/meus-pedidos");
  };

  const handleSair = () => {
    Alert.alert("Sair da conta", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => {
          setMenuPerfilVisivel(false);
          logout();
          router.replace("/login");
        },
      },
    ]);
  };

  // Toca no endereço do header
  const handleLocationPress = () => {
    if (!user) {
      // Sem usuário: leva pro login
      router.push("/login");
      return;
    }
    if (meusEnderecos.length === 0) {
      // Sem endereços: leva direto pra cadastro
      router.push("/perfil/enderecos/index");
      return;
    }
    // Tem endereço(s): abre dropdown para escolher
    setDropdownEnderecosVisivel(true);
  };

  const selecionarEndereco = (end: EnderecoUsuario) => {
    setEnderecoSelecionado(end.id);
    setDropdownEnderecosVisivel(false);
  };

  const irGerenciar = () => {
    setDropdownEnderecosVisivel(false);
    router.push("/perfil/enderecos/index");
  };

  const irAdicionar = () => {
    setDropdownEnderecosVisivel(false);
    router.push("/perfil/enderecos/index");
  };

  const handleNotificationPress = () => {
    router.push("/notificacoes");
  };

  const handleEntrarAdmin = () => {
    setMenuAdminVisivel(false);
    router.push("/admin/login");
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        {/* Esquerda: logo + endereço com seta */}
        <View style={styles.leftSection}>
          <Image
            source={require("../../../assets/images/logo.png")}
            style={styles.logoSmall}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.locationContainer}
            onPress={handleLocationPress}
            activeOpacity={0.7}
          >
            <Ionicons name="location" size={16} color="#4A4A4A" />
            <View style={enderecoStyles.locationTextWrap}>
              {enderecoAtual?.label ? (
                <Text style={enderecoStyles.locationLabel}>
                  {enderecoAtual.label}
                </Text>
              ) : null}
              <Text
                style={styles.locationText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {enderecoResumido}
              </Text>
            </View>
            <Ionicons
              name="chevron-down"
              size={14}
              color="#4A4A4A"
              style={{ marginLeft: 2 }}
            />
          </TouchableOpacity>
        </View>

        {/* Direita: ícones de ação — flexShrink:0 garante que nunca somem
            quando o texto do endereço fica longo. */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}
        >
          {usePathname() === "/home" && (
            <TouchableOpacity
              onPress={() => setMenuPerfilVisivel(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="person-outline" size={24} color="#4A4A4A" />
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={handleNotificationPress}>
            <Ionicons name="notifications-outline" size={24} color="#4A4A4A" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMenuAdminVisivel(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={24} color="#4A4A4A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Dropdown de endereços (estilo iFood) ─── */}
      <Modal
        visible={dropdownEnderecosVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownEnderecosVisivel(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setDropdownEnderecosVisivel(false)}
        >
          <View style={enderecoStyles.overlay}>
            <TouchableWithoutFeedback>
              <View style={enderecoStyles.dropdown}>
                <View style={enderecoStyles.dropdownHeader}>
                  <Ionicons name="location" size={18} color="#255336" />
                  <Text style={enderecoStyles.dropdownTitulo}>
                    Selecionar endereço
                  </Text>
                </View>

                <View style={enderecoStyles.divisor} />

                {meusEnderecos.map((end) => {
                  const selecionado =
                    end.id ===
                    (enderecoSelecionadoId ?? enderecoAtual?.id ?? -1);
                  return (
                    <TouchableOpacity
                      key={end.id}
                      style={[
                        enderecoStyles.item,
                        selecionado && enderecoStyles.itemSelecionado,
                      ]}
                      onPress={() => selecionarEndereco(end)}
                      activeOpacity={0.8}
                    >
                      <View style={enderecoStyles.itemRadioWrap}>
                        <View
                          style={[
                            enderecoStyles.itemRadio,
                            selecionado && enderecoStyles.itemRadioAtivo,
                          ]}
                        >
                          {selecionado && (
                            <View style={enderecoStyles.itemRadioPonto} />
                          )}
                        </View>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={enderecoStyles.itemTituloRow}>
                          <Text style={enderecoStyles.itemTitulo}>
                            {end.label}
                          </Text>
                          {end.principal && (
                            <View style={enderecoStyles.badge}>
                              <Ionicons name="star" size={9} color="#FFF" />
                              <Text style={enderecoStyles.badgeTexto}>
                                Principal
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={enderecoStyles.itemTexto} numberOfLines={2}>
                          {end.endereco}
                          {end.numero ? `, ${end.numero}` : ""}
                          {end.bairro ? ` — ${end.bairro}` : ""}
                          {end.cidade ? `, ${end.cidade}` : ""}
                          {end.uf ? `/${end.uf}` : ""}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                <View style={enderecoStyles.divisor} />

                <TouchableOpacity
                  style={enderecoStyles.acao}
                  onPress={irAdicionar}
                  activeOpacity={0.8}
                >
                  <View style={enderecoStyles.acaoIcone}>
                    <Ionicons name="add" size={18} color="#255336" />
                  </View>
                  <Text style={enderecoStyles.acaoTexto}>
                    Adicionar novo endereço
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={enderecoStyles.acao}
                  onPress={irGerenciar}
                  activeOpacity={0.8}
                >
                  <View style={enderecoStyles.acaoIcone}>
                    <Ionicons
                      name="settings-outline"
                      size={18}
                      color="#255336"
                    />
                  </View>
                  <Text style={enderecoStyles.acaoTexto}>
                    Gerenciar meus endereços
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal menu admin */}
      <Modal
        visible={menuAdminVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuAdminVisivel(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuAdminVisivel(false)}>
          <View style={menuStyles.overlay}>
            <TouchableWithoutFeedback>
              <View style={menuStyles.menu}>
                <View style={menuStyles.cabecalho}>
                  <Ionicons name="settings" size={18} color="#255336" />
                  <Text style={menuStyles.cabecalhoText}>Configurações</Text>
                </View>

                <View style={menuStyles.divisor} />

                <TouchableOpacity
                  style={menuStyles.item}
                  onPress={handleEntrarAdmin}
                  activeOpacity={0.8}
                >
                  <View style={menuStyles.itemIcone}>
                    <Ionicons
                      name="storefront-outline"
                      size={20}
                      color="#255336"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={menuStyles.itemTitulo}>Área do Feirante</Text>
                    <Text style={menuStyles.itemSub}>
                      Acessar painel administrativo
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#999" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    menuStyles.item,
                    { borderTopWidth: 1, borderTopColor: "#F0F0F0" },
                  ]}
                  onPress={() => setMenuAdminVisivel(false)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[menuStyles.itemIcone, { backgroundColor: "#FFF0F0" }]}
                  >
                    <Ionicons name="close-outline" size={20} color="#999" />
                  </View>
                  <Text style={[menuStyles.itemTitulo, { color: "#999" }]}>
                    Fechar
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal: menu da conta do cliente */}
      <Modal
        visible={menuPerfilVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuPerfilVisivel(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuPerfilVisivel(false)}>
          <View style={menuStyles.overlay}>
            <TouchableWithoutFeedback>
              <View style={menuStyles.menu}>
                <View style={menuStyles.cabecalho}>
                  <Ionicons name="person-circle" size={18} color="#255336" />
                  <Text style={menuStyles.cabecalhoText}>Minha conta</Text>
                </View>

                <View style={menuStyles.divisor} />

                <TouchableOpacity
                  style={menuStyles.item}
                  onPress={handleAbrirPerfil}
                  activeOpacity={0.8}
                >
                  <View style={menuStyles.itemIcone}>
                    <Ionicons name="person-outline" size={20} color="#255336" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={menuStyles.itemTitulo}>Meu perfil</Text>
                    <Text style={menuStyles.itemSub}>
                      Dados cadastrais e endereço
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#999" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    menuStyles.item,
                    { borderTopWidth: 1, borderTopColor: "#F0F0F0" },
                  ]}
                  onPress={handleAbrirMeusPedidos}
                  activeOpacity={0.8}
                >
                  <View style={menuStyles.itemIcone}>
                    <Ionicons name="receipt-outline" size={20} color="#255336" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={menuStyles.itemTitulo}>Meus pedidos</Text>
                    <Text style={menuStyles.itemSub}>
                      Histórico e acompanhamento
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#999" />
                </TouchableOpacity>

                {user ? (
                  <TouchableOpacity
                    style={[
                      menuStyles.item,
                      { borderTopWidth: 1, borderTopColor: "#F0F0F0" },
                    ]}
                    onPress={handleSair}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[menuStyles.itemIcone, { backgroundColor: "#FEE2E2" }]}
                    >
                      <Ionicons
                        name="log-out-outline"
                        size={20}
                        color="#DC2626"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[menuStyles.itemTitulo, { color: "#DC2626" }]}>
                        Sair da conta
                      </Text>
                      <Text style={menuStyles.itemSub}>
                        {user.email ?? "Encerrar sessão"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={[
                    menuStyles.item,
                    { borderTopWidth: 1, borderTopColor: "#F0F0F0" },
                  ]}
                  onPress={() => setMenuPerfilVisivel(false)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[menuStyles.itemIcone, { backgroundColor: "#FFF0F0" }]}
                  >
                    <Ionicons name="close-outline" size={20} color="#999" />
                  </View>
                  <Text style={[menuStyles.itemTitulo, { color: "#999" }]}>
                    Fechar
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const menuStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 90,
    paddingRight: 16,
  },
  menu: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    width: 260,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#F8FBF8",
  },
  cabecalhoText: {
    fontSize: 13,
    fontFamily: "Poppins-SemiBold",
    color: "#255336",
  },
  divisor: { height: 1, backgroundColor: "#F0F0F0" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemIcone: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#E8F5E8",
    justifyContent: "center",
    alignItems: "center",
  },
  itemTitulo: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#333333",
  },
  itemSub: {
    fontSize: 11,
    fontFamily: "Poppins-Regular",
    color: "#999999",
    marginTop: 1,
  },
});

// Estilos do dropdown de endereços (estilo iFood)
const enderecoStyles = StyleSheet.create({
  // flex:1 + minWidth:0 deixam o texto encolher e aplicar ellipsis em vez
  // de empurrar os ícones da direita pra fora da tela.
  locationTextWrap: { flex: 1, minWidth: 0 },
  locationLabel: {
    fontSize: 10,
    color: "#7A8A7C",
    fontWeight: "600",
    lineHeight: 12,
    textTransform: "uppercase",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    paddingTop: 90,
    paddingLeft: 16,
    paddingRight: 16,
  },
  dropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    width: "100%",
    maxWidth: 340,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#F8FBF8",
  },
  dropdownTitulo: {
    fontSize: 13,
    fontFamily: "Poppins-SemiBold",
    color: "#255336",
  },
  divisor: { height: 1, backgroundColor: "#F0F0F0" },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
  },
  itemSelecionado: { backgroundColor: "#F4FAF5" },
  itemRadioWrap: { paddingTop: 2 },
  itemRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#CFD8CF",
    alignItems: "center",
    justifyContent: "center",
  },
  itemRadioAtivo: { borderColor: "#4A7C59" },
  itemRadioPonto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4A7C59",
  },
  itemTituloRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  itemTitulo: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#255336",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#4A7C59",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeTexto: { color: "#FFF", fontSize: 9, fontFamily: "Poppins-SemiBold" },
  itemTexto: { fontSize: 12, color: "#666", lineHeight: 16 },

  acao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  acaoIcone: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E8F5E8",
    alignItems: "center",
    justifyContent: "center",
  },
  acaoTexto: {
    fontSize: 13,
    fontFamily: "Poppins-SemiBold",
    color: "#255336",
  },
});

export default Header;
