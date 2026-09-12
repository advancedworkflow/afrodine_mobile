import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import fr from './locales/fr.json';
import en from './locales/en.json';
import de from './locales/de.json';

export const SUPPORTED_LANGUAGES = ['fr', 'en', 'de'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const LANGUAGE_STORAGE_KEY = 'namke_lang';

i18n.use(initReactI18next).init({
  resources: {
    fr: {translation: fr},
    en: {translation: en},
    de: {translation: de},
  },
  lng: 'fr',
  fallbackLng: 'fr',
  supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
  returnNull: false,
  interpolation: {
    escapeValue: false,
  },
});

// Applique la langue précédemment choisie (persistée), une fois AsyncStorage lu.
AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
  .then(saved => {
    if (saved && (SUPPORTED_LANGUAGES as readonly string[]).includes(saved)) {
      i18n.changeLanguage(saved);
    }
  })
  .catch(() => {});

export async function setAppLanguage(lang: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(lang);
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Persistance best-effort : la langue reste appliquée pour la session en cours.
  }
}

export default i18n;
