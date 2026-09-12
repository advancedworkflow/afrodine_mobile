import {Text, TextInput} from 'react-native';
import {fontUI} from './fonts';

/**
 * Applique Figtree comme police par défaut à tout Text/TextInput de l'app,
 * sans avoir à toucher chaque écran individuellement. Les styles explicites
 * (fontFamily: fontDisplay, etc.) passés par un composant restent prioritaires.
 * À importer une seule fois, avant le premier rendu (voir App.tsx / App.web.tsx).
 */
function applyDefaultFont(Component: typeof Text | typeof TextInput) {
  const existing = (Component as any).defaultProps || {};
  (Component as any).defaultProps = {
    ...existing,
    style: [{fontFamily: fontUI}, existing.style],
  };
}

applyDefaultFont(Text);
applyDefaultFont(TextInput);
