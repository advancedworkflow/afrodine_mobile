import {Platform} from 'react-native';

/**
 * Charte Namke : Poppins / Archivo / Fraunces sur le web (voir index HTML).
 * Sur iOS/Android sans polices embarquées : système proche (sans-serif) + serif pour les titres.
 */
export const Fonts = {
  regular: 'IstokWeb-Regular',
  bold: 'IstokWeb-Bold',
  italic: 'IstokWeb-Italic',
  boldItalic: 'IstokWeb-BoldItalic',
};

export const secondaryFont = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  web: "'Poppins', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
});

/** Titres forts (équivalent Fraunces) */
export const fontDisplay = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: "'Fraunces', Georgia, 'Times New Roman', serif",
});

/** Sous-titres, petits libellés (équivalent Archivo) */
export const fontSub = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  web: "'Archivo', system-ui, sans-serif",
});

/** Corps, CTA, navigation (équivalent Poppins) */
export const fontUI = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  web: "'Poppins', system-ui, sans-serif",
});
