import * as React from "react";
import { Text, View, TextInput } from "react-native";
import { styles } from "./styles";

const CardObservacao = () => {
  const [observacaoText, setObservacaoText] = React.useState('');

  return (
    <View style={styles.section}>
      <View style={styles.h2}>
        <Text style={styles.observacoes}>Observações</Text>
      </View>
      <View style={styles.textareaWrapper}>
        <TextInput
          style={styles.instrucoesEspeciaisPara}
          placeholder="Instruções especiais para entrega..."
          placeholderTextColor="#adaebc"
          multiline={true}
          textAlignVertical="top"
          onChangeText={setObservacaoText}
          value={observacaoText}
        />
      </View>
    </View>
  );
};

export default CardObservacao;