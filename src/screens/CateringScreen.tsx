import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import {Colors, Radius} from '../utils/colors';
import {fontButton, fontDisplay, fontDisplayMedium, fontHeading, fontUI} from '../utils/fonts';
import {getCateringFormulas, type CateringFormulaApi} from '../services/catering';
import {getAbsoluteImageUrl} from '../utils/api';

const namkeFallback = require('../assets/namke-fallback.png');

const CateringScreen = ({navigation}: any) => {
  const [formulas, setFormulas] = useState<CateringFormulaApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const list = await getCateringFormulas();
      setFormulas(list);
    } catch (_) {
      setFormulas([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  const featured = formulas.find(f => f.is_featured) ?? formulas[0];
  const rest = formulas.filter(f => f.id !== featured?.id);

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>Service traiteur</Text>
        <Text style={styles.heroTitle}>Vous êtes nombreux à table ?</Text>
        <Text style={styles.heroSubtitle}>
          {formulas.length} formule{formulas.length > 1 ? 's' : ''}, portées par des cuisiniers de votre quartier. Devis sous 24 h.
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }>
        {formulas.length === 0 ? (
          <Text style={styles.emptyText}>Aucune formule traiteur pour le moment.</Text>
        ) : (
          <>
            {featured && (
              <TouchableOpacity
                style={styles.featuredCard}
                onPress={() => navigation.navigate('CateringFormulaDetail', {slug: featured.slug})}
                activeOpacity={0.9}>
                <View style={styles.featuredImageWrap}>
                  <Image
                    source={featured.image_url ? {uri: getAbsoluteImageUrl(featured.image_url) ?? featured.image_url} : namkeFallback}
                    style={styles.featuredImage}
                    resizeMode="cover"
                  />
                  {featured.tagline && (
                    <View style={styles.featuredBadge}>
                      <Text style={styles.featuredBadgeText}>{featured.tagline}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.featuredBody}>
                  <Text style={styles.featuredName}>{featured.name}</Text>
                  {featured.description ? (
                    <Text style={styles.featuredDescription} numberOfLines={2}>{featured.description}</Text>
                  ) : null}
                  <Text style={styles.featuredMeta}>
                    {featured.min_guests}–{featured.max_guests} convives
                  </Text>
                  <View style={styles.featuredPriceRow}>
                    <Text style={styles.featuredPrice}>
                      {featured.is_custom_price ? 'Sur devis' : `${Number(featured.price_per_person).toFixed(0)} €`}
                    </Text>
                    {!featured.is_custom_price && <Text style={styles.featuredPriceUnit}>/ pers.</Text>}
                    <TouchableOpacity
                      style={styles.detailButton}
                      onPress={() => navigation.navigate('CateringFormulaDetail', {slug: featured.slug})}>
                      <Text style={styles.detailButtonText}>Détail</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {rest.map(f => (
              <TouchableOpacity
                key={f.id}
                style={styles.compactRow}
                onPress={() => navigation.navigate('CateringFormulaDetail', {slug: f.slug})}
                activeOpacity={0.85}>
                <Image
                  source={f.image_url ? {uri: getAbsoluteImageUrl(f.image_url) ?? f.image_url} : namkeFallback}
                  style={styles.compactImage}
                  resizeMode="cover"
                />
                <View style={styles.compactInfo}>
                  <Text style={styles.compactName} numberOfLines={1}>{f.name}</Text>
                  <Text style={styles.compactMeta} numberOfLines={1}>
                    {f.min_guests}–{f.max_guests} convives
                  </Text>
                </View>
                <View style={styles.compactPriceWrap}>
                  <Text style={styles.compactPrice}>
                    {f.is_custom_price ? 'Devis' : `${Number(f.price_per_person).toFixed(0)} €`}
                  </Text>
                  {!f.is_custom_price && <Text style={styles.compactPriceUnit}>/ pers.</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hero: {
    backgroundColor: Colors.darkGreen,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 22,
    gap: 6,
  },
  heroEyebrow: {
    fontSize: 11.5,
    fontFamily: fontHeading,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.mustard,
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: fontDisplay,
    color: Colors.cream,
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: fontUI,
    color: 'rgba(251,249,217,0.82)',
    lineHeight: 20,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 22,
    paddingBottom: 40,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: fontUI,
    color: Colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 40,
  },
  featuredCard: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: 14,
  },
  featuredImageWrap: {
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: 150,
    backgroundColor: Colors.gray[100],
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: Colors.mustard,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  featuredBadgeText: {
    fontSize: 10.5,
    fontFamily: fontHeading,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: Colors.namkeBlack,
  },
  featuredBody: {
    padding: 16,
    gap: 6,
  },
  featuredName: {
    fontSize: 21,
    fontFamily: fontDisplay,
    color: Colors.text,
  },
  featuredDescription: {
    fontSize: 13,
    fontFamily: fontUI,
    color: Colors.textLight,
    lineHeight: 19,
  },
  featuredMeta: {
    fontSize: 12.5,
    fontFamily: fontUI,
    color: Colors.textLight,
  },
  featuredPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 4,
  },
  featuredPrice: {
    fontSize: 20,
    fontFamily: fontDisplay,
    color: Colors.text,
  },
  featuredPriceUnit: {
    fontSize: 12,
    fontFamily: fontUI,
    color: Colors.textLight,
  },
  detailButton: {
    marginLeft: 'auto',
    backgroundColor: Colors.terracotta,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },
  detailButtonText: {
    fontSize: 13,
    fontFamily: fontButton,
    color: Colors.namkeWhite,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 12,
    marginBottom: 12,
  },
  compactImage: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: Colors.gray[100],
  },
  compactInfo: {
    flex: 1,
    gap: 3,
  },
  compactName: {
    fontSize: 16.5,
    fontFamily: fontDisplayMedium,
    color: Colors.text,
  },
  compactMeta: {
    fontSize: 12.5,
    fontFamily: fontUI,
    color: Colors.textLight,
  },
  compactPriceWrap: {
    alignItems: 'flex-end',
  },
  compactPrice: {
    fontSize: 18,
    fontFamily: fontDisplay,
    color: Colors.text,
  },
  compactPriceUnit: {
    fontSize: 11.5,
    fontFamily: fontUI,
    color: Colors.textLight,
  },
});

export default CateringScreen;
