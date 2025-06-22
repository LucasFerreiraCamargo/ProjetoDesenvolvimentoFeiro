// Fallback para react-native-maps na web
import { View } from "react-native";

// Mock do MapView para web
const MapView = (props) => {
  return <View {...props} />;
};

// Mock do Marker para web
const Marker = (props) => {
  return <View {...props} />;
};

export default MapView;
export { Marker };
