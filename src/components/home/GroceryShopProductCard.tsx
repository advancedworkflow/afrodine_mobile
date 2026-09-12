import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {Colors, Radius, Shadows} from '../../utils/colors';
import {fontDisplayMedium, fontHeading, fontUI} from '../../utils/fonts';
import type {GroceryShopProductApi} from '../../services/groceryShop';

const namkeFallback = require('../../assets/namke-fallback.png');

type Props = {
  product: GroceryShopProductApi;
  onPress?: () => void;
  /** Mise en page verticale compacte, adaptée à un carrousel horizontal. */
  compact?: boolean;
};

const formatPrice = (p: number | string) => {
  const n = typeof p === 'string' ? parseFloat(p) : p;
  if (Number.isNaN(n)) return '—';
  return `${n.toFixed(2).replace('.', ',')} €`;
};

const GroceryShopProductCard = ({product, onPress, compact = false}: Props) => {
  const origin = [product.origin_country, product.origin_region].filter(Boolean).join(' · ');
  const imageSource = product.image_url ? {uri: product.image_url} : namkeFallback;

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.85}>
        <View style={styles.compactImageWrap}>
          <Image source={imageSource} style={styles.compactImage} resizeMode="cover" />
          {product.is_african ? (
            <View style={styles.compactBadge}>
              <Text style={styles.badgeText}>Afrique</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.compactBody}>
          <Text style={styles.compactName} numberOfLines={2}>
            {product.name}
          </Text>
          {product.category ? (
            <Text style={styles.category} numberOfLines={1}>
              {product.category}
            </Text>
          ) : null}
          <Text style={styles.compactPrice}>{formatPrice(product.price)}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.85}>
      <View style={styles.imageColumn}>
        <Image source={imageSource} style={styles.image} resizeMode="cover" />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          {product.is_african ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Afrique</Text>
            </View>
          ) : null}
        </View>
        {product.category ? (
          <Text style={styles.category} numberOfLines={1}>
            {product.category}
          </Text>
        ) : null}
        {product.restaurant_name ? (
          <Text style={styles.restaurantLine} numberOfLines={1}>
            Proposé par {product.restaurant_name}
          </Text>
        ) : null}
        {origin ? (
          <Text style={styles.origin} numberOfLines={2}>
            {origin}
          </Text>
        ) : null}
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        {product.unit ? (
          <Text style={styles.unit}>Unité : {product.unit}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: 12,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  imageColumn: {
    width: 144,
    alignSelf: 'stretch',
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: Colors.gray[100],
  },
  body: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontFamily: fontDisplayMedium,
    color: Colors.text,
  },
  badge: {
    backgroundColor: Colors.category.green.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: fontHeading,
    color: Colors.primary,
  },
  category: {
    fontSize: 13,
    fontFamily: fontUI,
    color: Colors.textLight,
    marginTop: 4,
  },
  restaurantLine: {
    fontSize: 13,
    fontFamily: fontUI,
    color: Colors.textLight,
    marginTop: 2,
  },
  origin: {
    fontSize: 13,
    fontFamily: fontUI,
    color: Colors.textLight,
    marginTop: 2,
  },
  price: {
    fontSize: 17,
    fontFamily: fontHeading,
    color: Colors.primary,
    marginTop: 6,
  },
  unit: {
    fontSize: 12,
    fontFamily: fontUI,
    color: Colors.textLight,
    marginTop: 2,
  },
  // Variante compacte (carrousel)
  compactCard: {
    width: 152,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  compactImageWrap: {
    width: '100%',
    height: 110,
  },
  compactImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.gray[100],
  },
  compactBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.category.green.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  compactBody: {
    padding: 10,
  },
  compactName: {
    fontSize: 13,
    fontFamily: fontDisplayMedium,
    color: Colors.text,
    minHeight: 34,
  },
  compactPrice: {
    fontSize: 15,
    fontFamily: fontHeading,
    color: Colors.primary,
    marginTop: 6,
  },
});

export default GroceryShopProductCard;
