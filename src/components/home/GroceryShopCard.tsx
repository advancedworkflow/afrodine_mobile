import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {Colors, Radius, Shadows} from '../../utils/colors';
import {fontDisplayMedium, fontUI} from '../../utils/fonts';
import type {GroceryShopApi} from '../../services/groceryShop';
import {getAbsoluteImageUrl} from '../../utils/api';

const namkeFallback = require('../../assets/namke-fallback.png');

type Props = {
  shop: GroceryShopApi;
  onPress?: () => void;
};

const GroceryShopCard = ({shop, onPress}: Props) => {
  const rawUrl = shop.image_url || shop.banner_url || null;
  const absoluteUrl = rawUrl ? getAbsoluteImageUrl(rawUrl) ?? rawUrl : null;
  const imageSource = absoluteUrl ? {uri: absoluteUrl} : namkeFallback;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Image source={imageSource} style={styles.image} resizeMode="cover" />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {shop.name}
        </Text>
        {shop.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {shop.description}
          </Text>
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
  image: {
    width: 90,
    height: 90,
    backgroundColor: Colors.gray[100],
  },
  body: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontFamily: fontDisplayMedium,
    color: Colors.text,
  },
  description: {
    fontSize: 13,
    fontFamily: fontUI,
    color: Colors.textLight,
    marginTop: 4,
  },
});

export default GroceryShopCard;
