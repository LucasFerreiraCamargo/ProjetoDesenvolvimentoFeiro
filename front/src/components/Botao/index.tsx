import * as React from "react";
import { Pressable, Image, Text, View, StyleProp, ViewStyle } from "react-native";
import styles from "./styles";

interface CustomButtonProps {
  imagePath: any;
  activeImagePath: any;
  text?: string;
  onPress: () => void;
  isActive: boolean;
  style?: StyleProp<ViewStyle>;
}

const CustomButton: React.FC<CustomButtonProps> = ({ imagePath, activeImagePath, text, onPress, isActive, style }) => {
  console.log("CustomButton - isActive:", isActive, "Text:", text);
  return (
    <Pressable onPress={onPress} style={[styles.buttonContainer, style]}>
      <View style={styles.content}>
        <Image
          source={isActive ? activeImagePath : imagePath}
          style={styles.buttonImage}
          resizeMode="contain"
        />
        {text && (
          <Text style={[styles.buttonText, isActive && styles.buttonTextActive]}>
            {text}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

export default CustomButton;