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
import { horariosService } from "../../services/horarios";
import type { HorarioFeirante } from "../../types/api";
import { styles } from "./styles";

const FREQUENCIAS = ["Semanal", "Quinzenal", "Mensal"] as const;

/**
 * Mapeamento dia da semana ↔ índice da API (Prisma).
 * API: 0=Domingo ... 6=Sábado.
 * Componente: começa em Segunda para melhor UX.
 */
const DIAS_SEMANA: { label: string; idx: number }[] = [
  { label: "Segunda-feira", idx: 1 },
  { label: "Terça-feira", idx: 2 },
  { label: "Quarta-feira", idx: 3 },
  { label: "Quinta-feira", idx: 4 },
  { label: "Sexta-feira", idx: 5 },
  { label: "Sábado", idx: 6 },
  { label: "Domingo", idx: 0 },
];

/**
 * Card "Tornar cesta recorrente".
 *
 * Quando o usuário toca, abre um modal que pede nome / frequência / dia,
 * e ao confirmar faz POST /cestas-recorrentes — persistindo a cesta no
 * banco vinculada ao usuário e feirante atual.
 *
 * Ao abrir o modal, busca os horários de ENTREGA do feirante e desabilita
 * os dias em que ele não faz entrega.
 */
const CardRecorrente: React.FC = () => {
  const { user } = useUser();
  const { state: cestaState, marcarCestaRecorrenteCriada } = useCesta();

  const [modalVisivel, setModalVisivel] = React.useState(false);
  const [nome, setNome] = React.useState("");
  const [frequencia, setFrequencia] = React.useState<string>("Semanal");
  const [diaEntrega, setDiaEntrega] = React.useState<string>("Segunda-feira");
  const [enviando, setEnviando] = React.useState(false);

  // Horários de entrega do feirante (carregados ao abrir o modal)
  const [horariosEntrega, setHorariosEntrega] = React.useState<HorarioFeirante[]>([]);
  const [carregandoHorarios, setCarregandoHorarios] = React.useState(false);

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

  // Set com os índices (0-6) dos dias em que o feirante faz entrega.
  const diasDisponiveis = React.useMemo(() => {
    const set = new Set<number>();
    horariosEntrega.forEach((h) => set.add(h.dia_semana));
    return set;
  }, [horariosEntrega]);

  // Janelas de horário agrupadas por dia_semana (string formatada)
  const janelasPorDia = React.useMemo(() => {
    const map = new Map<number, string[]>();
    horariosEntrega.forEach((h) => {
      const arr = map.get(h.dia_semana) ?? [];
      arr.push(`${h.hora_inicio} às ${h.hora_fim}`);
      map.set(h.dia_semana, arr);
    });
    return map;
  }, [horariosEntrega]);

  // Carrega horários de entrega quando o modal abre
  React.useEffect(() => {
    if (!modalVisivel || feiranteId == null) return;
    let ativo = true;
    setCarregandoHorarios(true);
    horariosService
      .listarPorFeirante(feiranteId, "ENTREGA")
      .then((lista) => {
        if (!ativo) return;
        setHorariosEntrega(lista);
      })
      .catch(() => {
        if (!ativo) return;
        setHorariosEntrega([]);
      })
      .finally(() => {
        if (ativo) setCarregandoHorarios(false);
      });
    return () => {
      ativo = false;
    };
  }, [modalVisivel, feiranteId]);

  // Se o dia selecionado deixar de estar disponível, troca automaticamente
  // para o primeiro dia disponível.
  React.useEffect(() => {
    if (carregandoHorarios || diasDisponiveis.size === 0) return;
    const diaAtual = DIAS_SEMANA.find((d) => d.label === diaEntrega);
    if (!diaAtual || !diasDisponiveis.has(diaAtual.idx)) {
      const primeiroDisponivel = DIAS_SEMANA.find((d) =>
        diasDisponiveis.has(d.idx),
      );
      if (primeiroDisponivel) setDiaEntrega(primeiroDisponivel.label);
    }
  }, [diasDisponiveis, carregandoHorarios, diaEntrega]);

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
    // Validação extra: dia precisa estar entre os dias de entrega configurados
    // (ignorada quando o feirante não definiu nenhum horário — backend aceita
    // qualquer dia nesse caso, comportamento atual do app).
    if (diasDisponiveis.size > 0) {
      const diaAtual = DIAS_SEMANA.find((d) => d.label === diaEntrega);
      if (!diaAtual || !diasDisponiveis.has(diaAtual.idx)) {
        Alert.alert(
          "Dia indisponível",
          "Este feirante não faz entrega no dia selecionado. Escolha outro dia.",
        );
        return;
      }
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
        `A cesta "${nome.trim()}" será entregue toda(o) ${diaEntrega} (${frequencia.toLowerCase()}).\n\nIMPORTANTE: a sua cesta atual continua em aberto — finalize o pedido normalmente abaixo. A recorrente é separada e começa no próximo ciclo.`,
        [
          {
            text: "Continuar finalizando",
            onPress: () => setModalVisivel(false),
            style: "default",
          },
          {
            text: "Ver minhas cestas",
            onPress: () => {
              setModalVisivel(false);
              router.push("/minhas-cestas");
            },
            style: "cancel",
          },
        ],
      );
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Falha ao criar cesta recorrente");
    } finally {
      setEnviando(false);
    }
  }

  // Janela de horário do dia atualmente selecionado (mostrada abaixo dos chips)
  const janelaDiaSelecionado = React.useMemo(() => {
    const diaAtual = DIAS_SEMANA.find((d) => d.label === diaEntrega);
    if (!diaAtual) return null;
    const janelas = janelasPorDia.get(diaAtual.idx);
    if (!janelas || janelas.length === 0) return null;
    return janelas.join(" e ");
  }, [diaEntrega, janelasPorDia]);

  const semHorariosCadastrados =
    !carregandoHorarios && horariosEntrega.length === 0;

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

              {carregandoHorarios && (
                <View style={modalStyles.carregandoBox}>
                  <ActivityIndicator color="#4A7C59" size="small" />
                  <Text style={modalStyles.carregandoTexto}>
                    Verificando dias de entrega do feirante...
                  </Text>
                </View>
              )}

              {semHorariosCadastrados && (
                <View style={modalStyles.alertaBox}>
                  <Ionicons name="information-circle" size={18} color="#A66A00" />
                  <Text style={modalStyles.alertaTexto}>
                    Este feirante ainda não cadastrou os dias de entrega.
                    Você pode escolher qualquer dia, mas confirme com ele antes.
                  </Text>
                </View>
              )}

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={modalStyles.chipsRow}>
                  {DIAS_SEMANA.map((d) => {
                    const indisponivel =
                      diasDisponiveis.size > 0 && !diasDisponiveis.has(d.idx);
                    const ativo = diaEntrega === d.label;
                    return (
                      <TouchableOpacity
                        key={d.label}
                        style={[
                          modalStyles.chip,
                          ativo && modalStyles.chipAtivo,
                          indisponivel && modalStyles.chipIndisponivel,
                        ]}
                        onPress={() => !indisponivel && setDiaEntrega(d.label)}
                        disabled={enviando || indisponivel}
                      >
                        <Text
                          style={[
                            modalStyles.chipText,
                            ativo && modalStyles.chipTextAtivo,
                            indisponivel && modalStyles.chipTextIndisponivel,
                          ]}
                        >
                          {d.label.replace("-feira", "")}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Janela de horário do dia selecionado */}
              {janelaDiaSelecionado && (
                <View style={modalStyles.janelaBox}>
                  <Ionicons name="time-outline" size={16} color="#4A7C59" />
                  <Text style={modalStyles.janelaTexto}>
                    Entrega: {janelaDiaSelecionado}
                  </Text>
                </View>
              )}

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
  chipIndisponivel: {
    borderColor: "#DDD",
    backgroundColor: "#F5F5F5",
  },
  chipText: { fontSize: 12, color: "#255336", fontWeight: "600" },
  chipTextAtivo: { color: "#FFF" },
  chipTextIndisponivel: { color: "#AAA", textDecorationLine: "line-through" },

  carregandoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    marginBottom: 8,
  },
  carregandoTexto: { fontSize: 12, color: "#666" },

  alertaBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FFF8E6",
    borderWidth: 1,
    borderColor: "#F2D88D",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  alertaTexto: { flex: 1, fontSize: 12, color: "#7A4F00", lineHeight: 16 },

  janelaBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0F8F4",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 14,
  },
  janelaTexto: {
    fontSize: 12,
    color: "#255336",
    fontFamily: "Poppins-SemiBold",
  },

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
