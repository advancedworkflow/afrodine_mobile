/**
 * Charte Namke — d'après les maquettes "Namke App Mobile" (12 écrans, onboarding → paiement).
 * Fond crème, terracotta pour l'action, vert foncé pour la structure, moutarde en accent.
 */
export const Colors = {
  // Couleurs de marque
  mustard: '#FFC717',
  terracotta: '#EF4C23',
  olive: '#72B744',
  darkGreen: '#054625',
  cream: '#FBF9D9',
  namkeWhite: '#FCFBF5',
  namkeBlack: '#051004',
  /** Alias de `cream` — fond des champs/puces/cards secondaires. */
  surface: '#FBF9D9',

  white: '#ffffff',
  black: '#000000',

  primary: '#EF4C23',
  primaryLight: '#F47A54',
  primaryLighter: '#FBC7B4',
  primaryDark: '#B8340F',
  secondary: '#054625',
  background: '#FCFBF5',
  backgroundLight: '#FCFBF5',
  text: '#051004',
  textLight: 'rgba(5,16,4,0.62)',
  textDark: '#051004',
  border: 'rgba(5,16,4,0.12)',
  error: '#ef4444',
  success: '#72B744',
  warning: '#FFC717',

  gray: {
    50: '#FBF9D9',
    100: 'rgba(5,16,4,0.06)',
    200: 'rgba(5,16,4,0.1)',
    300: 'rgba(5,16,4,0.16)',
    400: 'rgba(5,16,4,0.34)',
    500: 'rgba(5,16,4,0.5)',
    600: 'rgba(5,16,4,0.62)',
    700: 'rgba(5,16,4,0.76)',
    800: 'rgba(5,16,4,0.88)',
    900: '#051004',
  },

  category: {
    darkGreenWhite: {bg: '#FCFBF5', icon: '#EF4C23'},
    orange: {bg: '#FBF9D9', icon: '#EF4C23'},
    red: {bg: '#fdecea', icon: '#ef4444'},
    yellow: {bg: '#FBF9D9', icon: '#FFC717'},
    green: {bg: '#FBF9D9', icon: '#72B744'},
    purple: {bg: '#faf5ff', icon: '#a855f7'},
    blue: {bg: '#eff6ff', icon: '#3b82f6'},
    pink: {bg: '#fdf2f8', icon: '#ec4899'},
  },
};

/** Rayons — très arrondi, jusqu'à la pilule pour boutons/champs/tags. */
export const Radius = {
  sm: 9,
  md: 18,
  lg: 26,
  pill: 999,
};

/** Espacements. */
export const Spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 22,
  8: 30,
};

/** Ombres — teintées encre (namkeBlack), jamais du noir pur. */
// Design plat : pas d'ombre sur les cartes ; les jetons restent pour ne pas toucher chaque écran
export const Shadows = {
  sm: {},
  md: {},
  lg: {},
};
