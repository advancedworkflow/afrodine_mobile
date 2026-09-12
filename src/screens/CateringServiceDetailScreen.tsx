import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import TopBar from '../components/TopBar';
import IconWrapper from '../components/IconWrapper';
import {Colors, Radius, Shadows} from '../utils/colors';
import {fontButton, fontDisplay, fontDisplayMedium, fontHeading, fontUI} from '../utils/fonts';
import * as restaurantsApi from '../services/restaurants';
import {
  getCateringServicesByRestaurant,
  type CateringServiceApi,
} from '../services/catering';

const CateringServiceDetailScreen = ({navigation, route}: any) => {
  const restaurantId = route.params?.restaurantId ?? route.params?.restaurant_id;
  const [restaurant, setRestaurant] = useState<any>(null);
  const [services, setServices] = useState<CateringServiceApi[]>([]);
  const [dishes, setDishes] = useState<restaurantsApi.DishForList[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (isRefresh = false) => {
    if (!restaurantId) {
      setError('Restaurant manquant');
      setLoading(false);
      return;
    }
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const id = Number(restaurantId) || restaurantId;
      const [restData, servicesData, dishesData] = await Promise.all([
        restaurantsApi.getRestaurantById(id),
        getCateringServicesByRestaurant(id),
        restaurantsApi.getRestaurantDishes(id).catch(() => [] as restaurantsApi.DishForList[]),
      ]);
      if (restData) {
        setRestaurant({
          id: restData.id,
          name: restData.name,
          description: restData.description,
          address: restData.address,
          city: restData.city,
          phone: restData.phone,
          profile: restData.profile,
        });
      } else {
        setRestaurant(null);
      }
      setServices(Array.isArray(servicesData) ? servicesData : []);
      setDishes(Array.isArray(dishesData) ? dishesData : []);
    } catch (e: any) {
      setError(e?.message || 'Erreur chargement');
      setServices([]);
      setDishes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [restaurantId]);

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  const typeLabel = (t?: string) => {
    if (!t) return 'Traiteur';
    const map: Record<string, string> = {
      buffet: 'Buffet',
      cocktail: 'Cocktail',
      seated_dinner: 'Dîner assis',
      catering_delivery: 'Livraison traiteur',
      wedding: 'Mariage',
      enterprise: 'Entreprise',
    };
    return map[t] ?? t;
  };

  const commoditésLabels: { key: keyof CateringServiceApi; label: string }[] = [
    { key: 'delivery_available', label: 'Livraison' },
    { key: 'setup_available', label: 'Mise en place' },
    { key: 'staff_available', label: 'Personnel' },
    { key: 'equipment_rental', label: 'Location matériel' },
  ];

  const renderCommodités = (s: CateringServiceApi) => {
    const items = commoditésLabels
      .filter(({ key }) => s[key] === true)
      .map(({ label }) => label);
    if (items.length === 0) return null;
    return (
      <View style={styles.commoditesWrap}>
        <Text style={styles.commoditesTitle}>Commodités</Text>
        <View style={styles.commoditesRow}>
          {items.map((label) => (
            <View key={label} style={styles.commoditeChip}>
              <IconWrapper name="checkmark-circle" size={14} color={Colors.primary} />
              <Text style={styles.commoditeText}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <TopBar
          navigation={navigation}
          title="Détail traiteur"
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (error || !restaurant) {
    return (
      <View style={styles.container}>
        <TopBar
          navigation={navigation}
          title="Détail traiteur"
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.centered}>
          <IconWrapper name="alert-circle-outline" size={48} color={Colors.textLight} />
          <Text style={styles.errorText}>{error || 'Restaurant introuvable'}</Text>
        </View>
      </View>
    );
  }

  const hasOffers = services.length > 0;

  const heroImageUri =
    services.find((s) => s.image_url)?.image_url ||
    (restaurant as {profile?: {banner_image_url?: string}}).profile?.banner_image_url ||
    undefined;

  return (
    <View style={styles.container}>
      <TopBar
        navigation={navigation}
        title={restaurant.name}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }>
        {heroImageUri ? (
          <Image
            source={{uri: heroImageUri}}
            style={styles.heroImage}
            resizeMode="cover"
            accessibilityLabel="Visuel traiteur"
          />
        ) : null}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{restaurant.name}</Text>
          {restaurant.city ? (
            <Text style={styles.heroSubtitle}>{restaurant.city}</Text>
          ) : null}
          {restaurant.description ? (
            <Text style={styles.description} numberOfLines={4}>
              {restaurant.description}
            </Text>
          ) : null}
        </View>

        {!hasOffers ? (
          <View style={styles.empty}>
            <IconWrapper name="restaurant-outline" size={56} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>Aucune offre traiteur</Text>
            <Text style={styles.emptyText}>Ce restaurant n'a pas d'offres traiteur publiées.</Text>
          </View>
        ) : (
          <>
            {services.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Services traiteur</Text>
                {services.map((s) => (
                  <View key={s.id} style={styles.card}>
                    {s.image_url ? (
                      <Image
                        source={{uri: s.image_url}}
                        style={styles.cardCover}
                        resizeMode="cover"
                      />
                    ) : null}
                    <View style={styles.cardRow}>
                    <View style={styles.cardIcon}>
                      <IconWrapper name="restaurant-outline" size={24} color={Colors.primary} />
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={styles.cardName}>{s.service_name}</Text>
                      <Text style={styles.cardType}>{typeLabel(s.service_type)}</Text>
                      {s.service_description ? (
                        <Text style={styles.cardDesc} numberOfLines={3}>
                          {s.service_description}
                        </Text>
                      ) : null}
                      <View style={styles.cardMeta}>
                        <Text style={styles.cardPrice}>
                          À partir de {Number(s.base_price).toFixed(0)} €
                        </Text>
                        <Text style={styles.cardGuests}>
                          {s.min_guests}–{s.max_guests ?? '+'} pers.
                        </Text>
                      </View>
                      {renderCommodités(s)}
                    </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        )}

        {dishes.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Plats disponibles</Text>
            {dishes.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={styles.dishRow}
                onPress={() =>
                  navigation.navigate('DishDetails', {
                    dishId: Number(d.id),
                    restaurantId: restaurant.id,
                  })
                }
                activeOpacity={0.85}>
                {d.imageUrl ? (
                  <Image source={{uri: d.imageUrl}} style={styles.dishThumb} resizeMode="cover" />
                ) : (
                  <View style={[styles.dishThumb, styles.dishThumbPlaceholder]}>
                    <IconWrapper name="restaurant-outline" size={28} color={Colors.gray[400]} />
                  </View>
                )}
                <View style={styles.dishRowBody}>
                  <Text style={styles.dishRowName} numberOfLines={2}>
                    {d.name}
                  </Text>
                  <Text style={styles.dishRowPrice}>{Number(d.price).toFixed(2)} €</Text>
                </View>
                <IconWrapper name="chevron-forward" size={20} color={Colors.textLight} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() =>
            navigation.navigate('RestaurantDetails', {restaurantId: restaurant.id})
          }
          activeOpacity={0.8}>
          <Text style={styles.ctaButtonText}>Voir la fiche restaurant</Text>
          <IconWrapper name="arrow-forward-circle" size={24} color={Colors.white} />
        </TouchableOpacity>
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
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: fontUI,
    color: Colors.textLight,
    textAlign: 'center',
  },
  hero: {
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 24,
    color: Colors.text,
    fontFamily: fontDisplay,
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: fontUI,
    color: Colors.textLight,
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    fontFamily: fontUI,
    color: Colors.text,
    marginTop: 8,
    lineHeight: 20,
  },
  heroImage: {
    width: '100%',
    height: 200,
    borderRadius: Radius.lg,
    marginBottom: 16,
    backgroundColor: Colors.gray[100],
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    color: Colors.text,
    marginBottom: 12,
    fontFamily: fontDisplay,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: 10,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  cardCover: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.gray[100],
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: Colors.category?.green?.bg ?? Colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
  },
  cardName: {
    fontSize: 17,
    color: Colors.text,
    fontFamily: fontDisplayMedium,
  },
  cardType: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 2,
    fontFamily: fontHeading,
  },
  cardDesc: {
    fontSize: 13,
    fontFamily: fontUI,
    color: Colors.textLight,
    marginTop: 6,
    lineHeight: 18,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  cardPrice: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: fontHeading,
  },
  cardGuests: {
    fontSize: 13,
    fontFamily: fontUI,
    color: Colors.textLight,
  },
  commoditesWrap: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  commoditesTitle: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 6,
    fontFamily: fontHeading,
  },
  commoditesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  commoditeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cream,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.pill,
    gap: 4,
  },
  commoditeText: {
    fontSize: 12,
    color: Colors.text,
    fontFamily: fontUI,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    color: Colors.text,
    marginTop: 16,
    fontFamily: fontDisplayMedium,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fontUI,
    color: Colors.textLight,
    marginTop: 8,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.darkGreen,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: Radius.pill,
    gap: 8,
    marginTop: 8,
  },
  ctaButtonText: {
    color: Colors.cream,
    fontSize: 16,
    fontFamily: fontButton,
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 12,
  },
  dishThumb: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    backgroundColor: Colors.gray[100],
  },
  dishThumbPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dishRowBody: {
    flex: 1,
  },
  dishRowName: {
    fontSize: 15,
    color: Colors.text,
    fontFamily: fontDisplayMedium,
  },
  dishRowPrice: {
    fontSize: 14,
    color: Colors.primary,
    marginTop: 4,
    fontFamily: fontHeading,
  },
});

export default CateringServiceDetailScreen;
