import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ItemCesta, useCesta } from "../../contexts/CestaContext";
import { useUser } from "../../contexts/UserContext";
import CardRecorrente from "../../components/CardRecorrente";

const API_BASE =
  (process.env.EXPO_PUBLIC_API_URL as string) || "http://localhost:3001";

const FinalizaPedido = () => {
  const { state: cestaState, limparCesta } = useCesta();
  // `enderecoAtual` reflete o endereço selecionado no header (Modelo iFood).
  // Quando o cliente troca pelo dropdown, esta tela atualiza junto.
  const { user, enderecoAtual } = useUser();
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [tipoEntrega, setTipoEntrega] = useState<"endereco" | "feira">(
    "endereco"
  );
  const [horarioSelecionado, setHorarioSelecionado] = useState(
    "Hoje - Entre 14h e 16h"
  );
  const [showHorarios, setShowHorarios] = useState(false);
  const [observacoes, setObservacoes] = useState("");
  const [tipoPagamento, setTipoPagamento] = useState<
    "credito" | "pix" | "dinheiro"
  >("pix");
  const [numeroCartao, setNumeroCartao] = useState("");
  const [validadeCartao, setValidadeCartao] = useState("");
  const [cvvCartao, setCvvCartao] = useState("");
  const [trocoDinheiro, setTrocoDinheiro] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);

  const calcularSubtotal = () => {
    return cestaState.itens.reduce((total, item) => {
      // Para produtos em gramas, converter para kg para o cálculo do preço
      if (item.unidade === "g") {
        return total + item.preco * (item.quantidade / 1000);
      }
      return total + item.preco * item.quantidade;
    }, 0);
  };

  const subtotal = calcularSubtotal();
  const frete = tipoEntrega === "endereco" ? 2.5 : 0;
  const totalPedido = subtotal + frete;

  const opcoesHorario = [
    "Hoje - Entre 14h e 16h",
    "Hoje - Entre 16h e 18h",
    "Amanhã - Entre 8h e 12h",
    "Amanhã - Entre 14h e 18h",
  ];

  // Converte os itens do carrinho para o formato que a API espera
  // (mercadoria_id como number, e quantidade convertida de gramas para kg quando aplicável)
  function montarItemsParaApi() {
    return cestaState.itens
      .map((item) => {
        const mercadoriaId = Number(item.produtoId);
        if (Number.isNaN(mercadoriaId) || mercadoriaId <= 0) return null;

        // Se o item está em gramas, manda em kg pra bater com a unidade da mercadoria
        let quantidadeApi = item.quantidade;
        if (item.unidade === "g") {
          quantidadeApi = item.quantidade / 1000;
        }
        if (quantidadeApi <= 0) return null;

        return {
          mercadoria_id: mercadoriaId,
          quantidade: quantidadeApi,
        };
      })
      .filter(
        (it): it is { mercadoria_id: number; quantidade: number } =>
          it !== null
      );
  }

  // Extrai mensagem amigável de erros da API (Zod fieldErrors, string, etc.)
  function formataErroApi(data: any): string {
    if (!data) return "";
    const detalhes = data.detalhes ?? data.erro ?? data.error ?? data;
    if (!detalhes) return "";
    if (typeof detalhes === "string") return detalhes;
    if (detalhes && typeof detalhes === "object" && !Array.isArray(detalhes)) {
      const linhas: string[] = [];
      for (const k of Object.keys(detalhes)) {
        const v = (detalhes as any)[k];
        if (Array.isArray(v)) linhas.push(`${k}: ${v.join(", ")}`);
        else if (typeof v === "string") linhas.push(`${k}: ${v}`);
      }
      if (linhas.length) return linhas.join("\n");
    }
    try {
      return JSON.stringify(detalhes);
    } catch {
      return String(detalhes);
    }
  }

  const handleConfirmarPedido = async () => {
    if (enviandoPedido) return;

    // Validar se há itens na cesta
    if (cestaState.itens.length === 0) {
      Alert.alert(
        "Atenção",
        "Sua cesta está vazia. Adicione produtos antes de finalizar o pedido."
      );
      return;
    }

    // Validar termos
    if (!aceitouTermos) {
      Alert.alert(
        "Atenção",
        "Você precisa aceitar os termos e condições para continuar."
      );
      return;
    }

    // Validar endereço se entrega for no endereço.
    // Exige que o cliente tenha um endereço selecionado no header (modelo iFood).
    if (tipoEntrega === "endereco") {
      if (
        !enderecoAtual ||
        !enderecoAtual.endereco ||
        !enderecoAtual.bairro
      ) {
        Alert.alert(
          "Selecione um endereço",
          "Você precisa ter um endereço cadastrado para receber a entrega. Cadastre em 'Meus endereços'.",
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Cadastrar agora",
              onPress: () => router.push("/perfil/enderecos/index"),
            },
          ],
        );
        return;
      }
    }

    // Validar pagamento com cartão
    if (tipoPagamento === "credito") {
      if (!numeroCartao || numeroCartao.replace(/\s/g, "").length < 16) {
        Alert.alert(
          "Atenção",
          "Número do cartão inválido. Digite os 16 dígitos."
        );
        return;
      }
      if (!validadeCartao || validadeCartao.length < 5) {
        Alert.alert(
          "Atenção",
          "Data de validade inválida. Use o formato MM/AA."
        );
        return;
      }
      if (!cvvCartao || cvvCartao.length < 3) {
        Alert.alert("Atenção", "CVV inválido. Digite 3 ou 4 dígitos.");
        return;
      }
    }

    // Validar troco para dinheiro
    if (tipoPagamento === "dinheiro") {
      if (!trocoDinheiro) {
        Alert.alert("Atenção", "Informe o valor para o troco.");
        return;
      }
      const valorTroco = parseFloat(trocoDinheiro.replace(",", "."));
      if (isNaN(valorTroco) || valorTroco < totalPedido) {
        Alert.alert(
          "Atenção",
          "O valor para troco deve ser maior que o total do pedido."
        );
        return;
      }
    }

    // ──────────────────────────────────────────────────────────────────────
    // Persistência real do pedido na API
    // ──────────────────────────────────────────────────────────────────────
    if (!user || !user.id) {
      Alert.alert(
        "Você precisa estar logado",
        "Faça login para finalizar o pedido."
      );
      router.push("/login");
      return;
    }
    if (!user.token) {
      Alert.alert(
        "Sessão expirada",
        "Faça login novamente para finalizar o pedido."
      );
      router.push("/login");
      return;
    }

    const items = montarItemsParaApi();
    if (items.length === 0) {
      Alert.alert(
        "Atenção",
        "Nenhum item válido para enviar. Tente remover e adicionar os produtos novamente."
      );
      return;
    }

    const payload = {
      usuario_id: String(user.id),
      items,
    };
    console.log("[FinalizaPedido] enviando POST /pedido:", payload);

    setEnviandoPedido(true);
    try {
      const res = await fetch(`${API_BASE.replace(/\/$/, "")}/pedido`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.warn("[FinalizaPedido] API erro:", {
          status: res.status,
          body: data,
        });
        if (res.status === 401 || res.status === 403) {
          Alert.alert(
            "Sessão expirada",
            "Sua sessão expirou. Faça login novamente."
          );
          router.push("/login");
          return;
        }
        Alert.alert(
          "Não foi possível criar o pedido",
          formataErroApi(data) || `Erro ${res.status}`
        );
        return;
      }

      console.log("[FinalizaPedido] Pedido criado:", data);
      // Limpa a cesta após o pedido ser persistido com sucesso
      limparCesta();
      router.push("/pedido-confirmado");
    } catch (e: any) {
      console.error("[FinalizaPedido] Exceção:", e);
      Alert.alert(
        "Erro de conexão",
        e?.message ? `Detalhe: ${e.message}` : "Tente novamente em alguns segundos."
      );
    } finally {
      setEnviandoPedido(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return `R$ ${valor.toFixed(2).replace(".", ",")}`;
  };

  const formatarCartao = (valor: string) => {
    const numero = valor.replace(/\D/g, "");
    return numero.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

  const formatarValidade = (valor: string) => {
    const numero = valor.replace(/\D/g, "");
    if (numero.length >= 2) {
      return numero.slice(0, 2) + "/" + numero.slice(2, 4);
    }
    return numero;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finalizar Pedido</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Resumo do Pedido */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumo do Pedido</Text>
          {cestaState.itens.map((item: ItemCesta, index: number) => (
            <View key={index} style={styles.resumoItem}>
              <View style={styles.resumoInfo}>
                <Text style={styles.resumoNome}>{item.nome}</Text>
                <Text style={styles.resumoQuantidade}>
                  {item.unidade === "g"
                    ? `${item.quantidade}g`
                    : `${item.quantidade}${
                        item.quantidade > 1 ? " unids" : ""
                      }`}{" "}
                  x {formatarMoeda(item.preco)}/
                  {item.unidade === "g" ? "kg" : "unid"}
                </Text>
              </View>
              <Text style={styles.resumoTotal}>
                {formatarMoeda(
                  item.unidade === "g"
                    ? item.preco * (item.quantidade / 1000)
                    : item.preco * item.quantidade
                )}
              </Text>
            </View>
          ))}

          <View style={styles.resumoCalculos}>
            <View style={styles.resumoLinha}>
              <Text style={styles.resumoLabel}>Subtotal:</Text>
              <Text style={styles.resumoValue}>{formatarMoeda(subtotal)}</Text>
            </View>
            {tipoEntrega === "endereco" && (
              <View style={styles.resumoLinha}>
                <Text style={styles.resumoLabel}>Taxa de entrega:</Text>
                <Text style={styles.resumoValue}>{formatarMoeda(frete)}</Text>
              </View>
            )}
          </View>

          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatarMoeda(totalPedido)}</Text>
          </View>
        </View>

        {/* Como deseja receber? */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Como deseja receber?</Text>

          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setTipoEntrega("endereco")}
          >
            <View
              style={[
                styles.radioButton,
                tipoEntrega === "endereco" && styles.radioButtonSelected,
              ]}
            >
              {tipoEntrega === "endereco" && (
                <View style={styles.radioButtonDot} />
              )}
            </View>
            <View style={styles.radioContent}>
              <Text style={styles.radioTitle}>
                {enderecoAtual
                  ? `Entregar em "${enderecoAtual.label}"`
                  : "Entregar no meu endereço"}
              </Text>
              {enderecoAtual ? (
                <Text style={styles.radioSubtitle}>
                  {enderecoAtual.endereco}
                  {enderecoAtual.numero ? `, ${enderecoAtual.numero}` : ""}
                  {enderecoAtual.bairro ? ` - ${enderecoAtual.bairro}` : ""}
                  {enderecoAtual.cidade ? `, ${enderecoAtual.cidade}` : ""}
                  {enderecoAtual.uf ? `/${enderecoAtual.uf}` : ""}
                </Text>
              ) : (
                <Text style={[styles.radioSubtitle, { fontStyle: "italic" }]}>
                  Nenhum endereço cadastrado. Cadastre em "Meus endereços".
                </Text>
              )}
              <TouchableOpacity
                onPress={() =>
                  enderecoAtual
                    ? router.push({
                        pathname: "/perfil/enderecos/index",
                        params: { selecionado: String(enderecoAtual.id) },
                      })
                    : router.push("/perfil/enderecos/index")
                }
              >
                <Text style={styles.editarLink}>
                  {enderecoAtual
                    ? "Trocar endereço"
                    : "Cadastrar endereço"}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setTipoEntrega("feira")}
          >
            <View
              style={[
                styles.radioButton,
                tipoEntrega === "feira" && styles.radioButtonSelected,
              ]}
            >
              {tipoEntrega === "feira" && (
                <View style={styles.radioButtonDot} />
              )}
            </View>
            <View style={styles.radioContent}>
              <Text style={styles.radioTitle}>Retirar na feira</Text>
              <Text style={styles.radioSubtitle}>
                Feira Central - Sem taxa de entrega
              </Text>
            </View>
          </TouchableOpacity>

          {tipoEntrega === "endereco" && (
            <View style={styles.horarioSection}>
              <Text style={styles.horarioTitle}>
                Horário estimado para entrega
              </Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowHorarios(!showHorarios)}
              >
                <Text style={styles.selectButtonText}>
                  {horarioSelecionado}
                </Text>
                <Ionicons
                  name={showHorarios ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>

              {showHorarios && (
                <View style={styles.horariosDropdown}>
                  {opcoesHorario.map((horario, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.horarioOption}
                      onPress={() => {
                        setHorarioSelecionado(horario);
                        setShowHorarios(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.horarioOptionText,
                          horario === horarioSelecionado &&
                            styles.horarioOptionSelected,
                        ]}
                      >
                        {horario}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Observações */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Observações</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Instruções especiais para entrega..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            value={observacoes}
            onChangeText={setObservacoes}
            maxLength={200}
          />
          <Text style={styles.caracteresRestantes}>
            {observacoes.length}/200 caracteres
          </Text>
        </View>

        {/* Pagamento */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pagamento</Text>

          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setTipoPagamento("credito")}
          >
            <View
              style={[
                styles.radioButton,
                tipoPagamento === "credito" && styles.radioButtonSelected,
              ]}
            >
              {tipoPagamento === "credito" && (
                <View style={styles.radioButtonDot} />
              )}
            </View>
            <Text style={styles.radioTitle}>Cartão de Crédito</Text>
          </TouchableOpacity>

          {tipoPagamento === "credito" && (
            <View style={styles.cartaoInputs}>
              <View style={styles.cartaoNumeroContainer}>
                <Text style={styles.cartaoLabel}>Número do cartão</Text>
                <TextInput
                  style={[styles.input, styles.cartaoNumeroInput]}
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor="#999"
                  value={numeroCartao}
                  onChangeText={(text) => setNumeroCartao(formatarCartao(text))}
                  keyboardType="numeric"
                  maxLength={19}
                />
              </View>

              <View style={styles.cartaoDetalhesRow}>
                <View style={styles.cartaoDetalhesItem}>
                  <Text style={styles.cartaoLabel}>Validade</Text>
                  <TextInput
                    style={[styles.input, styles.cartaoDetalhesInput]}
                    placeholder="MM/AA"
                    placeholderTextColor="#999"
                    value={validadeCartao}
                    onChangeText={(text) =>
                      setValidadeCartao(formatarValidade(text))
                    }
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>

                <View style={styles.cartaoDetalhesItem}>
                  <Text style={styles.cartaoLabel}>CVV</Text>
                  <TextInput
                    style={[styles.input, styles.cartaoDetalhesInput]}
                    placeholder="123"
                    placeholderTextColor="#999"
                    value={cvvCartao}
                    onChangeText={setCvvCartao}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.cartaoInfo}>
                <Ionicons name="shield-checkmark" size={16} color="#2D5D31" />
                <Text style={styles.cartaoInfoText}>
                  Seus dados estão seguros e protegidos
                </Text>
              </View>
            </View>
          )}

          <View style={styles.espacamentoCartao} />

          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setTipoPagamento("pix")}
          >
            <View
              style={[
                styles.radioButton,
                tipoPagamento === "pix" && styles.radioButtonSelected,
              ]}
            >
              {tipoPagamento === "pix" && (
                <View style={styles.radioButtonDot} />
              )}
            </View>
            <Text style={styles.radioTitle}>PIX</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setTipoPagamento("dinheiro")}
          >
            <View
              style={[
                styles.radioButton,
                tipoPagamento === "dinheiro" && styles.radioButtonSelected,
              ]}
            >
              {tipoPagamento === "dinheiro" && (
                <View style={styles.radioButtonDot} />
              )}
            </View>
            <View style={styles.radioContent}>
              <Text style={styles.radioTitle}>Dinheiro</Text>
              <Text style={styles.radioSubtitle}>Pagamento na entrega</Text>
            </View>
          </TouchableOpacity>

          {tipoPagamento === "dinheiro" && (
            <TextInput
              style={styles.input}
              placeholder="Troco para quanto?"
              placeholderTextColor="#999"
              value={trocoDinheiro}
              onChangeText={setTrocoDinheiro}
              keyboardType="numeric"
            />
          )}
        </View>

        {/* Tornar cesta recorrente — vem marcado se o usuário já configurou
            no carrinho. Caso contrário, abre o modal aqui também. */}
        <View style={styles.checkboxCard}>
          <CardRecorrente />
        </View>

        {/* Aceitar termos */}
        <TouchableOpacity
          style={styles.checkboxCard}
          onPress={() => setAceitouTermos(!aceitouTermos)}
        >
          <View
            style={[styles.checkbox, aceitouTermos && styles.checkboxSelected]}
          >
            {aceitouTermos && <View style={styles.checkboxDot} />}
          </View>
          <Text style={styles.termosTexto}>
            Aceito os <Text style={styles.linkText}>termos e condições</Text>
          </Text>
        </TouchableOpacity>

        <View style={styles.navSpacer} />
      </ScrollView>

      {/* Footer com botões */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.confirmarButton,
            (!aceitouTermos || enviandoPedido) && styles.buttonDisabled,
          ]}
          onPress={handleConfirmarPedido}
          disabled={!aceitouTermos || enviandoPedido}
        >
          {enviandoPedido ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text
              style={[
                styles.confirmarButtonText,
                !aceitouTermos && styles.buttonTextDisabled,
              ]}
            >
              Confirmar Pedido - {formatarMoeda(totalPedido)}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.whatsappButton}>
          <Ionicons name="logo-whatsapp" size={20} color="#2D5D31" />
          <Text style={styles.whatsappButtonText}>
            Quero falar com o feirante
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7E4",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 44,
    paddingBottom: 20,
    backgroundColor: "#FFF7E4",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  resumoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  resumoInfo: {
    flex: 1,
  },
  resumoNome: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  resumoQuantidade: {
    fontSize: 14,
    color: "#666",
  },
  resumoTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  resumoCalculos: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 12,
    marginTop: 8,
  },
  resumoLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  resumoLabel: {
    fontSize: 14,
    color: "#666",
  },
  resumoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 2,
    borderTopColor: "#2D5D31",
    paddingTop: 16,
    marginTop: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D5D31",
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonSelected: {
    borderColor: "#2D5D31",
    backgroundColor: "#FFF",
  },
  radioContent: {
    flex: 1,
  },
  radioTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  radioSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  editarLink: {
    fontSize: 14,
    color: "#2D5D31",
    fontWeight: "600",
  },
  horarioSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  horarioTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  selectButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  selectButtonText: {
    fontSize: 16,
    color: "#333",
  },
  horariosDropdown: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  horarioOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  horarioOptionText: {
    fontSize: 16,
    color: "#333",
  },
  horarioOptionSelected: {
    color: "#2D5D31",
    fontWeight: "600",
  },
  textArea: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: "#333",
    textAlignVertical: "top",
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  caracteresRestantes: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 8,
  },
  input: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cartaoInputs: {
    marginTop: 20,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cartaoNumeroContainer: {
    marginBottom: 16,
  },
  cartaoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  cartaoNumeroInput: {
    fontSize: 18,
    letterSpacing: 2,
    fontFamily: "monospace",
  },
  cartaoDetalhesRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  cartaoDetalhesItem: {
    flex: 1,
  },
  cartaoDetalhesInput: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: "monospace",
  },
  cartaoInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F0F8F0",
    padding: 12,
    borderRadius: 8,
  },
  cartaoInfoText: {
    fontSize: 12,
    color: "#2D5D31",
    fontWeight: "500",
  },
  espacamentoCartao: {
    height: 24,
  },
  checkboxCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    borderColor: "#2D5D31",
    backgroundColor: "#FFF",
  },
  checkboxTexto: {
    flex: 1,
  },
  checkboxTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  checkboxSubtitle: {
    fontSize: 12,
    color: "#666",
  },
  termosTexto: {
    fontSize: 16,
    color: "#333",
  },
  linkText: {
    color: "#2D5D31",
    textDecorationLine: "underline",
  },
  footer: {
    backgroundColor: "#FFF7E4",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 12,
  },
  confirmarButton: {
    backgroundColor: "#2D5D31",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonDisabled: {
    backgroundColor: "#CCC",
  },
  confirmarButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonTextDisabled: {
    color: "#999",
  },
  whatsappButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#2D5D31",
  },
  whatsappButtonText: {
    color: "#2D5D31",
    fontSize: 16,
    fontWeight: "600",
  },
  navSpacer: {
    height: 20,
  },
  checkboxDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2D5D31",
  },
  radioButtonDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2D5D31",
  },
});

export default FinalizaPedido;
