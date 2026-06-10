import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as React from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useCesta } from "../../contexts/CestaContext";
import { useUser } from "../../contexts/UserContext";
import { cestasRecorrentesService } from "../../services/cestasRecorrentes";
import { styles } from "./styles";

const FREQUENCIAS = ["Semanal", "Quinzenal", "Mensal"] as const;
const DIAS_SEMANA = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

/**
 * Card "Tornar cesta recorrente".
 *
 * Quando o usuário toca, abre um modal que pede nome / frequência / dia,
 * e ao confirmar faz POST /cestas-recorrentes — persistindo a cesta no
 * banco vinculada ao usuário e feirante atual.
 */
const CardRecorrente: React.FC = () => {
  const { user } = useUser();
  const { state: cestaState, marcarCestaRecorrenteCriada } = useCesta();

  const [modalVisivel, setModalVisivel] = React.useState(false);
  const [nome, setNome] = React.useState("");
  const [frequencia, setFrequencia] = React.useState<string>("Semanal");
  const [diaEntrega, setDiaEntrega] = React.useState<string>("Segunda-feira");
  const [enviando, setEnviando] = React.useState(false);

  // "criada" vem do CestaContext: id != null => já foi tornada recorrente
  // nesta sessão do carrinho. Trava o clique e marca visualmente.
  const criada = cestaState.cestaRecorrenteId != null;

  // Itens elegíveis: tudo que não é "cesta pronta" — só produtos individuais
  // viram cesta recorrente (mercadoria_id precisa ser conhecido).
  const itensRecorrentes = React.useMemo(
    () => cestaState.itens.filter((it) => it.tipo !== "cesta"),
    [cestaState.itens],
  );

  // Total da cesta usado como preco da recorrente
  const total = React.useMemo(
    () =>
      itensRecorrentes.reduce((acc, it) => {
        const q = it.unidade === "g" ? it.quantidade / 1000 : it.quantidade;
        return acc + it.preco * q;
      }, 0),
    [itensRecorrentes],
  );

  // Assumimos: todos os itens são do MESMO feirante (regra atual do app).
  const feiranteId = React.useMemo(() => {
    const ids = new Set(itensRecorrentes.map((it) => it.feiranteId));
    if (ids.size !== 1) return null;
    const primeiro = itensRecorrentes[0]?.feiranteId;
    const n = Number(primeiro);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [itensRecorrentes]);

  // IDs das mercadorias (esperamos número convertível — vindo da API)
  const mercadoriaIds = React.useMemo(() => {
    return itensRecorrentes
      .map((it) => Number(it.produtoId))
      .filter((id) => Number.isFinite(id) && id > 0);
  }, [itensRecorrentes]);

  function abrir() {
    // Já criou? Mostra aviso e não permite reabrir o modal — bloqueio simples.
    if (criada) {
      Alert.alert(
        "Cesta já é recorrente",
        "Esta cesta já foi configurada como recorrente. Veja em Minhas Cestas para gerenciar.",
        [
          { text: "OK", style: "cancel" },
          { text: "Minhas cestas", onPress: () => router.push("/minhas-cestas") },
        ],
      );
      return;
    }
    // Validações de pré-condição
    if (!user?.id || !user?.token) {
      Alert.alert(
        "Faça login",
        "Você precisa estar logado para tornar uma cesta recorrente.",
        [{ text: "Cancelar", style: "cancel" }, { text: "Fazer login", onPress: () => router.push("/login") }],
      );
      return;
    }
    if (itensRecorrentes.length === 0) {
      Alert.alert(
        "Cesta vazia",
        "Adicione produtos individuais à sua cesta antes de tornar recorrente.",
      );
      return;
    }
    if (feiranteId == null) {
      Alert.alert(
        "Cesta de feirantes diferentes",
        "Cestas recorrentes precisam ter produtos de um único feirante. Ajuste sua cesta antes de continuar.",
      );
      return;
    }
    if (mercadoriaIds.length === 0) {
      Alert.alert(
        "Itens inválidos",
        "Não foi possível identificar os produtos da cesta. Atualize a cesta e tente novamente.",
      );
      return;
    }

    // Pré-preenche um nome legal
    if (!nome) {
      const nomeFeirante = itensRecorrentes[0]?.feiranteNome ?? "Feirante";
      setNome(`Minha cesta ${frequencia.toLowerCase()} - ${nomeFeirante}`);
    }
    setModalVisivel(true);
  }

  function fechar() {
    if (enviando) return;
    setModalVisivel(false);
  }

  async function criar() {
    if (!user?.id || !user?.token || feiranteId == null) return;
    if (!nome.trim() || nome.trim().length < 3) {
      Alert.alert("Nome muito curto", "Digite um nome com pelo menos 3 caracteres.");
      return;
    }
    if (total <= 0) {
      Alert.alert("Preço inválido", "O total da cesta precisa ser maior que zero.");
      return;
    }

    setEnviando(true);
    try {
      const criada = await cestasRecorrentesService.criar(user.token, {
        nome: nome.trim(),
        frequencia,
        dia_entrega: diaEntrega,
        preco: Number(total.toFixed(2)),
        usuario_id: user.id,
        feirante_id: feiranteId,
        mercadorias: mercadoriaIds,
        ativa: true,
      });

      // Marca no CestaContext — outras telas (ex: finalizapedido) vão ler
      // esse id e exibir o card já como "criada" e bloqueado.
      marcarCestaRecorrenteCriada(criada.id);

      Alert.alert(
        "Cesta recorrente criada!",
        `A cesta "${nome.trim()}" será entregue toda(o) ${diaEntrega} (${frequencia.toLowerCase()}).`,
        [
          {
            text: "Ver minhas cestas",
            onPress: () => {
              setModalVisivel(false);
              router.push("/minhas-cestas");
            },
          },
          { text: "Fechar", onPress: () => setModalVisivel(false), style: "cancel" },
        ],
      );
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Falha ao criar cesta recorrente");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={styles.section}>
      <Pressable style={styles.label6} onPress={abrir}>
        <View
          style={[styles.input9, criada && styles.input9Selected]}
        >
          {criada && <Text style={styles.checkIcon}>✓</Text>}
        </View>
        <View style={styles.div14}>
          <Text style={styles.tornarCestaRecorrente}>
            {criada ? "Cesta recorrente criada" : "Tornar cesta recorrente"}
          </Text>
          <Text style={styles.recebaEstesItens}>
            {criada
              ? "Você receberá esses itens automaticamente"
              : "Receba estes itens automaticamente"}
          </Text>
        </View>
        {!criada && (
          <Ionicons name="chevron-forward" size={18} color="#999" />
        )}
      </Pressable>

      {/* Modal de configuração */}
      <Modal
        visible={modalVisivel}
        transparent
        animationType="slide"
        onRequestClose={fechar}
      >
        <Pressable style={modalStyles.overlay} onPress={fechar}>
          <Pressable style={modalStyles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.titulo}>Cesta Recorrente</Text>
              <TouchableOpacity onPress={fechar} disabled={enviando}>
                <Ionicons name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Resumo */}
              <View style={modalStyles.resumo}>
                <Text style={modalStyles.resumoTitulo}>Resumo</Text>
                <Text style={modalStyles.resumoLinha}>
                  {itensRecorrentes.length}{" "}
                  {itensRecorrentes.length === 1 ? "item" : "itens"}
                </Text>
                <Text style={modalStyles.resumoLinhaForte}>
                  Total por entrega: R$ {total.toFixed(2)}
                </Text>
              </View>

              {/* Nome */}
              <Text style={modalStyles.label}>Nome da cesta</Text>
              <TextInput
                style={modalStyles.input}
                value={nome}
                onChangeText={setNome}
                placeholder="Ex: Minha cesta semanal"
                editable={!enviando}
              />

              {/* Frequência */}
              <Text style={modalStyles.label}>Frequência</Text>
              <View style={modalStyles.chipsRow}>
                {FREQUENCIAS.map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[modalStyles.chip, frequencia === f && modalStyles.chipAtivo]}
                    onPress={() => setFrequencia(f)}
                    disabled={enviando}
                  >
                    <Text
                      style={[
                        modalStyles.chipText,
                        frequencia === f && modalStyles.chipTextAtivo,
                      ]}
                    >
                      {f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Dia da entrega */}
              <Text style={modalStyles.label}>Dia da entrega</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={modalStyles.chipsRow}>
                  {DIAS_SEMANA.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[modalStyles.chip, diaEntrega === d && modalStyles.chipAtivo]}
                      onPress={() => setDiaEntrega(d)}
                      disabled={enviando}
                    >
                      <Text
                        style={[
                          modalStyles.chipText,
                          diaEntrega === d && modalStyles.chipTextAtivo,
                        ]}
                      >
                        {d.replace("-feira", "")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Botão criar */}
              <TouchableOpacity
                style={[modalStyles.botaoCriar, enviando && { opacity: 0.6 }]}
                onPress={criar}
                disabled={enviando}
              >
                {enviando ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={modalStyles.botaoCriarText}>Criar cesta recorrente</Text>
                )}
              </TouchableOpacity>

              <View style={{ height: 12 }} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    marginBottom: 16,
  },
  titulo: { fontSize: 18, fontFamily: "Poppins-SemiBold", color: "#255336" },

  resumo: {
    backgroundColor: "#F9FFF9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E8F5E8",
  },
  resumoTitulo: { fontSize: 13, color: "#666", marginBottom: 4 },
  resumoLinha: { fontSize: 13, color: "#333" },
  resumoLinhaForte: {
    marginTop: 4,
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#4A7C59",
  },

  label: {
    fontSize: 13,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#FFF",
  },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  chip: {
    borderWidth: 1,
    borderColor: "#255336",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FFF",
  },
  chipAtivo: { backgroundColor: "#255336" },
  chipText: { fontSize: 12, color: "#255336", fontWeight: "600" },
  chipTextAtivo: { color: "#FFF" },

  botaoCriar: {
    backgroundColor: "#4A7C59",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  botaoCriarText: { color: "#FFF", fontSize: 15, fontFamily: "Poppins-SemiBold" },
});

export default CardRecorrente;
