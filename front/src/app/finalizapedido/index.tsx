import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ItemCesta, useCesta } from "../../contexts/CestaContext";
import { useUser } from "../../contexts/UserContext";
import CardRecorrente from "../../components/CardRecorrente";
import { horariosService } from "../../services/horarios";
import type { HorarioFeirante } from "../../types/api";

const API_BASE =
  (process.env.EXPO_PUBLIC_API_URL as string) || "http://localhost:3001";

const FinalizaPedido = () => {
  const { state: cestaState, limparCesta } = useCesta();
  // `enderecoAtual` reflete o endereço selecionado no header (Modelo iFood).
  // Quando o cliente troca pelo dropdown, esta tela atualiza junto.
  const { user, enderecoAtual } = useUser();
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  // Modal de confirmação de pagamento — aparece depois da validação inicial,
  // antes do POST de fato. Cliente confere QR PIX / últimos 4 do cartão /
  // troco e só então confirma.
  const [modalConfirmacaoVisivel, setModalConfirmacaoVisivel] = useState(false);
  const [tipoEntrega, setTipoEntrega] = useState<"endereco" | "feira">(
    "endereco"
  );
  const [horarioSelecionado, setHorarioSelecionado] = useState("");
  const [showHorarios, setShowHorarios] = useState(false);
  // Horários de ENTREGA cadastrados pelo feirante (carregados da API).
  // Quando vazio, mostramos aviso e bloqueamos a finalização.
  const [horariosEntrega, setHorariosEntrega] = useState<HorarioFeirante[]>([]);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);
  const [observacoes, setObservacoes] = useState("");
  const [tipoPagamento, setTipoPagamento] = useState<
    "pix" | "dinheiro"
  >("pix");
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

  // Identifica o feirante da cesta — mesma regra de CardRecorrente.
  // Todos os itens precisam ser do MESMO feirante (regra atual do app).
  const feiranteIdCesta = React.useMemo(() => {
    const ids = new Set(cestaState.itens.map((it) => it.feiranteId));
    if (ids.size !== 1) return null;
    const n = Number(cestaState.itens[0]?.feiranteId);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [cestaState.itens]);

  // Chave PIX real do feirante (cadastrada no perfil admin). Sem mais mock:
  // se o feirante não cadastrou, o modal avisa em vez de exibir uma chave falsa.
  const [chavePixFeirante, setChavePixFeirante] = useState<string | null>(null);
  // Enquanto carrega, mantemos o PIX visível para evitar "piscar" a opção.
  const [carregandoChavePix, setCarregandoChavePix] = useState(true);

  React.useEffect(() => {
    if (feiranteIdCesta == null) {
      setChavePixFeirante(null);
      setCarregandoChavePix(false);
      return;
    }
    let ativo = true;
    setCarregandoChavePix(true);
    fetch(`${API_BASE.replace(/\/$/, "")}/feirantes/${feiranteIdCesta}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((f) => {
        if (!ativo) return;
        const chave =
          f && typeof f.chave_pix === "string" && f.chave_pix.trim()
            ? f.chave_pix.trim()
            : null;
        setChavePixFeirante(chave);
      })
      .catch(() => {
        if (ativo) setChavePixFeirante(null);
      })
      .finally(() => {
        if (ativo) setCarregandoChavePix(false);
      });
    return () => {
      ativo = false;
    };
  }, [feiranteIdCesta]);

  // PIX só é ofertado quando o feirante tem chave cadastrada.
  const pixDisponivel = carregandoChavePix || chavePixFeirante != null;

  // Se o cliente estava em PIX e a opção deixou de existir, cai para Dinheiro.
  React.useEffect(() => {
    if (!pixDisponivel && tipoPagamento === "pix") {
      setTipoPagamento("dinheiro");
    }
  }, [pixDisponivel, tipoPagamento]);

  // Carrega horários de ENTREGA do feirante (público, não precisa token).
  React.useEffect(() => {
    if (feiranteIdCesta == null || tipoEntrega !== "endereco") {
      setHorariosEntrega([]);
      return;
    }
    let ativo = true;
    setCarregandoHorarios(true);
    horariosService
      .listarPorFeirante(feiranteIdCesta, "ENTREGA")
      .then((lista) => {
        if (ativo) setHorariosEntrega(lista);
      })
      .catch(() => {
        if (ativo) setHorariosEntrega([]);
      })
      .finally(() => {
        if (ativo) setCarregandoHorarios(false);
      });
    return () => {
      ativo = false;
    };
  }, [feiranteIdCesta, tipoEntrega]);

  /**
   * Gera as opções visíveis de horário a partir das janelas configuradas
   * pelo feirante. Para os próximos 7 dias:
   *  1. Filtra dias da semana em que o feirante entrega
   *  2. Para cada janela, gera slots de 2h dentro dela
   *  3. Descarta slots no passado (importante pra "hoje")
   *
   * Retorna no formato pronto pra UI: ["Hoje - Entre 14h e 16h", ...].
   */
  const opcoesHorario = React.useMemo<string[]>(() => {
    if (horariosEntrega.length === 0) return [];
    const agora = new Date();
    const hojeSemana = agora.getDay();
    const opcoes: string[] = [];
    const SLOT_HORAS = 2;
    const NOMES_DIA = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ];

    for (let offset = 0; offset < 7 && opcoes.length < 8; offset++) {
      const diaSemana = (hojeSemana + offset) % 7;
      const janelas = horariosEntrega.filter((h) => h.dia_semana === diaSemana);
      if (janelas.length === 0) continue;

      const rotulo =
        offset === 0 ? "Hoje" : offset === 1 ? "Amanhã" : NOMES_DIA[diaSemana];

      for (const j of janelas) {
        const [hi, mi] = j.hora_inicio.split(":").map(Number);
        const [hf, mf] = j.hora_fim.split(":").map(Number);
        const inicioMin = hi * 60 + mi;
        const fimMin = hf * 60 + mf;

        // Gera slots de 2h dentro da janela. Se a janela for menor que 2h,
        // usa a janela inteira como um único slot.
        let cursor = inicioMin;
        while (cursor < fimMin && opcoes.length < 8) {
          const fimSlot = Math.min(cursor + SLOT_HORAS * 60, fimMin);

          // Pula slot que já passou (vale apenas para "Hoje").
          if (offset === 0) {
            const agoraMin = agora.getHours() * 60 + agora.getMinutes();
            // Mantém uma folga de 30min entre o agora e o início do slot.
            if (cursor < agoraMin + 30) {
              cursor = fimSlot;
              continue;
            }
          }

          const fmtHora = (m: number) => {
            const h = Math.floor(m / 60);
            const mm = m % 60;
            return mm === 0 ? `${h}h` : `${h}h${String(mm).padStart(2, "0")}`;
          };
          opcoes.push(
            `${rotulo} - Entre ${fmtHora(cursor)} e ${fmtHora(fimSlot)}`,
          );
          cursor = fimSlot;
        }
      }
    }
    return opcoes;
  }, [horariosEntrega]);

  // Auto-seleciona o primeiro horário disponível quando as opções carregarem
  // (ou quando o cliente troca de feirante e o horário antigo deixa de valer).
  React.useEffect(() => {
    if (opcoesHorario.length === 0) {
      if (horarioSelecionado) setHorarioSelecionado("");
      return;
    }
    if (!opcoesHorario.includes(horarioSelecionado)) {
      setHorarioSelecionado(opcoesHorario[0]);
    }
  }, [opcoesHorario, horarioSelecionado]);

  // Flags úteis pro UI: feirante sem horários configurados; ou tem horários
  // mas nenhum slot futuro nos próximos 7 dias (raro mas possível).
  const semHorariosCadastrados =
    !carregandoHorarios && horariosEntrega.length === 0;
  const semSlotsDisponiveis =
    !carregandoHorarios &&
    horariosEntrega.length > 0 &&
    opcoesHorario.length === 0;

  /**
   * Converte os itens do carrinho para o formato que a API espera.
   *
   * Cada item vira:
   *   - `{ cesta_id, quantidade }`     se for uma cesta pronta (`tipo: 'cesta'`)
   *   - `{ mercadoria_id, quantidade }` se for produto avulso
   *
   * O backend cuida de expandir as cestas em N PedidoItem (1 por mercadoria).
   * Antes desse fix o `produtoId` da cesta era enviado como `mercadoria_id`,
   * o que fazia o feirante receber só 1 produto (o ID acidentalmente coincidia
   * com alguma mercadoria), perdendo todos os outros itens da cesta.
   */
  type ItemApi =
    | { mercadoria_id: number; quantidade: number; unidade?: string }
    | { cesta_id: number; quantidade: number };

  function montarItemsParaApi(): ItemApi[] {
    return cestaState.itens
      .map((item): ItemApi | null => {
        const idNumerico = Number(item.cestaId ?? item.produtoId);
        if (Number.isNaN(idNumerico) || idNumerico <= 0) return null;

        // Cesta pronta: o backend expande nas mercadorias internas.
        if (item.tipo === "cesta") {
          const qtdCesta = Math.max(1, Math.floor(item.quantidade));
          return { cesta_id: idNumerico, quantidade: qtdCesta };
        }

        // Produto avulso: gramas → kg pra bater com a unidade da mercadoria.
        let quantidadeApi = item.quantidade;
        if (item.unidade === "g") {
          quantidadeApi = item.quantidade / 1000;
        }
        if (quantidadeApi <= 0) return null;

        // Unidade real cadastrada (UN/KG/CX). Cai em "KG" pra itens por peso
        // e "UN" pros demais quando o carrinho não trouxer `unidadeApi`.
        const unidadeApi =
          item.unidadeApi ?? (item.unidade === "g" ? "KG" : "UN");

        return {
          mercadoria_id: idNumerico,
          quantidade: quantidadeApi,
          unidade: unidadeApi,
        };
      })
      .filter((it): it is ItemApi => it !== null);
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

  /**
   * Valida os dados do formulário antes de abrir o modal de confirmação.
   * Retorna `true` se tudo OK; `false` se exibiu Alert e bloqueou o fluxo.
   */
  const validarParaConfirmar = (): boolean => {
    if (enviandoPedido) return false;

    if (cestaState.itens.length === 0) {
      Alert.alert(
        "Atenção",
        "Sua cesta está vazia. Adicione produtos antes de finalizar o pedido."
      );
      return false;
    }

    if (!aceitouTermos) {
      Alert.alert(
        "Atenção",
        "Você precisa aceitar os termos e condições para continuar."
      );
      return false;
    }

    if (tipoEntrega === "endereco") {
      if (!enderecoAtual || !enderecoAtual.endereco || !enderecoAtual.bairro) {
        Alert.alert(
          "Selecione um endereço",
          "Você precisa ter um endereço cadastrado para receber a entrega. Cadastre em 'Meus endereços'.",
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Cadastrar agora",
              onPress: () =>
                router.push({
                  pathname: "/perfil/enderecos/[id]",
                  params: { id: "novo" },
                }),
            },
          ],
        );
        return false;
      }

      // Sem horários configurados pelo feirante → não dá pra prometer entrega.
      if (semHorariosCadastrados) {
        Alert.alert(
          "Sem horário disponível",
          "Este feirante ainda não cadastrou horários de entrega. " +
            "Escolha 'Retirar na feira' ou aguarde a configuração.",
        );
        return false;
      }
      if (semSlotsDisponiveis) {
        Alert.alert(
          "Sem horário disponível",
          "Não há horário de entrega nos próximos dias. Tente mais tarde " +
            "ou escolha 'Retirar na feira'.",
        );
        return false;
      }
      if (!horarioSelecionado) {
        Alert.alert("Atenção", "Escolha um horário de entrega.");
        return false;
      }
      if (!opcoesHorario.includes(horarioSelecionado)) {
        Alert.alert(
          "Atenção",
          "O horário selecionado não está mais disponível. Escolha outro.",
        );
        return false;
      }
    }

    if (tipoPagamento === "dinheiro") {
      if (!trocoDinheiro) {
        Alert.alert("Atenção", "Informe o valor para o troco.");
        return false;
      }
      const valorTroco = parseFloat(trocoDinheiro.replace(",", "."));
      if (isNaN(valorTroco) || valorTroco < totalPedido) {
        Alert.alert(
          "Atenção",
          "O valor para troco deve ser maior que o total do pedido."
        );
        return false;
      }
    }

    if (!user || !user.id) {
      Alert.alert(
        "Você precisa estar logado",
        "Faça login para finalizar o pedido."
      );
      router.push("/login");
      return false;
    }
    if (!user.token) {
      Alert.alert(
        "Sessão expirada",
        "Faça login novamente para finalizar o pedido."
      );
      router.push("/login");
      return false;
    }

    return true;
  };

  /**
   * Abre o modal de confirmação de pagamento. Validações ocorrem antes —
   * se algo falha, mostra Alert e o modal nem chega a abrir.
   */
  const abrirConfirmacaoPagamento = () => {
    if (!validarParaConfirmar()) return;
    setModalConfirmacaoVisivel(true);
  };

  /**
   * Dispara o POST do pedido (chamado pelo botão 'Confirmar pagamento' do
   * modal). Mantém as validações por segurança — usuário não consegue chegar
   * aqui sem passar por `validarParaConfirmar`, mas defesa em profundidade.
   */
  const enviarPedido = async () => {
    if (enviandoPedido) return;
    if (!validarParaConfirmar()) return;
    if (!user?.id || !user?.token) return;

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

      // Monta endereço resumido pra exibir na tela de confirmação.
      // No caso de retirada na feira, vai vazio e a tela mostra o local fixo.
      let enderecoResumo = "";
      if (tipoEntrega === "endereco" && enderecoAtual) {
        enderecoResumo = [
          `${enderecoAtual.endereco}${enderecoAtual.numero ? `, ${enderecoAtual.numero}` : ""}`,
          enderecoAtual.bairro,
          enderecoAtual.cidade && enderecoAtual.uf
            ? `${enderecoAtual.cidade}/${enderecoAtual.uf}`
            : enderecoAtual.cidade ?? "",
        ]
          .filter(Boolean)
          .join(" - ");
      }

      // Mapeia o tipo de pagamento pra um label legível
      const labelPagamento = tipoPagamento === "pix" ? "PIX" : "Dinheiro";

      // Limpa a cesta após o pedido ser persistido com sucesso
      limparCesta();
      // Fecha o modal de confirmação antes da navegação (evita flash visual
      // do modal por cima da nova tela em devices lentos).
      setModalConfirmacaoVisivel(false);
      router.push({
        pathname: "/pedido-confirmado",
        params: {
          id: String(data?.id ?? ""),
          total: String(totalPedido.toFixed(2)),
          endereco: enderecoResumo,
          tipoEntrega,
          horario: horarioSelecionado,
          pagamento: labelPagamento,
        },
      });
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
        {/* Banner: cesta recorrente foi criada, mas a cesta atual continua
            aberta — reforça pro cliente que ele ainda precisa finalizar. */}
        {cestaState.cestaRecorrenteId != null && (
          <View style={bannerRecorrenteStyles.banner}>
            <Ionicons name="checkmark-circle" size={20} color="#255336" />
            <View style={{ flex: 1 }}>
              <Text style={bannerRecorrenteStyles.titulo}>
                Cesta recorrente configurada
              </Text>
              <Text style={bannerRecorrenteStyles.texto}>
                Sua cesta atual continua em aberto. Finalize o pedido abaixo —
                a recorrente é separada e começa no próximo ciclo.
              </Text>
            </View>
          </View>
        )}

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
                        pathname: "/perfil/enderecos",
                        params: { selecionado: String(enderecoAtual.id) },
                      })
                    : router.push({
                        pathname: "/perfil/enderecos/[id]",
                        params: { id: "novo" },
                      })
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

              {/* Estado 1: carregando os horários do feirante */}
              {carregandoHorarios && (
                <View style={horarioStyles.statusBox}>
                  <ActivityIndicator color="#4A7C59" size="small" />
                  <Text style={horarioStyles.statusTexto}>
                    Verificando horários do feirante…
                  </Text>
                </View>
              )}

              {/* Estado 2: feirante sem horários cadastrados */}
              {!carregandoHorarios && semHorariosCadastrados && (
                <View style={horarioStyles.avisoBox}>
                  <Ionicons name="alert-circle" size={18} color="#A66A00" />
                  <Text style={horarioStyles.avisoTexto}>
                    Este feirante ainda não cadastrou horários de entrega.
                    Escolha "Retirar na feira" para concluir o pedido.
                  </Text>
                </View>
              )}

              {/* Estado 3: tem horários mas nenhum disponível nos próximos 7 dias */}
              {!carregandoHorarios && semSlotsDisponiveis && (
                <View style={horarioStyles.avisoBox}>
                  <Ionicons name="time-outline" size={18} color="#A66A00" />
                  <Text style={horarioStyles.avisoTexto}>
                    Sem janelas de entrega disponíveis no momento. Tente mais
                    tarde ou escolha "Retirar na feira".
                  </Text>
                </View>
              )}

              {/* Estado 4: dropdown normal com opções vindas do feirante */}
              {!carregandoHorarios && opcoesHorario.length > 0 && (
                <>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => setShowHorarios(!showHorarios)}
                  >
                    <Text style={styles.selectButtonText}>
                      {horarioSelecionado || "Selecione um horário"}
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
                </>
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

          {pixDisponivel && (
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
          )}

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
          onPress={abrirConfirmacaoPagamento}
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

      {/* ─── Modal de Confirmação de Pagamento ─── */}
      <ModalConfirmacaoPagamento
        visivel={modalConfirmacaoVisivel}
        enviando={enviandoPedido}
        tipoPagamento={tipoPagamento}
        subtotal={subtotal}
        frete={frete}
        total={totalPedido}
        tipoEntrega={tipoEntrega}
        horario={horarioSelecionado}
        trocoDinheiro={trocoDinheiro}
        itens={cestaState.itens}
        chavePix={chavePixFeirante}
        onConfirmar={enviarPedido}
        onFechar={() => {
          if (!enviandoPedido) setModalConfirmacaoVisivel(false);
        }}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Modal de Confirmação de Pagamento
//
// Exibido depois das validações iniciais e antes do POST do pedido. Mostra
// resumo dos itens, total, e detalhes da forma de pagamento:
//   - PIX     → bloco "QR" mockado + chave (copiar) + valor a pagar
//   - Dinheiro → valor total + troco calculado
// ─────────────────────────────────────────────────────────────────────────────

type ModalConfirmacaoPagamentoProps = {
  visivel: boolean;
  enviando: boolean;
  tipoPagamento: "pix" | "dinheiro";
  subtotal: number;
  frete: number;
  total: number;
  tipoEntrega: "endereco" | "feira";
  horario: string;
  trocoDinheiro: string;
  itens: ItemCesta[];
  /** Chave PIX real do feirante (null quando não cadastrada). */
  chavePix: string | null;
  onConfirmar: () => void;
  onFechar: () => void;
};

function ModalConfirmacaoPagamento(props: ModalConfirmacaoPagamentoProps) {
  const {
    visivel,
    enviando,
    tipoPagamento,
    subtotal,
    frete,
    total,
    tipoEntrega,
    horario,
    trocoDinheiro,
    itens,
    chavePix,
    onConfirmar,
    onFechar,
  } = props;

  const fmtMoeda = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  // Chave PIX real do feirante (vinda do banco via GET /feirantes/:id).
  // Quando null, o feirante ainda não cadastrou chave — a UI mostra aviso.
  const temChavePix = typeof chavePix === "string" && chavePix.length > 0;

  async function copiarChavePix() {
    if (!temChavePix) return;
    try {
      await Share.share({
        message: chavePix as string,
        title: "Chave PIX para copiar",
      });
    } catch {
      /* ignora */
    }
  }

  const trocoNum = parseFloat(trocoDinheiro.replace(",", ".")) || 0;
  const troco = Math.max(0, trocoNum - total);

  // Renderização condicional do detalhe de pagamento
  function renderDetalhePagamento() {
    if (tipoPagamento === "pix") {
      return (
        <View style={mp.pgBox}>
          <View style={mp.pgHeader}>
            <Ionicons name="qr-code" size={20} color="#255336" />
            <Text style={mp.pgTitulo}>Pagamento via PIX</Text>
          </View>

          {temChavePix ? (
            <>
              <View style={mp.chaveBox}>
                <Text style={mp.chaveLabel}>Chave PIX do feirante</Text>
                <Text style={mp.chaveValor} numberOfLines={2}>
                  {chavePix}
                </Text>
              </View>
              <TouchableOpacity style={mp.copiarBtn} onPress={copiarChavePix}>
                <Ionicons name="copy-outline" size={16} color="#255336" />
                <Text style={mp.copiarBtnTexto}>Copiar chave PIX</Text>
              </TouchableOpacity>
              <Text style={mp.pgAviso}>
                Copie a chave acima e pague no app do seu banco. O pedido será
                preparado assim que o feirante confirmar o pagamento.
              </Text>
            </>
          ) : (
            <View style={mp.semChaveBox}>
              <Ionicons
                name="alert-circle-outline"
                size={22}
                color="#B8860B"
              />
              <Text style={mp.semChaveTexto}>
                Este feirante ainda não cadastrou uma chave PIX. Escolha outra
                forma de pagamento ou combine o pagamento na entrega.
              </Text>
            </View>
          )}
        </View>
      );
    }

    // dinheiro
    return (
      <View style={mp.pgBox}>
        <View style={mp.pgHeader}>
          <Ionicons name="cash" size={20} color="#255336" />
          <Text style={mp.pgTitulo}>Pagamento em Dinheiro</Text>
        </View>
        <View style={mp.cartaoLinha}>
          <Text style={mp.cartaoLabel}>Total a pagar</Text>
          <Text style={mp.cartaoValor}>{fmtMoeda(total)}</Text>
        </View>
        <View style={mp.cartaoLinha}>
          <Text style={mp.cartaoLabel}>Você vai pagar com</Text>
          <Text style={mp.cartaoValor}>{fmtMoeda(trocoNum)}</Text>
        </View>
        <View style={[mp.cartaoLinha, { marginTop: 4 }]}>
          <Text style={[mp.cartaoLabel, { color: "#4A7C59" }]}>Troco</Text>
          <Text style={[mp.cartaoValor, { color: "#4A7C59" }]}>
            {fmtMoeda(troco)}
          </Text>
        </View>
        <Text style={mp.pgAviso}>
          Tenha o valor em mãos no momento da entrega.
        </Text>
      </View>
    );
  }

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="slide"
      onRequestClose={onFechar}
    >
      <Pressable style={mp.overlay} onPress={onFechar}>
        <Pressable style={mp.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Cabeçalho */}
          <View style={mp.header}>
            <View>
              <Text style={mp.headerTitulo}>Confirmar pagamento</Text>
              <Text style={mp.headerSub}>
                Revise os detalhes antes de finalizar
              </Text>
            </View>
            <TouchableOpacity onPress={onFechar} disabled={enviando}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Resumo dos itens */}
            <View style={mp.resumoBox}>
              <Text style={mp.resumoTitulo}>
                Seu pedido ({itens.length}{" "}
                {itens.length === 1 ? "item" : "itens"})
              </Text>
              {itens.slice(0, 5).map((it, idx) => {
                const qtd =
                  it.unidade === "g"
                    ? `${it.quantidade}g`
                    : `${it.quantidade} ${it.quantidade > 1 ? "unids" : "unid"}`;
                const subt =
                  it.unidade === "g"
                    ? it.preco * (it.quantidade / 1000)
                    : it.preco * it.quantidade;
                return (
                  <View key={idx} style={mp.itemLinha}>
                    <Text style={mp.itemNome} numberOfLines={1}>
                      {it.nome}
                    </Text>
                    <Text style={mp.itemQtd}>{qtd}</Text>
                    <Text style={mp.itemValor}>{fmtMoeda(subt)}</Text>
                  </View>
                );
              })}
              {itens.length > 5 && (
                <Text style={mp.itemMais}>+{itens.length - 5} outros itens</Text>
              )}
            </View>

            {/* Totais */}
            <View style={mp.totaisBox}>
              <View style={mp.totalLinha}>
                <Text style={mp.totalLabel}>Subtotal</Text>
                <Text style={mp.totalValor}>{fmtMoeda(subtotal)}</Text>
              </View>
              {tipoEntrega === "endereco" && (
                <View style={mp.totalLinha}>
                  <Text style={mp.totalLabel}>Taxa de entrega</Text>
                  <Text style={mp.totalValor}>{fmtMoeda(frete)}</Text>
                </View>
              )}
              <View style={mp.totalSep} />
              <View style={mp.totalLinha}>
                <Text style={mp.totalLabelForte}>Total</Text>
                <Text style={mp.totalValorForte}>{fmtMoeda(total)}</Text>
              </View>
            </View>

            {/* Modo de recebimento + horário */}
            <View style={mp.entregaBox}>
              <Ionicons
                name={tipoEntrega === "feira" ? "storefront" : "location"}
                size={16}
                color="#255336"
              />
              <Text style={mp.entregaTexto}>
                {tipoEntrega === "feira"
                  ? "Retirada na feira"
                  : "Entrega no endereço selecionado"}
                {horario ? ` • ${horario}` : ""}
              </Text>
            </View>

            {/* Detalhe de pagamento (PIX/Cartão/Dinheiro) */}
            {renderDetalhePagamento()}
          </ScrollView>

          {/* Botões */}
          <View style={mp.botoes}>
            <TouchableOpacity
              style={[mp.botaoSecundario, enviando && { opacity: 0.5 }]}
              onPress={onFechar}
              disabled={enviando}
            >
              <Text style={mp.botaoSecundarioTexto}>Voltar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[mp.botaoPrimario, enviando && { opacity: 0.7 }]}
              onPress={onConfirmar}
              disabled={enviando}
            >
              {enviando ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                  <Text style={mp.botaoPrimarioTexto}>Confirmar pagamento</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Estilos do modal — `mp` (= modal pagamento). Separados pra ficar claro
// quais classes pertencem ao bottom sheet e não vazam pro resto da tela.
const mp = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
    maxHeight: "92%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    marginBottom: 14,
  },
  headerTitulo: { fontSize: 18, fontWeight: "700", color: "#255336" },
  headerSub: { fontSize: 12, color: "#7A8A7C", marginTop: 2 },

  resumoBox: {
    backgroundColor: "#F8FBF8",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EAEFEA",
  },
  resumoTitulo: {
    fontSize: 13,
    fontWeight: "700",
    color: "#255336",
    marginBottom: 8,
  },
  itemLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  itemNome: { flex: 1, fontSize: 12, color: "#333" },
  itemQtd: { fontSize: 11, color: "#7A8A7C", minWidth: 50, textAlign: "right" },
  itemValor: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4A7C59",
    minWidth: 64,
    textAlign: "right",
  },
  itemMais: {
    fontSize: 11,
    color: "#7A8A7C",
    marginTop: 4,
    fontStyle: "italic",
  },

  totaisBox: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EAEFEA",
  },
  totalLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalLabel: { fontSize: 13, color: "#7A8A7C" },
  totalValor: { fontSize: 13, color: "#333", fontWeight: "600" },
  totalSep: { height: 1, backgroundColor: "#EEE", marginVertical: 6 },
  totalLabelForte: { fontSize: 15, fontWeight: "700", color: "#255336" },
  totalValorForte: { fontSize: 18, fontWeight: "700", color: "#4A7C59" },

  entregaBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E8F5E8",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  entregaTexto: { flex: 1, fontSize: 12, color: "#255336", fontWeight: "600" },

  pgBox: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EAEFEA",
    marginBottom: 8,
  },
  pgHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  pgTitulo: { fontSize: 14, fontWeight: "700", color: "#255336" },

  // Chave PIX real do feirante
  chaveBox: {
    backgroundColor: "#F3F7F3",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DCE7DC",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chaveLabel: {
    fontSize: 11,
    color: "#7A8A7C",
    fontWeight: "600",
    marginBottom: 4,
  },
  chaveValor: {
    fontSize: 14,
    color: "#255336",
    fontWeight: "700",
  },

  // Aviso quando o feirante não tem chave PIX cadastrada
  semChaveBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FCF6E6",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EFE0B8",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  semChaveTexto: {
    flex: 1,
    fontSize: 12,
    color: "#8A6D1B",
    lineHeight: 17,
  },

  pgAviso: {
    fontSize: 11,
    color: "#7A8A7C",
    lineHeight: 15,
    marginTop: 10,
    textAlign: "center",
  },

  copiarBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#4A7C59",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#FFF",
    alignSelf: "center",
    marginTop: 12,
  },
  copiarBtnTexto: { color: "#255336", fontSize: 12, fontWeight: "700" },

  cartaoLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  cartaoLabel: { fontSize: 12, color: "#7A8A7C" },
  cartaoValor: { fontSize: 13, color: "#333", fontWeight: "600" },

  botoes: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EAEFEA",
  },
  botaoSecundario: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CFD8CF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  botaoSecundarioTexto: { color: "#7A8A7C", fontWeight: "700", fontSize: 14 },
  botaoPrimario: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#4A7C59",
    borderRadius: 12,
    paddingVertical: 14,
  },
  botaoPrimarioTexto: { color: "#FFF", fontWeight: "700", fontSize: 14 },
});

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

// Estilos do banner "Cesta recorrente configurada" — aparece no topo da
// tela depois que o cliente cria uma recorrente, deixando claro que a
// cesta atual segue em aberto e ele ainda precisa finalizar.
const bannerRecorrenteStyles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#E8F5E8",
    borderColor: "#4A7C59",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
  },
  titulo: {
    fontSize: 13,
    fontWeight: "700",
    color: "#255336",
    marginBottom: 2,
  },
  texto: {
    fontSize: 12,
    color: "#3C5C46",
    lineHeight: 16,
  },
});

// Estilos dos estados do seletor de horário (carregando / sem horários /
// sem slots / lista). O dropdown em si usa os estilos já existentes.
const horarioStyles = StyleSheet.create({
  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statusTexto: { fontSize: 12, color: "#666" },
  avisoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FFF8E6",
    borderWidth: 1,
    borderColor: "#F2D88D",
    borderRadius: 10,
    padding: 10,
  },
  avisoTexto: {
    flex: 1,
    fontSize: 12,
    color: "#7A4F00",
    lineHeight: 16,
  },
});

export default FinalizaPedido;
