import React, {useState} from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet, Platform} from 'react-native';
import {Colors, Radius, Shadows} from '../../utils/colors';
import {fontDisplayMedium, fontHeading, fontSub} from '../../utils/fonts';
import api, {getAbsoluteImageUrl, getJpegFallbackUrl} from '../../utils/api';
import IconWrapper from '../IconWrapper';

const namkeFallback = require('../../assets/namke-fallback.png');

interface RestaurantCardProps {
  id: string;
  name: string;
  cuisine?: string;
  priceRange?: string;
  rating?: number;
  deliveryTime?: string;
  deliveryFee?: string;
  imageUrl?: string | null;
  restaurantImageUrl?: string | null;
  hasCatering?: boolean;
  description?: string;
  isCertified?: boolean;
  onPress?: () => void;
}

function isUsableImageValue(url?: string | null): url is string {
  if (typeof url !== 'string') return false;
  const value = url.trim();
  if (!value) return false;
  if (value === 'null' || value === 'undefined') return false;
  return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/');
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({
  id,
  name,
  cuisine,
  priceRange,
  rating = 4.8,
  deliveryTime = '25-30 min',
  deliveryFee = '2.5€',
  imageUrl,
  restaurantImageUrl,
  description,
  isCertified,
  onPress,
}) => {
  const [resolvedCandidates, setResolvedCandidates] = useState<string[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fetchDetail = async () => {
          try {
            const {data} = await api.get(`/restaurants/public/${id}`);
            return data;
          } catch {
            const {data} = await api.get(`/restaurants/${id}/details`);
            return data;
          }
        };
        const data = await fetchDetail();
        const profile = data?.profile ?? {};
        const nextCandidates = [
          data?.restaurant_image_url,
          data?.card_image_url,
          data?.banner_image_url,
          data?.logo_url,
          profile?.restaurant_image_url,
          profile?.card_image_url,
          profile?.banner_image_url,
          profile?.logo_url,
        ].filter(isUsableImageValue);
        if (!cancelled) {
          setResolvedCandidates(nextCandidates);
        }
      } catch {
        // keep existing candidates from props if detail fetch fails
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, imageUrl, restaurantImageUrl]);

  const candidateUrls = React.useMemo(() => {
    const rawCandidates = [
      restaurantImageUrl,
      imageUrl,
      ...resolvedCandidates,
      `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=600&background=002b11&color=fff`,
    ].filter(
      isUsableImageValue,
    );
    const expanded = rawCandidates.flatMap((u) => {
      const absolute = getAbsoluteImageUrl(u) ?? u;
      const jpeg = getJpegFallbackUrl(u);
      return [absolute, jpeg].filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
    });
    // Dédupliquer en conservant l'ordre
    return [...new Set(expanded)];
  }, [restaurantImageUrl, imageUrl, resolvedCandidates]);
  const [imageIndex, setImageIndex] = useState(0);
  const uri = candidateUrls[imageIndex] ?? null;

  React.useEffect(() => {
    setImageIndex(0);
  }, [candidateUrls]);
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {uri ? (
        Platform.OS === 'web' ? (
          <View style={styles.image}>
            <img
              src={uri}
              alt={name}
              style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}}
              onError={() => setImageIndex((prev) => prev + 1)}
            />
          </View>
        ) : (
        <Image
          source={{uri}}
          style={styles.image}
          resizeMode="cover"
          onError={() => {
            setImageIndex((prev) => prev + 1);
          }}
        />
        )
      ) : (
        <Image source={namkeFallback} style={styles.image} resizeMode="cover" />
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {isCertified ? (
            <IconWrapper name="shield-checkmark" size={16} color={Colors.darkGreen} />
          ) : null}
          {rating != null && (
            <View style={styles.ratingPill}>
              <Text style={styles.rating}>★ {rating}</Text>
            </View>
          )}
        </View>
        <View style={styles.tagsRow}>
          {cuisine ? (
            <View style={styles.cuisineTag}>
              <Text style={styles.cuisineTagText} numberOfLines={1}>{cuisine}</Text>
            </View>
          ) : null}
          <Text style={styles.meta} numberOfLines={1}>
            {[deliveryTime, deliveryFee].filter(Boolean).join(' · ')}
          </Text>
        </View>
        {description ? (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: 14,
    ...Shadows.sm,
  },
  image: {
    width: '100%',
    height: 118,
  },
  content: {
    padding: 14,
    paddingTop: 12,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    flex: 1,
    fontSize: 20,
    fontFamily: fontDisplayMedium,
    color: Colors.text,
  },
  ratingPill: {
    marginLeft: 'auto',
    backgroundColor: Colors.mustard,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  rating: {
    fontSize: 13.5,
    fontFamily: fontHeading,
    color: Colors.darkGreen,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cuisineTag: {
    backgroundColor: 'rgba(239,76,35,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  cuisineTagText: {
    fontSize: 13,
    fontFamily: fontHeading,
    color: Colors.terracotta,
  },
  meta: {
    fontSize: 14,
    fontFamily: fontSub,
    color: Colors.textLight,
  },
  description: {
    fontSize: 13,
    fontFamily: fontSub,
    color: Colors.textLight,
    lineHeight: 18,
  },
});

export default RestaurantCard;

