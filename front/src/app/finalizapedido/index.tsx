import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ItemCesta, useCesta } from "../../contexts/CestaContext";

const FinalizaPedido = () => {
  const { state: cestaState } = useCesta();
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
  const [recorrente, setRecorrente] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [endereco, setEndereco] = useState({
    rua: "Rua das Flores",
    numero: "123",
    bairro: "Jardim Primavera",
    cidade: "São Paulo",
    estado: "SP",
  });

  useEffect(() => {
    carregarEndereco();
  }, []);

  const carregarEndereco = async () => {
    try {
      const enderecoSalvo = await AsyncStorage.getItem("endereco_usuario");
      if (enderecoSalvo) {
        const enderecoData = JSON.parse(enderecoSalvo);
        setEndereco({
          rua: enderecoData.rua,
          numero: enderecoData.numero,
          bairro: enderecoData.bairro,
          cidade: enderecoData.cidade,
          estado: enderecoData.estado,
        });
      }
    } catch (error) {
      console.log("Erro ao carregar endereço:", error);
    }
  };

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

  const handleConfirmarPedido = () => {
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

    // Validar endereço se entrega for no endereço
    if (tipoEntrega === "endereco") {
      if (
        !endereco.rua ||
        !endereco.numero ||
        !endereco.bairro ||
        !endereco.cidade
      ) {
        Alert.alert(
          "Atenção",
          "Complete as informações do endereço de entrega."
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

    // Se chegou até aqui, tudo está validado
    router.push("/pedido-confirmado");
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

  useFocusEffect(
    useCallback(() => {
      carregarEndereco();
    }, [])
  );

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
              <Text style={styles.radioTitle}>Entregar no meu endereço</Text>
              <Text style={styles.radioSubtitle}>
                {endereco.rua}, {endereco.numero} - {endereco.bairro},{" "}
                {endereco.cidade}/{endereco.estado}
              </Text>
              <TouchableOpacity onPress={() => router.push("/edita-endereco")}>
                <Text style={styles.editarLink}>Editar endereço</Text>
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

        {/* Tornar cesta recorrente */}
        <TouchableOpacity
          style={styles.checkboxCard}
          onPress={() => {
            if (!recorrente) {
              // Quando marca para recorrente, navegar para configuração
              router.push("/recorrente?nova=true");
            } else {
              // Se já estava marcado, apenas desmarcar
              setRecorrente(false);
            }
          }}
        >
          <View
            style={[styles.checkbox, recorrente && styles.checkboxSelected]}
          >
            {recorrente && <View style={styles.checkboxDot} />}
          </View>
          <View style={styles.checkboxTexto}>
            <Text style={styles.checkboxTitle}>Tornar cesta recorrente</Text>
            <Text style={styles.checkboxSubtitle}>
              Receba estes itens automaticamente toda semana
            </Text>
          </View>
        </TouchableOpacity>

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
            !aceitouTermos && styles.buttonDisabled,
          ]}
          onPress={handleConfirmarPedido}
          disabled={!aceitouTermos}
        >
          <Text
            style={[
              styles.confirmarButtonText,
              !aceitouTermos && styles.buttonTextDisabled,
            ]}
          >
            Confirmar Pedido - {formatarMoeda(totalPedido)}
          </Text>
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
