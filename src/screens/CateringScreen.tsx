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
import TopBar from '../components/TopBar';
import IconWrapper from '../components/IconWrapper';
import {Colors} from '../utils/colors';
import {secondaryFont} from '../utils/fonts';
import {getCateringServices} from '../services/catering';
import * as restaurantsApi from '../services/restaurants';
import {getAbsoluteImageUrl} from '../utils/api';

export interface RestaurantWithCatering {
  restaurantId: string;
  name: string;
  city?: string;
  description?: string;
  imageUrl?: string;
  offerCount: number;
}

const CateringScreen = ({navigation}: any) => {
  const [restaurants, setRestaurants] = useState<RestaurantWithCatering[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (getIsCancelled?: () => boolean) => {
    try {
      const services = await getCateringServices();
      if (getIsCancelled?.()) return;
      const byRestaurant = new Map<string, number>();
      services.forEach((s) => {
        const id = String(s.restaurantId);
        byRestaurant.set(id, (byRestaurant.get(id) ?? 0) + 1);
      });
      const ids = Array.from(byRestaurant.keys());
      const list: RestaurantWithCatering[] = [];
      for (const id of ids) {
        if (getIsCancelled?.()) return;
        try {
          const rest = await restaurantsApi.getRestaurantById(Number(id) || id);
          if (!rest) continue;
          const imageUrl = rest.profile?.banner_image_url || rest.profile?.logo_url;
          list.push({
            restaurantId: id,
            name: rest.name,
            city: rest.city,
            description: rest.description,
            imageUrl: imageUrl || undefined,
            offerCount: byRestaurant.get(id) ?? 0,
          });
        } catch (_) {
          list.push({
            restaurantId: id,
            name: `Restaurant #${id}`,
            offerCount: byRestaurant.get(id) ?? 0,
          });
        }
      }
      if (!getIsCancelled?.()) setRestaurants(list);
    } catch (e) {
      if (!getIsCancelled?.()) setRestaurants([]);
    } finally {
      if (!getIsCancelled?.()) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    load(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar navigation={navigation} title="Service traiteur" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar navigation={navigation} title="Service traiteur" showBackButton onBackPress={() => navigation.goBack()} />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }>
        <Text style={styles.intro}>
          Restaurants proposant un service traiteur : mariages, séminaires, anniversaires.
        </Text>
        {restaurants.length === 0 ? (
          <View style={styles.empty}>
            <IconWrapper name="restaurant-outline" size={56} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>Aucun restaurant traiteur</Text>
            <Text style={styles.emptyText}>Les restaurants avec offre traiteur apparaîtront ici.</Text>
          </View>
        ) : (
          restaurants.map((r) => (
            <TouchableOpacity
              key={r.restaurantId}
              style={styles.card}
              onPress={() => navigation.navigate('CateringServiceDetail', {restaurantId: r.restaurantId})}
              activeOpacity={0.8}>
              <View style={styles.cardImageWrap}>
                {r.imageUrl ? (
                  <Image
                    source={{uri: getAbsoluteImageUrl(r.imageUrl) ?? r.imageUrl}}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                    <IconWrapper name="restaurant-outline" size={32} color={Colors.textLight} />
                  </View>
                )}
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>{r.name}</Text>
                {r.city ? <Text style={styles.cardCity}>{r.city}</Text> : null}
                <Text style={styles.cardOffers}>
                  {r.offerCount} offre{r.offerCount > 1 ? 's' : ''} traiteur
                </Text>
              </View>
              <IconWrapper name="chevron-forward-outline" size={22} color={Colors.textLight} />
            </TouchableOpacity>
          ))
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  intro: {
    fontSize: 15,
    color: Colors.textLight,
    marginBottom: 20,
    lineHeight: 22,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 0,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardImageWrap: {
    width: 88,
    height: 88,
  },
  cardImage: {
    width: 88,
    height: 88,
  },
  cardImagePlaceholder: {
    backgroundColor: Colors.category.green.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    flex: 1,
    padding: 14,
    marginRight: 8,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primaryDark,
    fontFamily: secondaryFont,
  },
  cardCity: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 2,
  },
  cardOffers: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
  },
});

export default CateringScreen;
