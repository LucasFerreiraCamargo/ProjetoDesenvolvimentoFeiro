import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useUser } from "../../contexts/UserContext";
import {
  cestasRecorrentesService,
  CestaRecorrenteApi,
} from "../../services/cestasRecorrentes";

// Mesmos placeholders usados em cesta/[id].tsx
const IMAGEM_PADRAO_CESTA = require("../../../assets/images/cesta-padrao.png");
const IMAGEM_PADRAO_PRODUTO = require("../../../assets/images/produto-padrao.png");

export default function MinhasCestasScreen() {
  const { user } = useUser();
  const [cestas, setCestas] = useState<CestaRecorrenteApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    if (!user?.id || !user?.token) {
      setErro("Você precisa estar logado para ver suas cestas.");
      setCarregando(false);
      return;
    }
    setCarregando(true);
    setErro(null);
    try {
      const lista = await cestasRecorrentesService.listarPorUsuario(
        user.token,
        user.id,
      );
      setCestas(lista);
    } catch (e: any) {
      setErro(e?.message ?? "Erro de conexão");
      setCestas([]);
    } finally {
      setCarregando(false);
    }
  }, [user?.id, user?.token]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function alternarAtiva(c: CestaRecorrenteApi) {
    if (!user?.token) return;
    setTogglingId(c.id);
    try {
      const atualizada = await cestasRecorrentesService.patch(user.token, c.id, {
        ativa: !c.ativa,
      });
      setCestas((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, ativa: atualizada.ativa } : x)),
      );
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Falha ao alternar status");
    } finally {
      setTogglingId(null);
    }
  }

  function cancelarCesta(c: CestaRecorrenteApi) {
    Alert.alert(
      "Cancelar cesta recorrente",
      `Remover a cesta "${c.nome}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            if (!user?.token) return;
            try {
              await cestasRecorrentesService.remover(user.token, c.id);
              setCestas((prev) => prev.filter((x) => x.id !== c.id));
            } catch (e: any) {
              Alert.alert("Erro", e?.message ?? "Falha ao remover");
            }
          },
        },
      ],
    );
  }

  // ───────── Componente: card de uma cesta (estilo cesta/[id].tsx) ─────────

  const CestaCard = ({ cesta }: { cesta: CestaRecorrenteApi }) => {
    const mercadorias = cesta.mercadorias ?? [];
    const totalItens = mercadorias.length;
    const togglingEsta = togglingId === cesta.id;

    return (
      <View style={styles.cestaInfo}>
        {/* Header da cesta: imagem + nome + tag */}
        <View style={styles.cestaHeader}>
          <View style={styles.cestaImageContainer}>
            <Image
              source={IMAGEM_PADRAO_CESTA}
              style={styles.cestaImage}
              resizeMode="cover"
            />
          </View>

          <View style={styles.cestaDetailsContainer}>
            <Text style={styles.cestaNome}>{cesta.nome}</Text>

            <View
              style={[
                styles.statusTag,
                cesta.ativa ? styles.statusAtiva : styles.statusPausada,
              ]}
            >
              <Ionicons
                name={cesta.ativa ? "checkmark-circle" : "pause-circle"}
                size={12}
                color={cesta.ativa ? "#065F46" : "#92400E"}
              />
              <Text
                style={[
                  styles.statusTagText,
                  { color: cesta.ativa ? "#065F46" : "#92400E" },
                ]}
              >
                {cesta.ativa ? "Ativa" : "Pausada"}
              </Text>
            </View>

            <Text style={styles.cestaPrecoCalculado}>
              R$ {Number(cesta.preco).toFixed(2)}
              <Text style={styles.cestaPrecoSub}> / entrega</Text>
            </Text>
          </View>
        </View>

        {/* Frequência e dia de entrega */}
        <View style={styles.metaInfo}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.metaTexto}>
            {cesta.frequencia} · {cesta.dia_entrega}
          </Text>
        </View>

        {/* Feirante */}
        {cesta.feirante?.nome ? (
          <View style={styles.feiranteInfo}>
            <Ionicons name="storefront-outline" size={16} color="#666" />
            <Text style={styles.feiranteTexto}>
              {[cesta.feirante.nome, cesta.feirante.banca]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </View>
        ) : null}

        {/* Itens da cesta */}
        <Text style={styles.itensTitle}>Itens da Cesta ({totalItens})</Text>
        <View style={styles.listaContainer}>
          {totalItens === 0 ? (
            <View style={styles.vazioItensContainer}>
              <Ionicons name="basket-outline" size={48} color="#ccc" />
              <Text style={styles.vazioItensTexto}>
                Esta cesta ainda não tem itens cadastrados.
              </Text>
            </View>
          ) : (
            mercadorias.map((m) => (
              <View key={m.id} style={styles.itemContainer}>
                <View style={styles.itemImageContainer}>
                  <Image
                    source={
                      m.foto ? { uri: m.foto } : IMAGEM_PADRAO_PRODUTO
                    }
                    style={styles.itemImagem}
                    resizeMode="cover"
                  />
                </View>

                <View style={styles.itemInfo}>
                  <Text style={styles.itemNome} numberOfLines={2}>
                    {m.emoji ? `${m.emoji} ` : ""}
                    {m.nome}
                  </Text>
                  <Text style={styles.itemPreco}>
                    R$ {Number(m.preco).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Ações */}
        <View style={styles.acoesContainer}>
          <TouchableOpacity
            style={[
              styles.acaoButton,
              cesta.ativa ? styles.acaoPausar : styles.acaoAtivar,
              togglingEsta && { opacity: 0.6 },
            ]}
            onPress={() => alternarAtiva(cesta)}
            disabled={togglingEsta}
          >
            {togglingEsta ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons
                  name={cesta.ativa ? "pause" : "play"}
                  size={18}
                  color="#FFF"
                />
                <Text style={styles.acaoButtonText}>
                  {cesta.ativa ? "Pausar" : "Ativar"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.acaoButton, styles.acaoCancelar]}
            onPress={() => cancelarCesta(cesta)}
          >
            <Ionicons name="trash-outline" size={18} color="#FFF" />
            <Text style={styles.acaoButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ───────── Estados de UI ─────────

  if (carregando) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#2D5D31" />
          </TouchableOpacity>
          <Text style={styles.title}>Minhas Cestas</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#2D5D31" />
          <Text style={styles.emptyText}>Carregando suas cestas...</Text>
        </View>
      </View>
    );
  }

  if (erro) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#2D5D31" />
          </TouchableOpacity>
          <Text style={styles.title}>Minhas Cestas</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="warning-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>{erro}</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={carregar}>
            <Text style={styles.emptyButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (cestas.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#2D5D31" />
          </TouchableOpacity>
          <Text style={styles.title}>Minhas Cestas</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="basket-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Você ainda não tem cestas recorrentes.</Text>
          <Text style={styles.emptySubText}>
            Quando estiver finalizando um pedido, toque em "Tornar cesta recorrente".
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push("/home")}
          >
            <Text style={styles.emptyButtonText}>Começar a comprar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ───────── Render principal ─────────

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#2D5D31" />
        </TouchableOpacity>
        <Text style={styles.title}>Minhas Cestas</Text>
        <TouchableOpacity onPress={carregar}>
          <Ionicons name="refresh" size={22} color="#2D5D31" />
        </TouchableOpacity>
      </View>

      {cestas.map((c) => (
        <CestaCard key={c.id} cesta={c} />
      ))}

      {/* Espaço final */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles — adaptados de cesta/[id].tsx para manter consistência visual
// ─────────────────────────────────────────────────────────────────────────────

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
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D5D31",
  },

  cestaInfo: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cestaHeader: {
    flexDirection: "row",
    marginBottom: 16,
  },
  cestaImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginRight: 16,
    overflow: "hidden",
    backgroundColor: "#F0F8F0",
  },
  cestaImage: { width: 80, height: 80 },
  cestaDetailsContainer: { flex: 1, justifyContent: "center" },
  cestaNome: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2D5D31",
    marginBottom: 8,
  },

  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  statusAtiva: { backgroundColor: "#D1FAE5" },
  statusPausada: { backgroundColor: "#FEF3C7" },
  statusTagText: { fontSize: 12, fontWeight: "bold" },

  cestaPrecoCalculado: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4A7C59",
  },
  cestaPrecoSub: { fontSize: 12, fontWeight: "normal", color: "#666" },

  metaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 10,
    paddingBottom: 6,
  },
  metaTexto: { fontSize: 14, color: "#333", fontWeight: "500" },

  feiranteInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginBottom: 12,
  },
  feiranteTexto: { fontSize: 14, color: "#666", flex: 1 },

  itensTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2D5D31",
    marginBottom: 12,
  },
  listaContainer: { marginBottom: 12 },

  vazioItensContainer: {
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  vazioItensTexto: { fontSize: 13, color: "#888", textAlign: "center" },

  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  itemImageContainer: { marginRight: 12 },
  itemImagem: { width: 50, height: 50, borderRadius: 10 },
  itemInfo: { flex: 1 },
  itemNome: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2D5D31",
    marginBottom: 2,
  },
  itemPreco: { fontSize: 13, color: "#4A7C59", fontWeight: "600" },

  acoesContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  acaoButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    paddingVertical: 14,
  },
  acaoPausar: { backgroundColor: "#F59E0B" },
  acaoAtivar: { backgroundColor: "#4A7C59" },
  acaoCancelar: { backgroundColor: "#DC2626" },
  acaoButtonText: { color: "#FFF", fontSize: 14, fontWeight: "bold" },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingTop: 40,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    lineHeight: 18,
  },
  emptyButton: {
    backgroundColor: "#4A7C59",
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 8,
  },
  emptyButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
