/**
 * Tela: cadastro/edição de endereço.
 *
 * Rota dinâmica:
 *  - /perfil/enderecos/novo  → cria um novo endereço
 *  - /perfil/enderecos/123   → edita o endereço de id=123
 *
 * Inclui autocomplete via ViaCEP (gratuito) — ao digitar 8 dígitos no campo
 * CEP, os campos endereço/bairro/cidade/UF são preenchidos automaticamente.
 */

import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import * as React from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useUser } from "../../../contexts/UserContext";
import { enderecosService } from "../../../services/enderecos";

const LABELS_SUGERIDOS = ["Casa", "Trabalho", "Família", "Outro"] as const;

function formatarCepInput(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

const FormularioEndereco: React.FC = () => {
  const {
    user,
    enderecos,
    setEnderecoSelecionado,
    recarregarEnderecos,
  } = useUser();
  const params = useLocalSearchParams<{ id: string }>();
  const idParam = String(params.id ?? "novo");
  const ehNovo = idParam === "novo";
  const id = ehNovo ? null : Number(idParam);

  const [label, setLabel] = React.useState("Casa");
  const [cep, setCep] = React.useState("");
  const [endereco, setEndereco] = React.useState("");
  const [numero, setNumero] = React.useState("");
  const [complemento, setComplemento] = React.useState("");
  const [bairro, setBairro] = React.useState("");
  const [cidade, setCidade] = React.useState("");
  const [uf, setUf] = React.useState("");
  const [estado, setEstado] = React.useState("");
  const [principal, setPrincipal] = React.useState(false);

  const [carregando, setCarregando] = React.useState(!ehNovo);
  const [buscandoCep, setBuscandoCep] = React.useState(false);
  const [salvando, setSalvando] = React.useState(false);
  const [localizando, setLocalizando] = React.useState(false);

  // Carrega endereço existente (modo edição) — usa lista do contexto.
  React.useEffect(() => {
    if (ehNovo || !id) {
      setCarregando(false);
      return;
    }
    const alvo = enderecos.find((e) => e.id === id);
    if (!alvo) {
      // Lista ainda não chegou — espera a recarga no foreground.
      setCarregando(enderecos.length === 0);
      return;
    }
    setLabel(alvo.label);
    setCep(alvo.cep ? formatarCepInput(alvo.cep) : "");
    setEndereco(alvo.endereco);
    setNumero(alvo.numero ?? "");
    setComplemento(alvo.complemento ?? "");
    setBairro(alvo.bairro);
    setCidade(alvo.cidade ?? "");
    setUf(alvo.uf ?? "");
    setEstado(alvo.estado ?? "");
    setPrincipal(alvo.principal);
    setCarregando(false);
  }, [ehNovo, id, enderecos]);

  async function buscarPeloCep() {
    const digitos = cep.replace(/\D/g, "");
    if (digitos.length !== 8) {
      Alert.alert("CEP inválido", "Informe os 8 dígitos do CEP.");
      return;
    }
    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
      if (!res.ok) throw new Error("Falha na consulta");
      const data = await res.json();
      if (data?.erro) {
        Alert.alert("CEP não encontrado", "Verifique o CEP digitado.");
      } else {
        if (data.logradouro) setEndereco(data.logradouro);
        if (data.bairro) setBairro(data.bairro);
        if (data.localidade) setCidade(data.localidade);
        if (data.uf) {
          setUf(data.uf);
          setEstado(nomeDoEstado(data.uf));
        }
      }
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Falha ao buscar CEP");
    } finally {
      setBuscandoCep(false);
    }
  }

  function nomeDoEstado(siglaUf: string): string {
    const map: Record<string, string> = {
      AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia",
      CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás",
      MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul",
      MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná",
      PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro",
      RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia",
      RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo",
      SE: "Sergipe", TO: "Tocantins",
    };
    return map[siglaUf?.toUpperCase()] ?? "";
  }

  function validar(): string | null {
    if (!label.trim()) return "Informe um rótulo (ex: Casa).";
    if (endereco.trim().length < 2) return "Endereço inválido.";
    if (bairro.trim().length < 2) return "Bairro inválido.";
    if (uf && uf.length !== 2) return "UF deve ter 2 letras.";
    if (cep) {
      const d = cep.replace(/\D/g, "");
      if (d.length !== 8) return "CEP deve ter 8 dígitos.";
    }
    return null;
  }

  /**
   * O backend salva o endereço na hora com latitude/longitude nulos e
   * geocodifica em SEGUNDO PLANO (pra não estourar o timeout serverless).
   * Fazemos um polling curto até as coordenadas aparecerem, para que a home
   * já mostre o endereço localizado sem precisar salvar duas vezes.
   * Se não resolver a tempo, volta assim mesmo (o fundo termina e o próximo
   * foreground sincroniza).
   */
  async function aguardarCoordenadas(
    token: string,
    usuarioId: string | number,
    enderecoId: number,
  ) {
    const TENTATIVAS = 6;
    const INTERVALO = 1200; // ms → até ~7s de espera máxima
    setLocalizando(true);
    try {
      for (let i = 0; i < TENTATIVAS; i++) {
        try {
          const lista = await enderecosService.listar(token, usuarioId);
          const alvo = lista.find((e) => e.id === enderecoId);
          if (alvo && alvo.latitude != null && alvo.longitude != null) return;
        } catch {
          // Falha de rede pontual: tenta de novo até o limite.
        }
        await new Promise((r) => setTimeout(r, INTERVALO));
      }
    } finally {
      setLocalizando(false);
    }
  }

  async function salvar() {
    const erro = validar();
    if (erro) {
      Alert.alert("Atenção", erro);
      return;
    }
    if (!user?.id || !user?.token) {
      Alert.alert("Sessão expirada", "Faça login novamente.");
      return;
    }
    setSalvando(true);
    try {
      const payload = {
        label: label.trim(),
        endereco: endereco.trim(),
        numero: numero.trim() || null,
        complemento: complemento.trim() || null,
        bairro: bairro.trim(),
        cidade: cidade.trim() || null,
        estado: estado.trim() || null,
        uf: uf.trim().toUpperCase() || null,
        cep: cep.replace(/\D/g, "") || null,
        principal,
      };
      if (ehNovo) {
        const criado = await enderecosService.criar(
          user.token,
          user.id,
          payload,
        );
        if (criado.principal) {
          setEnderecoSelecionado(criado.id);
        }
        // Espera a geocodificação de fundo antes de voltar.
        await aguardarCoordenadas(user.token, user.id, criado.id);
        Alert.alert("Pronto!", "Endereço adicionado.");
      } else if (id) {
        await enderecosService.atualizar(user.token, id, payload);
        if (principal) {
          await enderecosService.marcarComoPrincipal(user.token, id);
          setEnderecoSelecionado(id);
        }
        // Só reprocessa coords se o back pode ter zerado (mudou o endereço).
        await aguardarCoordenadas(user.token, user.id, id);
        Alert.alert("Pronto!", "Endereço atualizado.");
      }
      // Atualiza o contexto antes de voltar — a lista já refletirá a mudança
      await recarregarEnderecos();
      router.back();
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.containerCentro}>
        <ActivityIndicator color="#4A7C59" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#FFF" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen
        options={{
          title: ehNovo ? "Novo endereço" : "Editar endereço",
          headerStyle: { backgroundColor: "#FFF" },
          headerTitleStyle: {
            fontSize: 16,
            fontFamily: "Poppins-SemiBold",
            color: "#255336",
          },
          headerTintColor: "#255336",
        }}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Rótulo */}
        <Text style={styles.label}>Rótulo</Text>
        <TextInput
          style={styles.input}
          value={label}
          onChangeText={setLabel}
          placeholder="Casa, Trabalho, Sítio..."
          maxLength={40}
        />
        <View style={styles.chipsRow}>
          {LABELS_SUGERIDOS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, label === s && styles.chipAtivo]}
              onPress={() => setLabel(s)}
            >
              <Text
                style={[
                  styles.chipText,
                  label === s && styles.chipTextAtivo,
                ]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CEP com botão buscar */}
        <Text style={styles.label}>CEP</Text>
        <View style={styles.linhaCep}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            value={cep}
            onChangeText={(v) => setCep(formatarCepInput(v))}
            placeholder="00000-000"
            keyboardType="numeric"
            maxLength={9}
          />
          <TouchableOpacity
            style={styles.botaoBuscar}
            onPress={buscarPeloCep}
            disabled={buscandoCep}
          >
            {buscandoCep ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Ionicons name="search" size={18} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Endereço (rua, av.)</Text>
        <TextInput
          style={styles.input}
          value={endereco}
          onChangeText={setEndereco}
          placeholder="Rua das Flores"
        />

        <View style={styles.linhaDupla}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Número</Text>
            <TextInput
              style={styles.input}
              value={numero}
              onChangeText={setNumero}
              placeholder="123"
              keyboardType="numbers-and-punctuation"
            />
          </View>
          <View style={{ flex: 2 }}>
            <Text style={styles.label}>Complemento</Text>
            <TextInput
              style={styles.input}
              value={complemento}
              onChangeText={setComplemento}
              placeholder="Apto 32, Bloco B..."
            />
          </View>
        </View>

        <Text style={styles.label}>Bairro</Text>
        <TextInput
          style={styles.input}
          value={bairro}
          onChangeText={setBairro}
          placeholder="Centro"
        />

        <View style={styles.linhaDupla}>
          <View style={{ flex: 2 }}>
            <Text style={styles.label}>Cidade</Text>
            <TextInput
              style={styles.input}
              value={cidade}
              onChangeText={setCidade}
              placeholder="Pelotas"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>UF</Text>
            <TextInput
              style={styles.input}
              value={uf}
              onChangeText={(v) => setUf(v.toUpperCase().slice(0, 2))}
              placeholder="RS"
              maxLength={2}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Tornar principal */}
        <View style={styles.linhaSwitch}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitulo}>Tornar este o endereço principal</Text>
            <Text style={styles.switchSub}>
              Este endereço será usado por padrão para entrega.
            </Text>
          </View>
          <Switch
            value={principal}
            onValueChange={setPrincipal}
            trackColor={{ false: "#CFD8CF", true: "#4A7C59" }}
            thumbColor="#FFF"
          />
        </View>

        <TouchableOpacity
          style={[styles.botaoSalvar, salvando && { opacity: 0.6 }]}
          onPress={salvar}
          disabled={salvando}
        >
          {salvando ? (
            <View style={styles.botaoSalvandoConteudo}>
              <ActivityIndicator color="#FFF" />
              {localizando && (
                <Text style={styles.botaoSalvarTexto}>
                  Localizando endereço...
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.botaoSalvarTexto}>
              {ehNovo ? "Adicionar endereço" : "Salvar alterações"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  containerCentro: {
    flex: 1,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { padding: 16, paddingBottom: 60 },

  label: {
    fontSize: 13,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#FFF",
    marginBottom: 4,
  },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#255336",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#FFF",
  },
  chipAtivo: { backgroundColor: "#255336" },
  chipText: { fontSize: 12, color: "#255336", fontWeight: "600" },
  chipTextAtivo: { color: "#FFF" },

  linhaCep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  botaoBuscar: {
    backgroundColor: "#4A7C59",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 50,
  },

  linhaDupla: {
    flexDirection: "row",
    gap: 8,
  },

  linhaSwitch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F7F9F7",
    padding: 14,
    borderRadius: 10,
    marginTop: 14,
    marginBottom: 16,
  },
  switchTitulo: {
    fontSize: 13,
    fontFamily: "Poppins-SemiBold",
    color: "#255336",
  },
  switchSub: { fontSize: 11, color: "#7A8A7C", marginTop: 2 },

  botaoSalvar: {
    backgroundColor: "#4A7C59",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  botaoSalvarTexto: {
    color: "#FFF",
    fontSize: 15,
    fontFamily: "Poppins-SemiBold",
  },
  botaoSalvandoConteudo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});

export default FormularioEndereco;
