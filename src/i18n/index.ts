import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import {NativeModules, Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import fr from './locales/fr.json';
import en from './locales/en.json';
import de from './locales/de.json';

export const SUPPORTED_LANGUAGES = ['fr', 'en', 'de'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const LANGUAGE_STORAGE_KEY = 'namke_lang';

/**
 * Langue du téléphone (App Store/Play Store/OS), sans dépendance native supplémentaire :
 * iOS expose la locale via SettingsManager, Android via I18nManager, le web via navigator.
 */
function getDeviceLanguage(): SupportedLanguage {
  let raw = '';
  try {
    if (Platform.OS === 'ios') {
      const settings = NativeModules.SettingsManager?.settings;
      raw = settings?.AppleLocale || settings?.AppleLanguages?.[0] || '';
    } else if (Platform.OS === 'android') {
      raw = NativeModules.I18nManager?.localeIdentifier || '';
    } else {
      raw = (typeof navigator !== 'undefined' && navigator.language) || '';
    }
  } catch {
    raw = '';
  }
  const code = raw.slice(0, 2).toLowerCase();
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(code)
    ? (code as SupportedLanguage)
    : 'fr';
}

// Les clés de pluriel "_one"/"_other" (ex. viewCart, catering.heroSubtitle) passent par
// Intl.PluralRules, que Hermes n'expose pas toujours. Sans lui, i18next retombe sur le format v3
// ("_plural") et affiche la clé brute : on fournit les règles fr/en/de (one/other) si besoin.
if (typeof Intl === 'undefined' || !Intl.PluralRules) {
  class PluralRules {
    private lang: string;
    constructor(locale?: string | string[]) {
      this.lang = String(Array.isArray(locale) ? locale[0] : locale ?? '').slice(0, 2);
    }
    select(n: number) {
      const isOne = this.lang === 'fr' ? n === 0 || n === 1 : n === 1;
      return isOne ? 'one' : 'other';
    }
    resolvedOptions() {
      return {pluralCategories: ['one', 'other']};
    }
  }
  (globalThis as any).Intl = {...(globalThis as any).Intl, PluralRules};
}

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

// Au premier lancement (rien de persisté), on suit la langue du téléphone.
// Si l'utilisateur a déjà choisi une langue dans l'app, on respecte ce choix.
AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
  .then(saved => {
    if (saved && (SUPPORTED_LANGUAGES as readonly string[]).includes(saved)) {
      i18n.changeLanguage(saved);
    } else {
      i18n.changeLanguage(getDeviceLanguage());
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
