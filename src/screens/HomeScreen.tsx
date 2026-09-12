import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import IconWrapper from '../components/IconWrapper';
import LocationSection from '../components/home/LocationSection';
import SearchBar, {type SearchSuggestion} from '../components/home/SearchBar';
import CategoryGrid, {mapApiCategoriesToUi, type Category} from '../components/home/CategoryGrid';
import DishCardCompact from '../components/home/DishCardCompact';
import SectionHeader from '../components/home/SectionHeader';
import PromoBanner from '../components/home/PromoBanner';
import GroceryShopProductCard from '../components/home/GroceryShopProductCard';
import {Colors, Radius} from '../utils/colors';
import {fontDisplay, fontHeading, fontUI} from '../utils/fonts';
import {useSearch} from '../contexts/SearchContext';
import {useAuth} from '../contexts/AuthContext';
import {useCart} from '../contexts/CartContext';
import * as dishesApi from '../services/dishes';
import * as restaurantsApi from '../services/restaurants';
import * as categoriesApi from '../services/categories';
import * as promotionsApi from '../services/promotions';
import * as menusApi from '../services/menus';
import * as groceryShopApi from '../services/groceryShop';
import {getClientProfile} from '../services/clientProfile';
import {formatAxiosError} from '../utils/formatApiError';
import {getAbsoluteImageUrl} from '../utils/api';

const namkeFallback = require('../assets/namke-fallback.png');

const HomeScreen = ({navigation}: any) => {
  const {isAuthenticated, isRestaurant} = useAuth();
  const {setSearchQuery, setSearchResults, setIsSearching} = useSearch();
  const {addItem} = useCart();
  const stackNav = navigation.getParent()?.getParent() ?? navigation.getParent() ?? navigation;

  const [popularDishes, setPopularDishes] = useState<dishesApi.DishForList[]>([]);
  const [recommendedDishes, setRecommendedDishes] = useState<dishesApi.DishForList[]>([]);
  const [trendingMenus, setTrendingMenus] = useState<menusApi.MenuApi[]>([]);
  const [promos, setPromos] = useState<promotionsApi.PromotionForList[]>([]);
  const [groceryProducts, setGroceryProducts] = useState<groceryShopApi.GroceryShopProductApi[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryDishes, setCategoryDishes] = useState<dishesApi.DishForList[]>([]);
  const [categoryDishesLoading, setCategoryDishesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('Adresse non renseignée');
  const [liveSuggestions, setLiveSuggestions] = useState<SearchSuggestion[]>([]);
  const liveRequestIdRef = useRef(0);
  const liveSuggestionsCacheRef = useRef<Map<string, SearchSuggestion[]>>(new Map());

  useEffect(() => {
    let cancelled = false;

    const refreshAddress = async () => {
      if (!isAuthenticated || isRestaurant) {
        if (!cancelled) setDeliveryAddress('Adresse non renseignée');
        return;
      }
      try {
        const profile = await getClientProfile();
        if (cancelled) return;
        const nextAddress = profile?.address?.trim();
        setDeliveryAddress(nextAddress && nextAddress.length > 0 ? nextAddress : 'Adresse non renseignée');
      } catch {
        if (!cancelled) setDeliveryAddress('Adresse non renseignée');
      }
    };

    refreshAddress();
    const unsubscribe = navigation.addListener?.('focus', refreshAddress);

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [isAuthenticated, isRestaurant, navigation]);

  const loadData = useCallback(async (isRefresh = false, getIsCancelled?: () => boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [dishesRes, categoriesRes, recommendedRes, menusRes, promosRes, groceryProductsRes] = await Promise.all([
        dishesApi.getDishes({limit: 12}),
        categoriesApi.getCategories(),
        dishesApi.getDishes({limit: 12, skip: 12}).catch(() => []),
        menusApi.getMenus().catch(() => []),
        promotionsApi.getActivePromotions({limit: 6}).catch(() => []),
        groceryShopApi.getGroceryShopProducts({limit: 12}).catch(() => []),
      ]);
      if (getIsCancelled?.()) return;

      setPopularDishes(dishesRes);
      setCategories(mapApiCategoriesToUi(categoriesRes));
      setRecommendedDishes(
        [...recommendedRes].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 6),
      );
      setTrendingMenus(menusRes.slice(0, 6));
      setPromos(promosRes);
      setGroceryProducts(groceryProductsRes);
    } catch (e: any) {
      if (getIsCancelled?.()) return;
      setError(formatAxiosError(e, 'Erreur de chargement'));
      setPopularDishes([]);
      setCategories([]);
      setRecommendedDishes([]);
      setTrendingMenus([]);
      setPromos([]);
      setGroceryProducts([]);
    } finally {
      if (!getIsCancelled?.()) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadData(false, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const handleCategoryPress = useCallback(async (category: Category) => {
    if (selectedCategoryId === category.id) {
      setSelectedCategoryId(null);
      setCategoryDishes([]);
      return;
    }
    setSelectedCategoryId(category.id);
    setCategoryDishesLoading(true);
    try {
      const dishes = await dishesApi.getDishesByCategory(category.id, {limit: 12});
      setCategoryDishes(dishes);
    } catch {
      setCategoryDishes([]);
    } finally {
      setCategoryDishesLoading(false);
    }
  }, [selectedCategoryId]);

  const handleAddDishToCart = (dish: dishesApi.DishForList) => {
    addItem({
      dishId: Number(dish.id),
      restaurantId: dish.restaurantId ? Number(dish.restaurantId) : undefined,
      name: dish.name,
      price: dish.price,
      quantity: 1,
      imageUrl: dish.imageUrl,
    });
  };

  const handleAddMenuToCart = (menu: menusApi.MenuApi) => {
    addItem({
      dishId: 0,
      menuId: menu.id,
      restaurantId: menu.restaurant_id ?? undefined,
      name: menu.name,
      price: menu.price ?? 0,
      quantity: 1,
      imageUrl: menu.image_url ?? undefined,
    });
  };

  const displayedDishes = selectedCategoryId ? categoryDishes : popularDishes;
  const featuredDishes = displayedDishes.slice(0, 4);
  const nearbyDishes = displayedDishes.slice(4, 8);

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <LocationSection
          address={deliveryAddress}
          onPress={() => {
            if (!isAuthenticated || isRestaurant) return;
            navigation.navigate('EditProfile');
          }}
          onNotificationsPress={() => {
            if (isAuthenticated) {
              navigation.navigate('Notifications');
            } else {
              navigation.navigate('Login');
            }
          }}
        />
        <SearchBar
          placeholder="Un plat, une cuisine, un voisin…"
          onSearch={async query => {
            if (query.length > 0) {
              setIsSearching(true);
              try {
                const [dishesRes, restaurantsRes] = await Promise.all([
                  dishesApi.searchDishes(query),
                  restaurantsApi.searchRestaurants(query),
                ]);
                setSearchResults({dishes: dishesRes, restaurants: restaurantsRes});
                navigation.navigate('SearchResults');
              } catch (e) {
                setSearchResults({dishes: [], restaurants: []});
              } finally {
                setIsSearching(false);
              }
            }
          }}
          onLiveQueryChange={async query => {
            const q = query.trim();
            if (q.length < 2) {
              setLiveSuggestions([]);
              return;
            }

            const normalizedQuery = q.toLowerCase();
            const cached = liveSuggestionsCacheRef.current.get(normalizedQuery);
            if (cached) {
              setLiveSuggestions(cached);
              return;
            }

            const requestId = ++liveRequestIdRef.current;
            try {
              const [dishesRes, restaurantsRes] = await Promise.all([
                dishesApi.searchDishes(q),
                restaurantsApi.searchRestaurants(q),
              ]);
              if (requestId !== liveRequestIdRef.current) return;

              const dishSuggestions: SearchSuggestion[] = dishesRes.slice(0, 4).map(d => ({
                id: d.id,
                title: d.name,
                subtitle: d.restaurantName || undefined,
                type: 'dish',
                restaurantId: d.restaurantId,
              }));
              const restaurantSuggestions: SearchSuggestion[] = restaurantsRes.slice(0, 4).map(r => ({
                id: r.id,
                title: r.name,
                subtitle: r.cuisine || undefined,
                type: 'restaurant',
              }));
              const nextSuggestions = [...dishSuggestions, ...restaurantSuggestions].slice(0, 7);
              liveSuggestionsCacheRef.current.set(normalizedQuery, nextSuggestions);
              if (liveSuggestionsCacheRef.current.size > 20) {
                const firstKey = liveSuggestionsCacheRef.current.keys().next().value;
                if (firstKey) liveSuggestionsCacheRef.current.delete(firstKey);
              }
              setLiveSuggestions(nextSuggestions);
            } catch {
              if (requestId !== liveRequestIdRef.current) return;
              setLiveSuggestions([]);
            }
          }}
          suggestions={liveSuggestions}
          onSuggestionPress={(item) => {
            if (item.type === 'dish') {
              navigation.navigate('DishDetails', {
                dishId: item.id,
                restaurantId: item.restaurantId,
              });
              return;
            }
            navigation.navigate('RestaurantDetails', {restaurantId: item.id});
          }}
          onPress={() => navigation.navigate('SearchResults')}
          pillColor={Colors.background}
        />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={[Colors.primary]} />
        }
        keyboardShouldPersistTaps="handled">
        <View style={styles.categoryRow}>
          <CategoryGrid
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onCategoryPress={handleCategoryPress}
          />
        </View>

        {loading ? (
          <View style={styles.loadingSection}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorSection}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadData()}>
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <SectionHeader
                title={
                  selectedCategoryId
                    ? categories.find(c => c.id === selectedCategoryId)?.name ?? 'Marmites du jour'
                    : 'Marmites du jour'
                }
                seeAllText="Tout voir"
                onSeeAllPress={() => stackNav.navigate('PopularDishes')}
              />
              {selectedCategoryId && categoryDishesLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : featuredDishes.length === 0 ? (
                <Text style={styles.emptyText}>Aucun plat pour le moment</Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScroll}>
                  {featuredDishes.map(dish => (
                    <View key={dish.id} style={styles.dishCardWrap}>
                      <DishCardCompact
                        name={dish.name}
                        price={dish.price}
                        rating={dish.rating}
                        restaurantName={dish.restaurantName}
                        imageUrl={dish.imageUrl}
                        onPress={() => navigation.navigate('DishDetails', {dishId: dish.id, restaurantId: dish.restaurantId})}
                        onAddPress={() => handleAddDishToCart(dish)}
                      />
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            {groceryProducts.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  title="Épicerie"
                  seeAllText="Tout voir"
                  onSeeAllPress={() => stackNav.navigate('GroceryShops')}
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScroll}>
                  {groceryProducts.map(product => (
                    <View key={`${product.source ?? 'catalog'}-${product.id}`} style={styles.dishCardWrap}>
                      <GroceryShopProductCard
                        product={product}
                        compact
                        onPress={() => stackNav.navigate('GroceryProductDetail', {productId: product.id})}
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {(nearbyDishes.length > 0 || promos.length > 0) && (
              <View style={styles.section}>
                <SectionHeader title="Près de vous" />
                {nearbyDishes.length > 0 && (
                  <View style={styles.nearbyList}>
                    {nearbyDishes.map(dish => (
                      <TouchableOpacity
                        key={dish.id}
                        style={styles.nearbyRow}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('DishDetails', {dishId: dish.id, restaurantId: dish.restaurantId})}>
                        <Image
                          source={dish.imageUrl ? {uri: getAbsoluteImageUrl(dish.imageUrl) ?? dish.imageUrl} : namkeFallback}
                          style={styles.nearbyImage}
                          resizeMode="cover"
                        />
                        <View style={styles.nearbyInfo}>
                          <Text style={styles.nearbyName} numberOfLines={1}>{dish.name}</Text>
                          <Text style={styles.nearbyMeta} numberOfLines={1}>
                            {dish.restaurantName ?? 'namke'}
                            {dish.rating ? ` · ★ ${dish.rating}` : ''}
                          </Text>
                          {dish.description ? (
                            <Text style={styles.nearbyDescription} numberOfLines={2}>{dish.description}</Text>
                          ) : null}
                        </View>
                        <Text style={styles.nearbyPrice}>{dish.price.toFixed(2)} €</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {promos.length > 0 && (
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.promoScroll}>
                    {promos.map(promo => (
                      <View key={`promo-${promo.id}`} style={styles.promoWrap}>
                        <PromoBanner
                          title={promo.title}
                          subtitle={promo.subtitle}
                          buttonText={promo.buttonText}
                          imageUrl={promo.imageUrl}
                          backgroundColor={promo.backgroundColor}
                          discountLabel={promo.discountLabel}
                          onPress={() => navigation.navigate('RestaurantDetails', {restaurantId: promo.restaurantId})}
                        />
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            {(featuredDishes.length > 0 || trendingMenus.length > 0) && (
              <View style={styles.section}>
                <SectionHeader title="En vogue" />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScroll}>
                  {popularDishes.slice(-4).map(dish => (
                    <View key={`trend-dish-${dish.id}`} style={styles.dishCardWrap}>
                      <DishCardCompact
                        name={dish.name}
                        price={dish.price}
                        rating={dish.rating}
                        restaurantName={dish.restaurantName}
                        imageUrl={dish.imageUrl}
                        onPress={() => navigation.navigate('DishDetails', {dishId: dish.id, restaurantId: dish.restaurantId})}
                        onAddPress={() => handleAddDishToCart(dish)}
                      />
                    </View>
                  ))}
                  {trendingMenus.map(menu => (
                    <View key={`trend-menu-${menu.id}`} style={styles.dishCardWrap}>
                      <DishCardCompact
                        name={menu.name}
                        price={menu.price ?? 0}
                        imageUrl={menu.image_url}
                        onPress={() => navigation.navigate('RestaurantDetails', {restaurantId: menu.restaurant_id})}
                        onAddPress={() => handleAddMenuToCart(menu)}
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {recommendedDishes.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="Recommandé pour vous" />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScroll}>
                  {recommendedDishes.map(dish => (
                    <View key={`reco-${dish.id}`} style={styles.dishCardWrap}>
                      <DishCardCompact
                        name={dish.name}
                        price={dish.price}
                        rating={dish.rating}
                        restaurantName={dish.restaurantName}
                        imageUrl={dish.imageUrl}
                        onPress={() => navigation.navigate('DishDetails', {dishId: dish.id, restaurantId: dish.restaurantId})}
                        onAddPress={() => handleAddDishToCart(dish)}
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerCard: {
    backgroundColor: Colors.surface,
    paddingBottom: 4,
  },
  categoryRow: {
    paddingVertical: 16,
  },
  section: {
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  loadingSection: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textLight,
  },
  errorSection: {
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
  },
  retryText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: fontUI,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: fontUI,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  horizontalScroll: {
    paddingRight: 22,
  },
  promoScroll: {
    paddingRight: 22,
    gap: 14,
    marginTop: 12,
  },
  promoWrap: {
    width: 320,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  dishCardWrap: {
    marginRight: 14,
  },
  nearbyList: {
    gap: 12,
  },
  nearbyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 12,
  },
  nearbyImage: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
  },
  nearbyInfo: {
    flex: 1,
    gap: 3,
  },
  nearbyName: {
    fontSize: 16.5,
    fontFamily: fontDisplay,
    color: Colors.text,
    alignSelf: 'flex-start',
    backgroundColor: Colors.mustard,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  nearbyMeta: {
    fontSize: 13,
    fontFamily: fontHeading,
    color: Colors.textLight,
  },
  nearbyDescription: {
    fontSize: 12.5,
    fontFamily: fontHeading,
    color: Colors.textLight,
    lineHeight: 16,
  },
  nearbyPrice: {
    fontSize: 16,
    fontFamily: fontDisplay,
    color: Colors.text,
  },
});

export default HomeScreen;
