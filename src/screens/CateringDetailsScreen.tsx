import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import TopBar from '../components/TopBar';
import IconWrapper from '../components/IconWrapper';
import {Colors} from '../utils/colors';
import {secondaryFont} from '../utils/fonts';

const CateringDetailsScreen = ({navigation}: any) => {
  return (
    <View style={styles.container}>
      <TopBar
        navigation={navigation}
        title="Service traiteur"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIconWrap}>
            <IconWrapper name="restaurant-outline" size={56} color={Colors.white} />
          </View>
          <Text style={styles.heroTitle}>Traiteur pour vos événements</Text>
          <Text style={styles.heroSubtitle}>
            Mariages, séminaires, anniversaires… Des formules sur mesure avec les meilleurs restaurants.
          </Text>
        </View>
        <View style={styles.features}>
          <View style={styles.featureRow}>
            <IconWrapper name="people-outline" size={24} color={Colors.primary} />
            <Text style={styles.featureText}>De 10 à 500+ convives</Text>
          </View>
          <View style={styles.featureRow}>
            <IconWrapper name="calendar-outline" size={24} color={Colors.primary} />
            <Text style={styles.featureText}>Réservation et devis en ligne</Text>
          </View>
          <View style={styles.featureRow}>
            <IconWrapper name="star-outline" size={24} color={Colors.primary} />
            <Text style={styles.featureText}>Restaurants partenaires sélectionnés</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('Catering')}
          activeOpacity={0.8}>
          <Text style={styles.ctaButtonText}>Voir les offres traiteur</Text>
          <IconWrapper name="arrow-forward-circle" size={24} color={Colors.white} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  heroIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: secondaryFont,
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: secondaryFont,
  },
  features: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
    fontFamily: secondaryFont,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  ctaButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: secondaryFont,
  },
});

export default CateringDetailsScreen;
