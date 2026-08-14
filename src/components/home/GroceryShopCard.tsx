import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {Colors} from '../../utils/colors';
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
  image: {
    width: 90,
    height: 90,
    backgroundColor: Colors.gray?.[100] ?? '#f3f4f6',
  },
  body: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryDark ?? Colors.primary,
  },
  description: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 4,
  },
});

export default GroceryShopCard;
