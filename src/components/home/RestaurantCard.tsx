import React, {useState} from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet, Platform} from 'react-native';
import IconWrapper from '../IconWrapper';
import {Colors} from '../../utils/colors';
import api, {getAbsoluteImageUrl, getJpegFallbackUrl} from '../../utils/api';

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
        <View style={[styles.image, styles.imagePlaceholder]}>
          <IconWrapper name="restaurant-outline" size={48} color={Colors.textLight} />
        </View>
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.info}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.cuisine}>
              {cuisine} • {priceRange}
            </Text>
          </View>
          <View style={styles.ratingBadge}>
            <IconWrapper name="star" size={12} color={Colors.warning} />
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        </View>
        <View style={styles.footer}>
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <IconWrapper name="time-outline" size={12} color={Colors.textLight} />
              <Text style={styles.metaText}>{deliveryTime}</Text>
            </View>
            <View style={styles.metaItem}>
              <IconWrapper name="bicycle-outline" size={12} color={Colors.textLight} />
              <Text style={styles.metaText}>{deliveryFee}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  image: {
    width: '100%',
    height: 128,
  },
  cateringBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  cateringBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
  },
  imagePlaceholder: {
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  cuisine: {
    fontSize: 12,
    color: Colors.textLight,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight + '1A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.primary,
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textLight,
    marginLeft: 4,
  },
});

export default RestaurantCard;

