// Stub pour @react-native-google-signin/google-signin sur web : pas de variante web pour ce
// module natif. Le code appelant garde toujours `Platform.OS !== 'web'` avant utilisation,
// donc ce stub n'est jamais réellement invoqué — il doit juste permettre au bundle de se
// construire.
export const GoogleSignin = {
  configure: () => {},
  hasPlayServices: async () => true,
  signIn: async () => {
    throw new Error('Google Sign-In indisponible sur le web');
  },
};
