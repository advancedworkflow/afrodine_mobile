import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Svg, {Rect, Path} from 'react-native-svg';
import {useTranslation} from 'react-i18next';
import {setAppLanguage, SUPPORTED_LANGUAGES, SupportedLanguage} from '../i18n';
import {Colors} from '../utils/colors';
import {secondaryFont} from '../utils/fonts';

// Emoji drapeaux (🇫🇷/🇬🇧/🇩🇪) non fiables selon plateforme/police (ex. web sous Windows
// les affiche comme du texte "FR"/"GB"/"DE") — on utilise de vrais SVG, comme sur le web.
const FlagFR = () => (
  <Svg width={20} height={14} viewBox="0 0 3 2">
    <Rect width={1} height={2} x={0} fill="#0055A4" />
    <Rect width={1} height={2} x={1} fill="#FFFFFF" />
    <Rect width={1} height={2} x={2} fill="#EF4135" />
  </Svg>
);

const FlagGB = () => (
  <Svg width={20} height={14} viewBox="0 0 60 36">
    <Rect width={60} height={36} fill="#00247D" />
    <Path d="M0,0 L60,36 M60,0 L0,36" stroke="#FFFFFF" strokeWidth={7} />
    <Path d="M0,0 L60,36 M60,0 L0,36" stroke="#CF142B" strokeWidth={3} />
    <Path d="M30,0 V36 M0,18 H60" stroke="#FFFFFF" strokeWidth={11} />
    <Path d="M30,0 V36 M0,18 H60" stroke="#CF142B" strokeWidth={6} />
  </Svg>
);

const FlagDE = () => (
  <Svg width={20} height={14} viewBox="0 0 3 2">
    <Rect width={3} height={2} y={0} fill="#000000" />
    <Rect width={3} height={1.333} y={0.667} fill="#DD0000" />
    <Rect width={3} height={0.667} y={1.333} fill="#FFCE00" />
  </Svg>
);

const FLAGS: Record<SupportedLanguage, () => React.JSX.Element> = {
  fr: FlagFR,
  en: FlagGB,
  de: FlagDE,
};

export default function LanguageSwitcher() {
  const {i18n} = useTranslation();

  return (
    <View style={styles.row}>
      {SUPPORTED_LANGUAGES.map(lang => {
        const active = i18n.language === lang;
        const Flag = FLAGS[lang];
        return (
          <TouchableOpacity
            key={lang}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => setAppLanguage(lang)}>
            <View style={styles.flag}>
              <Flag />
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>
              {lang.toUpperCase()}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    backgroundColor: Colors.gray[50],
  },
  pillActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  flag: {
    marginRight: 6,
    borderRadius: 2,
    overflow: 'hidden',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  labelActive: {
    color: Colors.white,
  },
});
