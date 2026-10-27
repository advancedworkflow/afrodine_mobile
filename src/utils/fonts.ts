// Charte typographique Namke — d'après les maquettes "Namke App Mobile" :
// Fraunces_72pt_Soft  — grands titres (H1/H2/H3, prix hero), poids 900 ;
//                       titres de card (nom de plat/restaurant/cuisinier), poids 600
// Poppins             — corps de texte par défaut, CTA/boutons principaux (600)
// Archivo             — labels, badges, onglets, liens courts, méta-infos
//
// Fichiers TTF livrés dans src/assets/fonts/, liés via react-native.config.js
// → Exécuté : npx react-native-asset (déjà appliqué à ce repo)

import {Platform} from 'react-native';

// iOS désigne une police par son nom PostScript, Android/web par le nom du fichier.
// Identiques pour Poppins et Archivo, mais pas pour Fraunces ("Fraunces72ptSoft-Black") :
// sans ce mapping, iOS retombe sur la police système pour tous les titres.
const fraunces = (weight: 'Regular' | 'SemiBold' | 'Black') =>
  Platform.OS === 'ios' ? `Fraunces72ptSoft-${weight}` : `Fraunces_72pt_Soft-${weight}`;

export const Fonts = {
  // Poppins — corps / UI / CTA (300·Light → 400·Regular → 500·Medium → 600·SemiBold → 900·Black)
  poppinsLight:    'Poppins-Light',
  poppinsRegular:  'Poppins-Regular',
  poppinsMedium:   'Poppins-Medium',
  poppinsSemiBold: 'Poppins-SemiBold',
  poppinsBlack:    'Poppins-Black',

  // Archivo — labels / badges / onglets (300·Light → 400·Regular → 500·Medium → 600·SemiBold → 900·Black)
  archivoLight:    'Archivo-Light',
  archivoRegular:  'Archivo-Regular',
  archivoMedium:   'Archivo-Medium',
  archivoSemiBold: 'Archivo-SemiBold',
  archivoBlack:    'Archivo-Black',

  // Fraunces 72pt Soft — display / titres (400·Regular / 600·SemiBold / 900·Black)
  frauncesSoftRegular:  fraunces('Regular'),
  frauncesSoftSemiBold: fraunces('SemiBold'),
  frauncesSoftBlack:    fraunces('Black'),
};

// Sur web, on charge les mêmes fichiers TTF que le natif sous les mêmes noms
// de famille littéraux (voir webFonts.web.ts) : pas besoin d'un mapping séparé,
// et chaque poids (Regular/SemiBold/Black) reste distinct au lieu de tous
// retomber sur le poids par défaut du navigateur.

/** Corps de texte par défaut (Poppins Regular) */
export const fontUI = 'Poppins-Regular';

/** CTA / boutons pleins ou contourés (Poppins SemiBold) */
export const fontButton = 'Poppins-SemiBold';

/** Grands titres — h1/h2/h3, en-têtes d'écran, prix hero (Fraunces Black) */
export const fontDisplay = fraunces('Black');

/** Titres de card — nom de plat/restaurant/cuisinier (Fraunces SemiBold) */
export const fontDisplayMedium = fraunces('SemiBold');

/** Labels, badges, onglets, liens courts, méta-infos (Archivo SemiBold) */
export const fontHeading = 'Archivo-SemiBold';

/** Sous-titres, descriptions secondaires (Archivo Regular) */
export const fontSub = 'Archivo-Regular';

/** Alias conservé pour rétrocompatibilité avec les composants existants */
export const secondaryFont = fontUI;
