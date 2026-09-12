import React, {useState} from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import IconWrapper from '../IconWrapper';
import {Colors, Radius} from '../../utils/colors';
import {fontButton, fontDisplayMedium, fontSub} from '../../utils/fonts';
import {getAbsoluteImageUrl, getJpegFallbackUrl} from '../../utils/api';

const namkeFallback = require('../../assets/namke-fallback.png');

interface DishCardCompactProps {
  name: string;
  price: number;
  rating?: number;
  restaurantName?: string;
  imageUrl?: string | null;
  onPress?: () => void;
  onAddPress?: () => void;
}

const DishCardCompact: React.FC<DishCardCompactProps> = ({
  name,
  price,
  rating,
  restaurantName,
  imageUrl,
  onPress,
  onAddPress,
}) => {
  const [imgError, setImgError] = useState(false);
  const [fallbackTried, setFallbackTried] = useState(false);
  const hasDbUrl = imageUrl != null && String(imageUrl).trim() !== '';
  const fallbackUrl = getJpegFallbackUrl(imageUrl);
  const uri =
    hasDbUrl && !imgError
      ? (fallbackTried ? fallbackUrl : getAbsoluteImageUrl(imageUrl)) ?? imageUrl
      : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {uri ? (
        <Image
          source={{uri}}
          style={styles.image}
          resizeMode="cover"
          onError={() => {
            if (!fallbackTried && fallbackUrl) {
              setFallbackTried(true);
              return;
            }
            setImgError(true);
          }}
        />
      ) : (
        <Image source={namkeFallback} style={styles.image} resizeMode="cover" />
      )}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {(restaurantName || rating != null) && (
          <Text style={styles.ratingText} numberOfLines={1}>
            {restaurantName ?? ''}
            {restaurantName && rating != null ? ' · ' : ''}
            {rating != null ? `★ ${rating}` : ''}
          </Text>
        )}
        <View style={styles.footer}>
          <Text style={styles.price}>{price.toFixed(2)} €</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={e => {
              e.stopPropagation?.();
              onAddPress?.();
            }}
            activeOpacity={0.8}>
            <IconWrapper name="add" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 218,
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: Colors.gray[100],
  },
  body: {
    padding: 12,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 5,
  },
  name: {
    fontSize: 18.5,
    fontFamily: fontDisplayMedium,
    color: Colors.text,
  },
  ratingText: {
    fontSize: 13.5,
    fontFamily: fontSub,
    color: Colors.textLight,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    fontSize: 18,
    fontFamily: fontButton,
    color: Colors.text,
  },
  addButton: {
    marginLeft: 'auto',
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    backgroundColor: Colors.terracotta,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DishCardCompact;
