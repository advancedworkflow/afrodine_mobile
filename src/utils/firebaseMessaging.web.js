// Stub pour @react-native-firebase/messaging sur web : ce module natif n'a pas de variante
// web et son code source (Flow) casse le bundling webpack. Le code appelant garde toujours
// `Platform.OS !== 'web'` avant d'utiliser `messaging()`, donc ce stub n'est jamais réellement
// invoqué — il doit juste permettre au bundle de se construire.
export default function messaging() {
  return {
    requestPermission: async () => 0,
    getToken: async () => null,
    onMessage: () => () => {},
    onTokenRefresh: () => () => {},
    setBackgroundMessageHandler: () => {},
  };
}
