import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";


export default function EditAddressScreen() {
  const [endereco, setEndereco] = useState({
    cep: "01234-567",
    rua: "Rua das Flores",
    numero: "123",
    complemento: "Apto 45",
    bairro: "Jardim Primavera",
    cidade: "São Paulo",
    estado: "SP",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarEndereco();
  }, []);

  const carregarEndereco = async () => {
    try {
      const enderecoSalvo = await AsyncStorage.getItem("endereco_usuario");
      if (enderecoSalvo) {
        setEndereco(JSON.parse(enderecoSalvo));
      }
    } catch (error) {
      console.log("Erro ao carregar endereço:", error);
    }
  };

  const formatarCEP = (cep: string) => {
    const numero = cep.replace(/\D/g, "");
    if (numero.length <= 5) {
      return numero;
    }
    return numero.slice(0, 5) + "-" + numero.slice(5, 8);
  };

  const buscarCEP = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, "");

    if (cepLimpo.length !== 8) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`
      );
      const data = await response.json();

      if (!data.erro) {
        setEndereco((prev) => ({
          ...prev,
          rua: data.logradouro || prev.rua,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
        }));
      } else {
        Alert.alert("Erro", "CEP não encontrado.");
      }
    } catch (error) {
      Alert.alert(
        "Erro",
        "Não foi possível buscar o CEP. Verifique sua conexão."
      );
    } finally {
      setLoading(false);
    }
  };

  const validarFormulario = () => {
    if (!endereco.cep || endereco.cep.length < 9) {
      Alert.alert("Erro", "Informe um CEP válido.");
      return false;
    }

    if (!endereco.rua.trim()) {
      Alert.alert("Erro", "Informe o nome da rua.");
      return false;
    }

    if (!endereco.numero.trim()) {
      Alert.alert("Erro", "Informe o número.");
      return false;
    }

    if (!endereco.bairro.trim()) {
      Alert.alert("Erro", "Informe o bairro.");
      return false;
    }

    if (!endereco.cidade.trim()) {
      Alert.alert("Erro", "Informe a cidade.");
      return false;
    }

    if (!endereco.estado.trim()) {
      Alert.alert("Erro", "Informe o estado.");
      return false;
    }

    return true;
  };

  const salvarEndereco = async () => {
    if (!validarFormulario()) {
      return;
    }

    try {
      // Salva o endereço no AsyncStorage
      await AsyncStorage.setItem("endereco_usuario", JSON.stringify(endereco));

      Alert.alert("Sucesso", "Endereço atualizado com sucesso!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Erro",
        "Não foi possível salvar o endereço. Tente novamente."
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Endereço</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          {/* CEP */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>CEP *</Text>
            <View style={styles.cepContainer}>
              <TextInput
                style={[styles.input, styles.cepInput]}
                placeholder="00000-000"
                placeholderTextColor="#999"
                value={endereco.cep}
                onChangeText={(text) => {
                  const cepFormatado = formatarCEP(text);
                  setEndereco((prev) => ({ ...prev, cep: cepFormatado }));

                  if (cepFormatado.length === 9) {
                    buscarCEP(cepFormatado);
                  }
                }}
                keyboardType="numeric"
                maxLength={9}
              />
              <TouchableOpacity
                style={styles.buscarButton}
                onPress={() => buscarCEP(endereco.cep)}
                disabled={loading}
              >
                {loading ? (
                  <Text style={styles.buscarButtonText}>...</Text>
                ) : (
                  <Ionicons name="search" size={20} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Rua */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Rua/Avenida *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome da rua"
              placeholderTextColor="#999"
              value={endereco.rua}
              onChangeText={(text) =>
                setEndereco((prev) => ({ ...prev, rua: text }))
              }
            />
          </View>

          {/* Número e Complemento */}
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, styles.inputHalf]}>
              <Text style={styles.label}>Número *</Text>
              <TextInput
                style={styles.input}
                placeholder="123"
                placeholderTextColor="#999"
                value={endereco.numero}
                onChangeText={(text) =>
                  setEndereco((prev) => ({ ...prev, numero: text }))
                }
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.inputHalf]}>
              <Text style={styles.label}>Complemento</Text>
              <TextInput
                style={styles.input}
                placeholder="Apto, casa, etc."
                placeholderTextColor="#999"
                value={endereco.complemento}
                onChangeText={(text) =>
                  setEndereco((prev) => ({ ...prev, complemento: text }))
                }
              />
            </View>
          </View>

          {/* Bairro */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bairro *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome do bairro"
              placeholderTextColor="#999"
              value={endereco.bairro}
              onChangeText={(text) =>
                setEndereco((prev) => ({ ...prev, bairro: text }))
              }
            />
          </View>

          {/* Cidade e Estado */}
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 2 }]}>
              <Text style={styles.label}>Cidade *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome da cidade"
                placeholderTextColor="#999"
                value={endereco.cidade}
                onChangeText={(text) =>
                  setEndereco((prev) => ({ ...prev, cidade: text }))
                }
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Estado *</Text>
              <TextInput
                style={styles.input}
                placeholder="UF"
                placeholderTextColor="#999"
                value={endereco.estado}
                onChangeText={(text) =>
                  setEndereco((prev) => ({
                    ...prev,
                    estado: text.toUpperCase(),
                  }))
                }
                maxLength={2}
              />
            </View>
          </View>

          {/* Informação sobre campos obrigatórios */}
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle" size={16} color="#666" />
            <Text style={styles.infoText}>* Campos obrigatórios</Text>
          </View>

          {/* Preview do endereço */}
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Endereço completo:</Text>
            <Text style={styles.previewText}>
              {endereco.rua}, {endereco.numero}
              {endereco.complemento ? `, ${endereco.complemento}` : ""}
              {"\n"}
              {endereco.bairro} - {endereco.cidade}/{endereco.estado}
              {"\n"}CEP: {endereco.cep}
            </Text>
          </View>
        </View>

        <View style={styles.navSpacer} />
      </ScrollView>

      {/* Footer com botões */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.salvarButton} onPress={salvarEndereco}>
          <Text style={styles.salvarButtonText}>Salvar Endereço</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelarButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelarButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>

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
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cepContainer: {
    flexDirection: "row",
    gap: 12,
  },
  cepInput: {
    flex: 1,
  },
  buscarButton: {
    backgroundColor: "#2D5D31",
    borderRadius: 12,
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buscarButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
  },
  previewContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  footer: {
    backgroundColor: "#FFF7E4",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 12,
  },
  salvarButton: {
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
  salvarButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelarButton: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cancelarButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  navSpacer: {
    height: 20,
  },
});
