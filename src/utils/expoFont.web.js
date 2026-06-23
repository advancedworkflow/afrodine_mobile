// Mock pour expo-font sur le web
// @expo/vector-icons nécessite expo-font mais sur le web, les icônes fonctionnent sans

export const loadAsync = async () => {
  // Pas besoin de charger des polices sur le web
  return {};
};

export const isLoaded = () => {
  return true;
};

export const useFonts = (fonts) => {
  // Retourne un tableau [loaded, error] comme l'API Expo
  // Version simplifiée pour le web - toujours chargé
  return [true, null];
};

export default {
  loadAsync,
  isLoaded,
  useFonts,
};

