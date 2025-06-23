import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CestaRecorrente, ItemCesta, useApp } from "../contexts/AppContext";

interface FrequenciaOpcao {
  id: string;
  nome: string;
  valor: string;
}

const frequenciasDisponiveis: FrequenciaOpcao[] = [
  {
    id: "semanal-seg",
    nome: "Toda Segunda-feira",
    valor: "Toda Segunda-feira",
  },
  { id: "semanal-ter", nome: "Toda Terça-feira", valor: "Toda Terça-feira" },
  { id: "semanal-qua", nome: "Toda Quarta-feira", valor: "Toda Quarta-feira" },
  { id: "semanal-qui", nome: "Toda Quinta-feira", valor: "Toda Quinta-feira" },
  { id: "semanal-sex", nome: "Toda Sexta-feira", valor: "Toda Sexta-feira" },
  { id: "quinzenal", nome: "A cada 15 dias", valor: "A cada 15 dias" },
  { id: "mensal", nome: "Uma vez por mês", valor: "Uma vez por mês" },
];

const tiposEntrega = [
  { id: "entrega", nome: "Entrega (R$ 5,00)", valor: "Entrega • R$ 5,00" },
  { id: "retirada", nome: "Retirada no local", valor: "Retirada no local" },
];

export default function EditarCestaRecorrenteScreen() {
  const { id } = useLocalSearchParams();
  const cestaId = Array.isArray(id) ? id[0] : id;
  const { state, dispatch } = useApp();

  // Buscar cesta recorrente existente
  const cestaExistente = state.cestasRecorrentes.find((c) => c.id === cestaId);

  const [nome, setNome] = useState(cestaExistente?.nome || "");
  const [frequenciaSelecionada, setFrequenciaSelecionada] = useState(
    cestaExistente?.frequencia || "Toda Segunda-feira"
  );
  const [entregaSelecionada, setEntregaSelecionada] = useState(
    cestaExistente?.entrega || "Entrega • R$ 5,00"
  );
  const [observacoes, setObservacoes] = useState("");
  const [produtos, setProdutos] = useState<ItemCesta[]>(
    cestaExistente?.produtos || []
  );

  const calcularTotal = () => {
    return produtos.reduce((total, produto) => {
      if (produto.unidade === "g") {
        return total + produto.preco * (produto.quantidade / 1000);
      }
      return total + produto.preco * produto.quantidade;
    }, 0);
  };

  const atualizarQuantidade = (index: number, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      // Remover produto se quantidade for 0
      const novosProdutos = produtos.filter((_, i) => i !== index);
      setProdutos(novosProdutos);
    } else {
      const novosProdutos = [...produtos];
      novosProdutos[index].quantidade = novaQuantidade;
      setProdutos(novosProdutos);
    }
  };

  const removerProduto = (index: number) => {
    Alert.alert(
      "Remover Produto",
      "Tem certeza que deseja remover este produto da cesta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => {
            const novosProdutos = produtos.filter((_, i) => i !== index);
            setProdutos(novosProdutos);
          },
        },
      ]
    );
  };

  const salvarAlteracoes = () => {
    if (!nome.trim()) {
      Alert.alert("Erro", "Por favor, preencha o nome da cesta.");
      return;
    }

    if (produtos.length === 0) {
      Alert.alert("Erro", "A cesta deve ter pelo menos um produto.");
      return;
    }

    const cestaAtualizada: CestaRecorrente = {
      id: cestaId,
      nome: nome.trim(),
      frequencia: frequenciaSelecionada,
      entrega: entregaSelecionada,
      feirante:
        cestaExistente?.feirante || "João da Silva - Banca 23 - Feira do Lobão",
      preco: `R$ ${calcularTotal().toFixed(2)}`,
      itens: produtos.length,
      ativa: cestaExistente?.ativa || true,
      produtos: produtos,
    };

    dispatch({ type: "UPDATE_CESTA_RECORRENTE", payload: cestaAtualizada });

    Alert.alert("Sucesso!", "As alterações da cesta recorrente foram salvas.", [
      {
        text: "OK",
        onPress: () => router.back(),
      },
    ]);
  };

  if (!cestaExistente) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Cesta recorrente não encontrada.</Text>
          <TouchableOpacity
            style={styles.voltarButton}
            onPress={() => router.back()}
          >
            <Text style={styles.voltarButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Cesta Recorrente</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Nome da Cesta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nome da Cesta</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Digite o nome da cesta"
            value={nome}
            onChangeText={setNome}
            placeholderTextColor="#999"
          />
        </View>

        {/* Produtos da Cesta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Produtos da Cesta ({produtos.length} itens)
          </Text>
          {produtos.length > 0 ? (
            produtos.map((produto, index) => (
              <View key={`${produto.id}-${index}`} style={styles.produtoCard}>
                {produto.imagem ? (
                  <Image
                    source={{ uri: produto.imagem }}
                    style={styles.produtoImagem}
                  />
                ) : (
                  <View style={[styles.produtoImagem, styles.imagePlaceholder]}>
                    <Ionicons name="image-outline" size={24} color="#ccc" />
                  </View>
                )}
                <View style={styles.produtoInfo}>
                  <Text style={styles.produtoNome}>{produto.nome}</Text>
                  <Text style={styles.produtoPreco}>
                    R$ {produto.preco.toFixed(2)} /
                    {produto.unidade === "g" ? "kg" : "unid"}
                  </Text>

                  <View style={styles.quantidadeControls}>
                    <TouchableOpacity
                      style={styles.quantidadeBtn}
                      onPress={() =>
                        atualizarQuantidade(
                          index,
                          produto.quantidade -
                            (produto.unidade === "g" ? 50 : 1)
                        )
                      }
                    >
                      <Ionicons name="remove" size={16} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.quantidadeDisplay}>
                      <Text style={styles.quantidadeText}>
                        {produto.unidade === "g"
                          ? `${produto.quantidade}g`
                          : produto.quantidade.toString()}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.quantidadeBtn}
                      onPress={() =>
                        atualizarQuantidade(
                          index,
                          produto.quantidade +
                            (produto.unidade === "g" ? 50 : 1)
                        )
                      }
                    >
                      <Ionicons name="add" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.produtoActions}>
                  <Text style={styles.produtoTotal}>
                    R${" "}
                    {produto.unidade === "g"
                      ? (produto.preco * (produto.quantidade / 1000)).toFixed(2)
                      : (produto.preco * produto.quantidade).toFixed(2)}
                  </Text>
                  <TouchableOpacity
                    style={styles.removerBtn}
                    onPress={() => removerProduto(index)}
                  >
                    <Ionicons name="trash" size={18} color="#E74C3C" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyProducts}>
              <Text style={styles.emptyText}>Nenhum produto na cesta</Text>
            </View>
          )}

          {/* Total da Cesta */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total da Cesta:</Text>
            <Text style={styles.totalValue}>
              R$ {calcularTotal().toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Frequência */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequência de Entrega</Text>
          {frequenciasDisponiveis.map((frequencia) => (
            <TouchableOpacity
              key={frequencia.id}
              style={[
                styles.opcaoButton,
                frequenciaSelecionada === frequencia.valor &&
                  styles.opcaoButtonSelecionada,
              ]}
              onPress={() => setFrequenciaSelecionada(frequencia.valor)}
            >
              <View style={styles.opcaoContent}>
                <View
                  style={[
                    styles.radioButton,
                    frequenciaSelecionada === frequencia.valor &&
                      styles.radioButtonSelecionado,
                  ]}
                >
                  {frequenciaSelecionada === frequencia.valor && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Text style={styles.opcaoTexto}>{frequencia.nome}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Opções de Entrega */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opções de Entrega</Text>
          {tiposEntrega.map((entrega) => (
            <TouchableOpacity
              key={entrega.id}
              style={[
                styles.opcaoButton,
                entregaSelecionada === entrega.valor &&
                  styles.opcaoButtonSelecionada,
              ]}
              onPress={() => setEntregaSelecionada(entrega.valor)}
            >
              <View style={styles.opcaoContent}>
                <View
                  style={[
                    styles.radioButton,
                    entregaSelecionada === entrega.valor &&
                      styles.radioButtonSelecionado,
                  ]}
                >
                  {entregaSelecionada === entrega.valor && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Text style={styles.opcaoTexto}>{entrega.nome}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Observações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observações (Opcional)</Text>
          <TextInput
            style={[styles.textInput, styles.observacoesInput]}
            placeholder="Digite observações especiais para o feirante..."
            value={observacoes}
            onChangeText={setObservacoes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#999"
          />
        </View>

        {/* Botão Salvar */}
        <TouchableOpacity
          style={styles.salvarButton}
          onPress={salvarAlteracoes}
        >
          <Text style={styles.salvarButtonText}>Salvar Alterações</Text>
        </TouchableOpacity>

        {/* Espaço para o Nav */}
        <View style={styles.navSpacer} />
      </ScrollView>
    </View>
  );
}

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
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  toggleContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    color: "#666",
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFF",
  },
  opcaoContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  opcaoSelecionada: {
    borderColor: "#10B981",
    backgroundColor: "#F0FDF4",
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonSelecionado: {
    borderColor: "#10B981",
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
  },
  opcaoTexto: {
    fontSize: 16,
    color: "#666",
  },
  opcaoTextoSelecionado: {
    color: "#333",
    fontWeight: "500",
  },
  infoCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 12,
    flex: 1,
  },
  botoesContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  salvarButton: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  salvarButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelarButton: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  cancelarButtonText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 30,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 20,
  },
  voltarButton: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  voltarButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#666",
  },
  opcaoButton: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  opcaoButtonSelecionada: {
    borderColor: "#10B981",
    backgroundColor: "#F0FDF4",
  },
  opcaoContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  navSpacer: {
    height: 30,
  },
  produtoCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  produtoImagem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  produtoInfo: {
    flex: 1,
  },
  produtoNome: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  produtoPreco: {
    fontSize: 14,
    color: "#666",
  },
  quantidadeControls: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  quantidadeBtn: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    padding: 8,
    marginHorizontal: 4,
  },
  quantidadeDisplay: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 8,
    marginHorizontal: 8,
  },
  quantidadeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  produtoActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  produtoTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  removerBtn: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
    padding: 8,
  },
  emptyProducts: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
  },
  totalContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  observacoesInput: {
    minHeight: 100,
  },
  imagePlaceholder: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
});
