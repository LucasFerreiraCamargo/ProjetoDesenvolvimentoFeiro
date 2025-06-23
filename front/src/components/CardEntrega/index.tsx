import * as React from "react";
import { Text, View, Image, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import ArrowDownImage from "../../../assets/images/seta-baixo.png"; 
import { styles } from "./styles";

const CardEntrega = () => {
  const router = useRouter();
  const [deliveryOption, setDeliveryOption] = React.useState<'delivery' | 'pickup'>('delivery');
  const [pickupTime, setPickupTime] = React.useState<string>('Hoje - Entre 14h e 16h');

  const pickupTimeOptions = [
    'Hoje - Entre 14h e 16h',
    'Hoje - Entre 16h e 18h',
    'Amanhã - Entre 10h e 12h',
    'Amanhã - Entre 14h e 16h',
    'Terça - Entre 09h e 11h',
    'Quarta - Entre 15h e 17h',
  ];

  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = React.useState(false);

  const handleEditAddress = () => {
    router.push("/edita-endereco"); 
  };

  return (
    <View style={styles.section}>
      <View style={styles.h2}>
        <Text style={styles.comoDesejaReceber}>Como deseja receber?</Text>
      </View>
      <View style={styles.div}>
        <Pressable
          style={styles.optionRow}
          onPress={() => setDeliveryOption('delivery')}
        >
          <View style={[styles.radioButton, deliveryOption === 'delivery' && styles.radioButtonSelectedOuter]}>
            {deliveryOption === 'delivery' && <View style={styles.radioButtonSelectedInner} />}
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.entregarNoMeu}>Entregar no meu endereço</Text>
            <Text style={styles.ruaDasFlores}>Rua das Flores, 123 - Jardim Primavera</Text>
            <Pressable style={styles.button} onPress={handleEditAddress}>
              <Text style={styles.editarEndereo}>Editar endereço</Text>
            </Pressable>
          </View>
        </Pressable>
        <Pressable
          style={[styles.optionRow, styles.pickupOptionRow]}
          onPress={() => {
            setDeliveryOption('pickup');
            setIsTimeDropdownOpen(false);
          }}
        >
          <View style={[styles.radioButton, deliveryOption === 'pickup' && styles.radioButtonSelectedOuter]}>
            {deliveryOption === 'pickup' && <View style={styles.radioButtonSelectedInner} />}
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.retirarNaFeira}>Retirar na feira</Text>
            {deliveryOption === 'pickup' && (
              <View style={styles.pickupTimeContainer}>
                <Text style={styles.horarioEstimadoPara}>Horário estimado para retirada</Text>
                <Pressable
                  style={styles.select}
                  onPress={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                >
                  <Text style={styles.hojeEntre} numberOfLines={1}>{pickupTime}</Text>
                  <Image source={ArrowDownImage} style={styles.arrowImage} />
                </Pressable>
                {isTimeDropdownOpen && (
                  <View style={styles.dropdownOptions}>
                    {pickupTimeOptions.map((option, index) => (
                      <Pressable
                        key={index}
                        style={styles.dropdownOptionItem}
                        onPress={() => {
                          setPickupTime(option);
                          setIsTimeDropdownOpen(false);
                        }}
                      >
                        <Text style={styles.dropdownOptionText}>{option}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </Pressable>
      </View>
    </View>
  );
};

export default CardEntrega;