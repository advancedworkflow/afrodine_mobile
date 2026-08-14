import {Platform} from 'react-native';

// Charte typographique Namke :
// Poppins             — corps, CTA, prix, noms de plats, navigation
// Archivo             — sous-titres, descriptions, petits textes, dashboards
// Fraunces_72pt_Soft  — titres H1, slogans (à utiliser avec parcimonie)
//
// Fichiers TTF livrés dans src/assets/fonts/, liés via react-native.config.js
// → Exécuter : npx react-native-asset  (puis rebuild natif)

export const Fonts = {
  // Poppins — corps / UI / navigation (300·Light → 400·Regular → 500·Medium → 900·Black)
  poppinsLight:   'Poppins-Light',
  poppinsRegular: 'Poppins-Regular',
  poppinsMedium:  'Poppins-Medium',
  poppinsBlack:   'Poppins-Black',

  // Archivo — sous-titres / descriptions / dashboards (300·Light → 400·Regular → 500·Medium → 900·Black)
  archivoLight:   'Archivo-Light',
  archivoRegular: 'Archivo-Regular',
  archivoMedium:  'Archivo-Medium',
  archivoBlack:   'Archivo-Black',

  // Fraunces 72pt Soft — display / H1 (Regular·400 / SemiBold·600 / Black·900)
  frauncesSoftRegular:   'Fraunces_72pt_Soft-Regular',
  frauncesSoftSemiBold:  'Fraunces_72pt_Soft-SemiBold',
  frauncesSoftBlack:     'Fraunces_72pt_Soft-Black',
};

/** Corps, CTA, prix, noms de plats, navigation (Poppins Regular) */
export const fontUI = Platform.select({
  ios:     'Poppins-Regular',
  android: 'Poppins-Regular',
  web:     "'Poppins', system-ui, sans-serif",
});

/** Titres H1, slogans — variante display Soft 72pt (Fraunces) */
export const fontDisplay = Platform.select({
  ios:     'Fraunces_72pt_Soft-SemiBold',
  android: 'Fraunces_72pt_Soft-SemiBold',
  web:     "'Fraunces', Georgia, 'Times New Roman', serif",
});

/** Sous-titres, descriptions, petits textes, dashboards (Archivo Regular) */
export const fontSub = Platform.select({
  ios:     'Archivo-Regular',
  android: 'Archivo-Regular',
  web:     "'Archivo', system-ui, sans-serif",
});

/** Alias conservé pour rétrocompatibilité avec les composants existants */
export const secondaryFont = fontUI;
