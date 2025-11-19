import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useUser } from "../../contexts/UserContext";

let ImagePicker: any = null;
try {
  ImagePicker = require("expo-image-picker");
} catch (e) {
  console.warn("expo-image-picker não instalado. Upload de avatar ficará desabilitado.");
}

export default function EditarPerfil() {
  const router = useRouter();
  const { user, updateUser } = useUser();

  const [nome, setNome] = useState(user?.nome || "");
  const [email, setEmail] = useState(user?.email || "");
  const [telefone, setTelefone] = useState(user?.telefone || "");
  const [endereco, setEndereco] = useState(user?.endereco || "");
  const [avatar, setAvatar] = useState<string | null | undefined>(user?.avatar || null);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    if (!ImagePicker) {
      Alert.alert("Recurso indisponível", "expo-image-picker não está instalado.");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão necessária", "Permissão para acessar a galeria é necessária.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      base64: true,
    });
    if (!result.cancelled) {
      // salvar base64 como data URI para uso local.
      setAvatar(result.uri || (result.base64 ? `data:image/jpeg;base64,${result.base64}` : null));
    }
  };

  const save = async () => {
    if (!nome.trim() || !email.trim()) {
      Alert.alert("Validação", "Nome e email são obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      await updateUser({ nome, email, telefone, endereco, avatar });
      Alert.alert("Sucesso", "Perfil atualizado com sucesso.");
      router.back();
    } catch (e) {
      console.warn(e);
      Alert.alert("Erro", "Falha ao atualizar perfil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Editar Perfil</Text>
      </View>

      <View style={styles.avatarRow}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={48} color="#255336" />
          </View>
        )}
        <TouchableOpacity style={styles.pickButton} onPress={pickImage}>
          <Ionicons name="camera-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Nome</Text>
        <TextInput style={styles.input} value={nome} onChangeText={setNome} />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />

        <Text style={styles.label}>Telefone</Text>
        <TextInput style={styles.input} value={telefone} onChangeText={setTelefone} />

        <Text style={styles.label}>Endereço</Text>
        <TextInput style={styles.input} value={endereco} onChangeText={setEndereco} />
      </View>

      {/* Lista de pedidos do usuário (contagem no título) */}
      <View style={styles.pedidosSection}>
        <Text style={styles.sectionTitle}>Meus Pedidos ({user?.pedidos ? user.pedidos.length : 0})</Text>
        {user?.pedidos && user.pedidos.length > 0 ? (
          user.pedidos.map((p) => (
            <TouchableOpacity key={p.id} style={styles.pedidoCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pedidoId}>Pedido #{p.id}</Text>
                <Text style={styles.pedidoMeta}>{p.data} • {p.itens.length} itens</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.pedidoTotal}>R$ {p.total.toFixed(2)}</Text>
                <Text style={styles.pedidoStatus}>{p.status}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noPedidos}>Você ainda não realizou pedidos.</Text>
        )}

        {/* Botão Salvar movido para abaixo dos pedidos */}
        <TouchableOpacity style={[styles.saveButton, { marginTop: 16 }]} onPress={save} disabled={saving}>
          <Text style={styles.saveText}>{saving ? "Salvando..." : "Salvar"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#FFF7E4" },
  header: { alignItems: "center", marginBottom: 8 },
  title: { fontSize: 20, fontWeight: "bold", color: "#255336" },
  avatarRow: { alignItems: "center", marginVertical: 12 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#E8F5E8", justifyContent: "center", alignItems: "center" },
  pickButton: { marginTop: 8, backgroundColor: "#255336", padding: 10, borderRadius: 8 },
  form: { marginTop: 8 },
  label: { color: "#333", marginBottom: 6, marginTop: 8 },
  input: { backgroundColor: "#FFF", padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#EEE" },
  saveButton: { marginTop: 16, backgroundColor: "#255336", padding: 14, borderRadius: 10, alignItems: "center" },
  saveText: { color: "#FFF", fontWeight: "600" },
  infoCard: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#EEE' },
  infoTitle: { fontWeight: '700', color: '#255336', marginBottom: 6 },
  infoItem: { color: '#333', marginBottom: 4 },
  pedidosSection: { marginTop: 16, marginBottom: 80 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 8 },
  pedidoCard: { backgroundColor: '#FFF', padding: 12, borderRadius: 10, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  pedidoId: { fontWeight: '700', color: '#255336' },
  pedidoMeta: { color: '#666', fontSize: 12 },
  pedidoTotal: { fontWeight: '700', color: '#255336' },
  pedidoStatus: { color: '#666', fontSize: 12 },
  noPedidos: { color: '#666', fontStyle: 'italic' },
});
