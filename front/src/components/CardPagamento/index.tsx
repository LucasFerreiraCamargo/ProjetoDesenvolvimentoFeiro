import * as React from "react";
import { Text, View, Pressable, TextInput } from "react-native";
import { styles } from "./styles";

const CardPagamento = () => {
  const [paymentOption, setPaymentOption] = React.useState<'creditCard' | 'pix' | 'cash'>('creditCard');
  const [cardNumber, setCardNumber] = React.useState('');
  const [cardExpiry, setCardExpiry] = React.useState('');
  const [cardCvv, setCardCvv] = React.useState('');
  const [cashChange, setCashChange] = React.useState('');

  return (
    <View style={styles.section}>
      <View style={styles.h2}>
        <Text style={styles.pagamento}>Pagamento</Text>
      </View>
      <View style={styles.div}>
        <Pressable
          style={styles.optionRow}
          onPress={() => setPaymentOption('creditCard')}
        >
          <View style={[styles.radioButton, paymentOption === 'creditCard' && styles.radioButtonSelectedOuter]}>
            {paymentOption === 'creditCard' && <View style={styles.radioButtonSelectedInner} />}
          </View>
          <Text style={styles.cartoDeCrdito}>Cartão de Crédito</Text>
        </Pressable>

        {paymentOption === 'creditCard' && (
          <View style={styles.creditCardFields}>
            <TextInput
              style={styles.inputFieldFull}
              placeholder="Número do cartão"
              placeholderTextColor="#adaebc"
              keyboardType="numeric"
              onChangeText={setCardNumber}
              value={cardNumber}
            />
            <View style={styles.cardExpiryCvvRow}>
              <TextInput
                style={styles.inputFieldHalf}
                placeholder="MM/AA"
                placeholderTextColor="#adaebc"
                keyboardType="numeric"
                maxLength={5}
                onChangeText={setCardExpiry}
                value={cardExpiry}
              />
              <TextInput
                style={styles.inputFieldHalf}
                placeholder="CVV"
                placeholderTextColor="#adaebc"
                keyboardType="numeric"
                maxLength={4}
                onChangeText={setCardCvv}
                value={cardCvv}
              />
            </View>
          </View>
        )}

        <Pressable
          style={styles.optionRow}
          onPress={() => setPaymentOption('pix')}
        >
          <View style={[styles.radioButton, paymentOption === 'pix' && styles.radioButtonSelectedOuter]}>
            {paymentOption === 'pix' && <View style={styles.radioButtonSelectedInner} />}
          </View>
          <Text style={styles.pix}>PIX</Text>
        </Pressable>

        <Pressable
          style={styles.optionRow}
          onPress={() => setPaymentOption('cash')}
        >
          <View style={[styles.radioButton, paymentOption === 'cash' && styles.radioButtonSelectedOuter]}>
            {paymentOption === 'cash' && <View style={styles.radioButtonSelectedInner} />}
          </View>
          <Text style={styles.dinheiro}>Dinheiro</Text>
        </Pressable>

        {paymentOption === 'cash' && (
          <TextInput
            style={styles.inputFieldFull}
            placeholder="Troco para quanto?"
            placeholderTextColor="#adaebc"
            keyboardType="numeric"
            onChangeText={setCashChange}
            value={cashChange}
          />
        )}
      </View>
    </View>
  );
};

export default CardPagamento;