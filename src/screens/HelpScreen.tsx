import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking} from 'react-native';
import {useTranslation} from 'react-i18next';
import IconWrapper from '../components/IconWrapper';
import {Colors, Radius} from '../utils/colors';
import {fontDisplayMedium, fontHeading, fontUI} from '../utils/fonts';

const FAQ_KEYS = ['tracking', 'refund', 'paymentMethods', 'twoFactor'];

const HelpScreen = () => {
  const {t} = useTranslation();
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('help.title')}</Text>
      <Text style={styles.subtitle}>
        {t('help.subtitle')}
      </Text>

      <View style={styles.contactRow}>
        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => Linking.openURL('mailto:contact@namke.app')}
          activeOpacity={0.85}>
          <IconWrapper name="mail-outline" size={22} color={Colors.darkGreen} />
          <Text style={styles.contactLabel}>{t('help.email')}</Text>
          <Text style={styles.contactValue}>contact@namke.app</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => Linking.openURL('tel:+4917686660296')}
          activeOpacity={0.85}>
          <IconWrapper name="call-outline" size={22} color={Colors.darkGreen} />
          <Text style={styles.contactLabel}>{t('help.phone')}</Text>
          <Text style={styles.contactValue}>+49 176 86660296</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>{t('help.faqTitle')}</Text>
      <View style={styles.faqList}>
        {FAQ_KEYS.map(key => (
          <View key={key} style={styles.faqItem}>
            <Text style={styles.faqQuestion}>{t(`help.faq.${key}.q`)}</Text>
            <Text style={styles.faqAnswer}>{t(`help.faq.${key}.a`)}</Text>
          </View>
        ))}
      </View>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fontUI,
    color: Colors.textLight,
    lineHeight: 21,
    marginBottom: 22,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  contactCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 4,
  },
  contactLabel: {
    fontSize: 13,
    fontFamily: fontHeading,
    color: Colors.textLight,
    marginTop: 6,
  },
  contactValue: {
    fontSize: 14.5,
    fontFamily: fontUI,
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: fontHeading,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: 'rgba(5,16,4,0.58)',
    marginBottom: 10,
  },
  faqList: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 4,
  },
  faqItem: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 6,
  },
  faqQuestion: {
    fontSize: 16,
    fontFamily: fontDisplayMedium,
    color: Colors.text,
  },
  faqAnswer: {
    fontSize: 14.5,
    fontFamily: fontUI,
    color: Colors.textLight,
    lineHeight: 21,
  },
});

export default HelpScreen;
