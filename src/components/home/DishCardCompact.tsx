import React, {useState} from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import IconWrapper from '../IconWrapper';
import {Colors, Radius, Shadows} from '../../utils/colors';
import {fontButton, fontDisplayMedium, fontSub} from '../../utils/fonts';
import {getAbsoluteImageUrl, getJpegFallbackUrl} from '../../utils/api';

const namkeFallback = require('../../assets/namke-fallback.png');

interface DishCardCompactProps {
  name: string;
  description?: string;
  price: number;
  rating?: number;
  restaurantName?: string;
  imageUrl?: string | null;
  isPromo?: boolean;
  onPress?: () => void;
  onAddPress?: () => void;
}

const DishCardCompact: React.FC<DishCardCompactProps> = ({
  name,
  description,
  price,
  rating,
  restaurantName,
  imageUrl,
  isPromo,
  onPress,
  onAddPress,
}) => {
  const {t} = useTranslation();
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
      <View style={styles.cardInner}>
      <View>
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
        {isPromo ? (
          <View style={styles.promoBadge}>
            <Text style={styles.promoBadgeText}>{t('dishCard.promoBadge')}</Text>
          </View>
        ) : null}
      </View>
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
        {description ? (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
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
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 250,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    ...Shadows.md,
  },
  // Coins découpés ici et non sur card : overflow hidden masque l'ombre sur iOS
  cardInner: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.gray[100],
  },
  promoBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.terracotta,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  promoBadgeText: {
    fontSize: 10.5,
    fontFamily: fontButton,
    color: Colors.white,
    letterSpacing: 0.3,
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
  description: {
    fontSize: 12.5,
    fontFamily: fontSub,
    color: Colors.textLight,
    lineHeight: 17,
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
