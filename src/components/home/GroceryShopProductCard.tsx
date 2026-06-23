import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {Colors} from '../../utils/colors';
import type {GroceryShopProductApi} from '../../services/groceryShop';

type Props = {
  product: GroceryShopProductApi;
  onPress?: () => void;
};

const formatPrice = (p: number | string) => {
  const n = typeof p === 'string' ? parseFloat(p) : p;
  if (Number.isNaN(n)) return '—';
  return `${n.toFixed(2).replace('.', ',')} €`;
};

const GroceryShopProductCard = ({product, onPress}: Props) => {
  const origin = [product.origin_country, product.origin_region].filter(Boolean).join(' · ');

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.85}>
      <View style={styles.imageColumn}>
        {product.image_url ? (
          <Image source={{uri: product.image_url}} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.placeholderIcon}>🛒</Text>
          </View>
        )}
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
    backgroundColor: Colors.white,
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.gray?.[100] ?? '#f3f4f6',
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  imageColumn: {
    width: 144,
    alignSelf: 'stretch',
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: Colors.gray?.[100] ?? '#f3f4f6',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 32,
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
    fontWeight: '700',
    color: Colors.primaryDark ?? Colors.primary,
  },
  badge: {
    backgroundColor: Colors.category.green.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  category: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 4,
  },
  restaurantLine: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 2,
  },
  origin: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 2,
  },
  price: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 6,
  },
  unit: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
});

export default GroceryShopProductCard;
