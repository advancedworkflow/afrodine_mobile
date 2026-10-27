import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Colors, Radius} from '../utils/colors';
import {fontDisplayMedium, fontHeading, fontUI} from '../utils/fonts';

// Même contenu que /terms-of-service côté web (clés i18n `terms.*`), condensé pour mobile.
const SECTION_KEYS = [
  {key: 'operation', paragraphCount: 2},
  {key: 'culinaryPartners', paragraphCount: 2},
  {key: 'deliveryPartners', paragraphCount: 1},
  {key: 'withdrawalRight', paragraphCount: 1},
  {key: 'paymentMethods', paragraphCount: 1},
  {key: 'disputes', paragraphCount: 1},
  {key: 'ratingSystem', paragraphCount: 1},
];

const TermsScreen = () => {
  const {t} = useTranslation();
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('terms.title')}</Text>
      <Text style={styles.subtitle}>{t('terms.subtitle')}</Text>

      {SECTION_KEYS.map(section => (
        <View key={section.key} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t(`terms.sections.${section.key}.title`)}</Text>
          {Array.from({length: section.paragraphCount}).map((_, i) => (
            <Text key={i} style={styles.paragraph}>{t(`terms.sections.${section.key}.paragraph${i + 1}`)}</Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  content: {
    padding: 22,
    paddingBottom: 40,
  },
  title: {
    fontSize: 21,
    fontFamily: fontDisplayMedium,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14.5,
    fontFamily: fontUI,
    color: Colors.textLight,
    marginBottom: 22,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16.5,
    fontFamily: fontHeading,
    color: Colors.darkGreen,
  },
  paragraph: {
    fontSize: 14.5,
    fontFamily: fontUI,
    color: Colors.text,
    lineHeight: 21,
  },
});

export default TermsScreen;
