// Stub pour react-native-webview sur web : pas de variante web pour ce module natif. Le code
// appelant (RestaurantMap) garde toujours `Platform.OS !== 'web'` avant de rendre <WebView>,
// donc ce stub n'est jamais réellement rendu — il doit juste permettre au bundle de se
// construire.
export const WebView = () => null;
