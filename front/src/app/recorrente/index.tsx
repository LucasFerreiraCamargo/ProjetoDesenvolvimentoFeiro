import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useApp } from "../../contexts/AppContext";
import { useCesta } from "../../contexts/CestaContext";

interface CestaRecorrente {
  id: string;
  nome: string;
  feirante: string;
  frequencia: string;
  entrega: string;
  preco: string;
  itens: number;
  ativa: boolean;
}

const CestaRecorrenteCard = ({
  cesta,
  onCancelar,
}: {
  cesta: any;
  onCancelar: (id: string) => void;
}) => (
  <View style={styles.cestaCard}>
    {/* Título e Badge */}
    <View style={styles.cestaHeader}>
      <Text style={styles.cestaNome}>{cesta.nome}</Text>
      <View style={styles.ativaBadge}>
        <Text style={styles.ativaText}>Ativa</Text>
      </View>
    </View>

    {/* Feirante */}
    <Text style={styles.feiranteText}>{cesta.feirante}</Text>

    {/* Frequência */}
    <View style={styles.infoRow}>
      <Ionicons name="time" size={16} color="#333" />
      <Text style={styles.infoText}>{cesta.frequencia}</Text>
    </View>

    {/* Entrega */}
    <View style={styles.infoRow}>
      <Ionicons name="car" size={16} color="#333" />
      <Text style={styles.infoText}>{cesta.entrega}</Text>
    </View>

    {/* Itens e Preço */}
    <View style={styles.infoRow}>
      <Ionicons name="basket" size={16} color="#333" />
      <Text style={styles.infoText}>
        {cesta.itens} itens • {cesta.preco}
      </Text>
    </View>

    {/* Botões */}
    <View style={styles.botoesContainer}>
      <TouchableOpacity
        style={styles.editarButton}
        onPress={() => router.push(`/editar-cesta-recorrente?id=${cesta.id}`)}
      >
        <Text style={styles.editarButtonText}>Editar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.cancelarButton}
        onPress={() => {
          Alert.alert(
            "Cancelar Cesta Recorrente",
            `Tem certeza que deseja cancelar a cesta "${cesta.nome}"?`,
            [
              { text: "Não", style: "cancel" },
              {
                text: "Sim, cancelar",
                style: "destructive",
                onPress: () => {
                  onCancelar(cesta.id);
                  Alert.alert(
                    "Cancelada",
                    "Cesta recorrente cancelada com sucesso!"
                  );
                },
              },
            ]
          );
        }}
      >
        <Text style={styles.cancelarButtonText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const NovaQuestaRecorrente = ({
  onSalvar,
  onCancelar,
}: {
  onSalvar: (dados: any) => void;
  onCancelar: () => void;
}) => {
  const { state: cestaState } = useCesta();
  const [nomeCesta, setNomeCesta] = useState("");
  const [frequencia, setFrequencia] = useState("Semanal");
  const [diaSemana, setDiaSemana] = useState("Segunda-feira");

  const frequenciaOpcoes = ["Semanal", "Quinzenal", "Mensal"];
  const diasSemana = [
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
    "Domingo",
  ];

  const total = cestaState.itens.reduce((acc, item) => {
    return (
      acc +
      item.preco *
        (item.unidade === "g" ? item.quantidade / 1000 : item.quantidade)
    );
  }, 0);

  const salvarCestaRecorrente = () => {
    if (!nomeCesta.trim()) {
      Alert.alert(
        "Atenção",
        "Por favor, digite um nome para a cesta recorrente."
      );
      return;
    }

    const dadosCesta = {
      id: Date.now().toString(),
      nome: nomeCesta.trim(),
      feirante: cestaState.itens[0]?.feiranteNome || "Feirante",
      frequencia: `${frequencia} - ${diaSemana}`,
      entrega: "Entrega em domicílio",
      preco: `R$ ${total.toFixed(2)}`,
      itens: cestaState.itens.length,
      ativa: true,
      produtos: cestaState.itens,
    };

    onSalvar(dadosCesta);
  };

  return (
    <View style={styles.novaCestaContainer}>
      <Text style={styles.novaCestaTitle}>Configurar Cesta Recorrente</Text>

      <View style={styles.resumoCarrinho}>
        <Text style={styles.resumoTitle}>Itens selecionados:</Text>
        <Text style={styles.resumoInfo}>
          {cestaState.itens.length} itens • Total: R$ {total.toFixed(2)}
        </Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Nome da cesta recorrente:</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Cesta Semanal de Verduras"
          value={nomeCesta}
          onChangeText={setNomeCesta}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Frequência:</Text>
        <View style={styles.opcoesList}>
          {frequenciaOpcoes.map((opcao) => (
            <TouchableOpacity
              key={opcao}
              style={[
                styles.opcaoButton,
                frequencia === opcao && styles.opcaoButtonAtiva,
              ]}
              onPress={() => setFrequencia(opcao)}
            >
              <Text
                style={[
                  styles.opcaoText,
                  frequencia === opcao && styles.opcaoTextAtiva,
                ]}
              >
                {opcao}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Dia da entrega:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.diasScroll}
        >
          <View style={styles.diasList}>
            {diasSemana.map((dia) => (
              <TouchableOpacity
                key={dia}
                style={[
                  styles.diaButton,
                  diaSemana === dia && styles.diaButtonAtivo,
                ]}
                onPress={() => setDiaSemana(dia)}
              >
                <Text
                  style={[
                    styles.diaText,
                    diaSemana === dia && styles.diaTextAtivo,
                  ]}
                >
                  {dia.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.botoesNovaCesta}>
        <TouchableOpacity
          style={styles.cancelarNovaButton}
          onPress={onCancelar}
        >
          <Text style={styles.cancelarNovaText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.salvarButton}
          onPress={salvarCestaRecorrente}
        >
          <Text style={styles.salvarButtonText}>Salvar Cesta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function CestasRecorrentesScreen() {
  const { state, dispatch } = useApp();
  const { state: cestaState } = useCesta();
  const params = useLocalSearchParams();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const cestasRecorrentes = state.cestasRecorrentes;

  // Só mostrar formulário automaticamente se tem parâmetro "nova" na URL (vindo do finalizar pedido)
  useEffect(() => {
    console.log(
      "Página recorrente carregada - itens no carrinho:",
      cestaState.itens.length
    );

    // Só mostra formulário automaticamente se:
    // 1. Tem itens na cesta E
    // 2. Tem parâmetro "nova=true" (vindo do finalizar pedido)
    if (cestaState.itens.length > 0 && params.nova === "true") {
      console.log("Mostrando formulário de nova cesta");
      setMostrarFormulario(true);
    }
  }, [cestaState.itens, params.nova]);

  const handleSalvarCesta = (dadosCesta: any) => {
    // Adicionar a nova cesta ao contexto global
    dispatch({
      type: "ADD_CESTA_RECORRENTE",
      payload: dadosCesta,
    });

    Alert.alert(
      "Cesta Recorrente Criada!",
      `A cesta "${
        dadosCesta.nome
      }" foi configurada com sucesso. Você receberá os itens ${dadosCesta.frequencia.toLowerCase()}.`,
      [
        {
          text: "Ver Minhas Cestas",
          onPress: () => {
            setMostrarFormulario(false);
            // Redirecionar para a página recorrente sem o parâmetro "nova"
            router.replace("/");
          },
        },
      ]
    );
  };

  const handleCancelarNova = () => {
    setMostrarFormulario(false);
    // Se veio com parâmetro "nova", redirecionar para a página sem o parâmetro
    if (params.nova === "true") {
      router.replace("/");
    } else {
      router.back();
    }
  };

  const handleCancelarCesta = (cestaId: string) => {
    dispatch({
      type: "DELETE_CESTA_RECORRENTE",
      payload: cestaId,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#2D5D31" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mostrarFormulario ? "Nova Cesta Recorrente" : "Cestas Recorrentes"}
        </Text>
        {!mostrarFormulario && (
          <TouchableOpacity onPress={() => setMostrarFormulario(true)}>
            <Ionicons name="add" size={24} color="#2D5D31" />
          </TouchableOpacity>
        )}
        {mostrarFormulario && <View style={{ width: 24 }} />}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {mostrarFormulario ? (
          <NovaQuestaRecorrente
            onSalvar={handleSalvarCesta}
            onCancelar={handleCancelarNova}
          />
        ) : (
          <>
            {/* Lista de Cestas */}
            <View style={styles.cestasList}>
              {cestasRecorrentes.length > 0 ? (
                cestasRecorrentes.map((cesta) => (
                  <CestaRecorrenteCard
                    key={cesta.id}
                    cesta={cesta}
                    onCancelar={handleCancelarCesta}
                  />
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="basket-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyTitle}>
                    Nenhuma cesta recorrente
                  </Text>
                  <Text style={styles.emptyText}>
                    Crie uma cesta recorrente para receber seus produtos
                    favoritos automaticamente
                  </Text>
                  <TouchableOpacity
                    style={styles.criarPrimeiraButton}
                    onPress={() => setMostrarFormulario(true)}
                  >
                    <Text style={styles.criarPrimeiraText}>
                      Criar Primeira Cesta
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}

        {/* Espaçamento para a navegação */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
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
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#FFF7E4",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D5D31",
  },
  scrollView: {
    flex: 1,
  },
  cestasList: {
    paddingHorizontal: 20,
  },
  cestaCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cestaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cestaNome: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D5D31",
  },
  ativaBadge: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  ativaText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  feiranteText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#333",
  },
  botoesContainer: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
  },
  editarButton: {
    flex: 1,
    backgroundColor: "#4A7C59",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  editarButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  cancelarButton: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E74C3C",
  },
  cancelarButtonText: {
    color: "#E74C3C",
    fontSize: 14,
    fontWeight: "600",
  },
  // Estilos para nova cesta
  novaCestaContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  novaCestaTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2D5D31",
    marginBottom: 20,
    textAlign: "center",
  },
  resumoCarrinho: {
    backgroundColor: "#F8FDF9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E8F5E8",
  },
  resumoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D5D31",
    marginBottom: 4,
  },
  resumoInfo: {
    fontSize: 14,
    color: "#666",
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D5D31",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  opcoesList: {
    flexDirection: "row",
    gap: 8,
  },
  opcaoButton: {
    backgroundColor: "#F8F8F8",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  opcaoButtonAtiva: {
    backgroundColor: "#4A7C59",
    borderColor: "#4A7C59",
  },
  opcaoText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  opcaoTextAtiva: {
    color: "#FFF",
    fontWeight: "600",
  },
  diasScroll: {
    marginTop: 4,
  },
  diasList: {
    flexDirection: "row",
    gap: 8,
  },
  diaButton: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    minWidth: 50,
    alignItems: "center",
  },
  diaButtonAtivo: {
    backgroundColor: "#4A7C59",
    borderColor: "#4A7C59",
  },
  diaText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  diaTextAtivo: {
    color: "#FFF",
    fontWeight: "600",
  },
  botoesNovaCesta: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  cancelarNovaButton: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cancelarNovaText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  salvarButton: {
    flex: 1,
    backgroundColor: "#4A7C59",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  salvarButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Empty state
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  criarPrimeiraButton: {
    backgroundColor: "#4A7C59",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  criarPrimeiraText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 100,
  },
});
