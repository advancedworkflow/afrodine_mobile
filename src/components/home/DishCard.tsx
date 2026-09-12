import React, {useState} from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import IconWrapper from '../IconWrapper';
import {Colors, Radius, Shadows} from '../../utils/colors';
import {fontDisplayMedium, fontHeading, fontUI} from '../../utils/fonts';
import {getAbsoluteImageUrl, getJpegFallbackUrl} from '../../utils/api';

const namkeFallback = require('../../assets/namke-fallback.png');

interface DishCardProps {
  id: string;
  name: string;
  description?: string;
  price: number;
  rating?: number;
  deliveryTime?: string;
  imageUrl?: string | null;
  isFavorite?: boolean;
  onPress?: () => void;
  onFavoritePress?: () => void;
  onAddPress?: () => void;
}

const DishCard: React.FC<DishCardProps> = ({
  name,
  description,
  price,
  rating = 4.8,
  deliveryTime = '15-20 min',
  imageUrl,
  isFavorite = false,
  onPress,
  onFavoritePress,
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

  const handleAddPress = () => {
    onAddPress?.();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.contentTouchable} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.content}>
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
          <View style={styles.details}>
            <View style={styles.header}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              <TouchableOpacity onPress={onFavoritePress} style={styles.favoriteButton}>
                <IconWrapper
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isFavorite ? Colors.error : Colors.primaryLight}
                />
              </TouchableOpacity>
            </View>
            {description && (
              <Text style={styles.description} numberOfLines={2}>
                {description}
              </Text>
            )}
            <View style={styles.meta}>
              <View style={styles.rating}>
                <IconWrapper name="star" size={12} color={Colors.warning} />
                <Text style={styles.ratingText}>{rating}</Text>
              </View>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.deliveryTime}>{deliveryTime}</Text>
            </View>
            <View style={styles.footer}>
              <Text style={styles.price}>{price.toFixed(2)}€</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddPress}
                activeOpacity={0.8}>
                <IconWrapper name="add-outline" size={16} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 12,
    marginBottom: 12,
    ...Shadows.sm,
  },
  contentTouchable: {
    flex: 1,
  },
  content: {
    flexDirection: 'row',
  },
  image: {
    width: 96,
    height: 96,
    borderRadius: Radius.md,
    marginRight: 12,
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontFamily: fontDisplayMedium,
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  favoriteButton: {
    padding: 4,
  },
  description: {
    fontSize: 12,
    fontFamily: fontUI,
    color: Colors.textLight,
    marginBottom: 8,
    lineHeight: 16,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontFamily: fontHeading,
    color: Colors.text,
    marginLeft: 4,
  },
  separator: {
    fontSize: 12,
    color: Colors.gray[400],
    marginHorizontal: 8,
  },
  deliveryTime: {
    fontSize: 12,
    fontFamily: fontUI,
    color: Colors.textLight,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontFamily: fontHeading,
    color: Colors.primary,
  },
  addButton: {
    width: 32,
    height: 32,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DishCard;

