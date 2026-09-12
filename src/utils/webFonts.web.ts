// Charge les mêmes fichiers TTF que le natif (src/assets/fonts/) via @font-face,
// sous les mêmes noms de famille littéraux (ex. 'Poppins-SemiBold'), pour que
// fonts.ts n'ait plus besoin d'un mapping séparé pour le web et que les poids
// (Regular/SemiBold/Black) rendent réellement différemment au lieu de tous
// retomber sur le poids par défaut du navigateur.

const fontFiles: Record<string, string> = {
  'Poppins-Light': require('../assets/fonts/Poppins-Light.ttf'),
  'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
  'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
  'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
  'Poppins-Black': require('../assets/fonts/Poppins-Black.ttf'),
  'Archivo-Light': require('../assets/fonts/Archivo-Light.ttf'),
  'Archivo-Regular': require('../assets/fonts/Archivo-Regular.ttf'),
  'Archivo-Medium': require('../assets/fonts/Archivo-Medium.ttf'),
  'Archivo-SemiBold': require('../assets/fonts/Archivo-SemiBold.ttf'),
  'Archivo-Black': require('../assets/fonts/Archivo-Black.ttf'),
  'Fraunces_72pt_Soft-Regular': require('../assets/fonts/Fraunces_72pt_Soft-Regular.ttf'),
  'Fraunces_72pt_Soft-SemiBold': require('../assets/fonts/Fraunces_72pt_Soft-SemiBold.ttf'),
  'Fraunces_72pt_Soft-Black': require('../assets/fonts/Fraunces_72pt_Soft-Black.ttf'),
};

const css = Object.entries(fontFiles)
  .map(
    ([family, url]) => `@font-face {
  font-family: '${family}';
  src: url('${url}') format('truetype');
  font-display: swap;
}`,
  )
  .join('\n');

const styleEl = document.createElement('style');
styleEl.setAttribute('data-namke-fonts', 'true');
styleEl.textContent = css;
document.head.appendChild(styleEl);

export {};
