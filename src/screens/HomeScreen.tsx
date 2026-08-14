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
  Linking,
  Dimensions,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
import TopBar from '../components/TopBar';
import LocationSection from '../components/home/LocationSection';
import SearchBar, {type SearchSuggestion} from '../components/home/SearchBar';
import FilterModal, {type FilterOptions, type SelectedFilters} from '../components/FilterModal';
import PromoBanner from '../components/home/PromoBanner';
import CategoryGrid, {mapApiCategoriesToUi, type Category} from '../components/home/CategoryGrid';
import DishCard from '../components/home/DishCard';
import RestaurantCard from '../components/home/RestaurantCard';
import SpecialOfferCard from '../components/home/SpecialOfferCard';
import SectionHeader from '../components/home/SectionHeader';
import {Colors} from '../utils/colors';
import IconWrapper from '../components/IconWrapper';
import {useSearch} from '../contexts/SearchContext';
import {useAuth} from '../contexts/AuthContext';
import {useCart} from '../contexts/CartContext';
import * as restaurantsApi from '../services/restaurants';
import * as dishesApi from '../services/dishes';
import * as categoriesApi from '../services/categories';
import * as promotionsApi from '../services/promotions';
import * as cateringApi from '../services/catering';
import * as groceryShopApi from '../services/groceryShop';
import {getMenuById, type MenuApi} from '../services/menus';
import {getClientProfile} from '../services/clientProfile';
import {formatAxiosError} from '../utils/formatApiError';
import {getAbsoluteImageUrl} from '../utils/api';
import GroceryShopProductCard from '../components/home/GroceryShopProductCard';
import GroceryShopCard from '../components/home/GroceryShopCard';
import MenuPromotionModal from '../components/home/MenuPromotionModal';

const namkeFallback = require('../assets/namke-fallback.png');

type HomeTab = 'accueil' | 'groceryShop';

const defaultFilterOptions: FilterOptions = {
  cities: [],
  cuisine_types: [],
  diet_types: [],
  price_ranges: [],
  delivery_ranges: [],
  rating_options: [],
};

const WEB_APP_BASE =
  (typeof process !== 'undefined' && process.env?.REACT_APP_WEB_APP_URL) ||
  'http://127.0.0.1:3001';

const extractCityFromAddress = (address?: string | null): string | undefined => {
  if (!address) return undefined;
  const parts = address
    .split(',')
    .map(p => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return undefined;
  return parts[parts.length - 1];
};

const HomeScreen = ({navigation}: any) => {
  const {isAuthenticated, isRestaurant} = useAuth();
  const {setSearchQuery, setSearchResults, setIsSearching} = useSearch();
  const {addItem} = useCart();
  const stackNav = navigation.getParent()?.getParent() ?? navigation.getParent() ?? navigation;
  const [menuPromoVisible, setMenuPromoVisible] = useState(false);
  const [menuPromoLoading, setMenuPromoLoading] = useState(false);
  const [menuPromoDetail, setMenuPromoDetail] = useState<MenuApi | null>(null);
  const [menuPromoRestaurantId, setMenuPromoRestaurantId] = useState<number | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(defaultFilterOptions);
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({});
  const [popularDishes, setPopularDishes] = useState<dishesApi.DishForList[]>([]);
  const [nearbyRestaurants, setNearbyRestaurants] = useState<restaurantsApi.RestaurantForList[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryDishes, setCategoryDishes] = useState<dishesApi.DishForList[]>([]);
  const [categoryDishesLoading, setCategoryDishesLoading] = useState(false);
  const [topBannerPromos, setTopBannerPromos] = useState<promotionsApi.PromotionForList[]>([]);
  const [sectionPromos, setSectionPromos] = useState<promotionsApi.PromotionForList[]>([]);
  const [floatingPromos, setFloatingPromos] = useState<promotionsApi.PromotionForList[]>([]);
  const [cateringServices, setCateringServices] = useState<cateringApi.CateringServiceForList[]>([]);
  const [groceryShopProducts, setGroceryShopProducts] = useState<groceryShopApi.GroceryShopProductApi[]>([]);
  const [groceryShops, setGroceryShops] = useState<groceryShopApi.GroceryShopApi[]>([]);
  const [homeTab, setHomeTab] = useState<HomeTab>('accueil');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('Adresse non renseignée');
  const [liveSuggestions, setLiveSuggestions] = useState<SearchSuggestion[]>([]);
  const liveRequestIdRef = useRef(0);
  const liveSuggestionsCacheRef = useRef<Map<string, SearchSuggestion[]>>(new Map());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const options = await restaurantsApi.getFilterOptions();
        if (!cancelled) setFilterOptions(options);
      } catch (_) {
        if (!cancelled) setFilterOptions(defaultFilterOptions);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isRestaurant]);

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
      let nearbyCity: string | undefined;
      if (isAuthenticated && !isRestaurant) {
        try {
          const profile = await getClientProfile();
          nearbyCity = extractCityFromAddress(profile?.address);
        } catch {
          nearbyCity = undefined;
        }
      }

      let [
        dishesRes,
        restaurantsRes,
        categoriesRes,
        topBannerRes,
        sectionRes,
        floatingRes,
        cateringRes,
      ] = await Promise.all([
        dishesApi.getDishes({limit: 8}),
        restaurantsApi.getNearbyRestaurants({limit: 6, city: nearbyCity}),
        categoriesApi.getCategories(),
        promotionsApi.getActivePromotions({display_format: 'top_banner', limit: 10}),
        promotionsApi.getActivePromotions({display_format: 'section', limit: 10}),
        promotionsApi.getActivePromotions({display_format: 'floating_left', limit: 10}),
        cateringApi.getCateringServices({limit: 6}),
      ]);
      if (getIsCancelled?.()) return;

      if (!restaurantsRes.length) {
        try {
          restaurantsRes = await restaurantsApi.getRestaurants({limit: 6, skip: 0});
        } catch {
          restaurantsRes = [];
        }
      }
      if (getIsCancelled?.()) return;

      let groceryShopRes: groceryShopApi.GroceryShopProductApi[] = [];
      let groceryShopsRes: groceryShopApi.GroceryShopApi[] = [];
      try {
        const [catalog, dishRows, shops] = await Promise.all([
          groceryShopApi.getGroceryShopProducts({limit: 200}),
          groceryShopApi.getPublicGroceryDishes({limit: 200}).catch(() => []),
          groceryShopApi.getGroceryShops().catch(() => []),
        ]);
        groceryShopsRes = Array.isArray(shops) ? shops : [];
        const mappedDishes = (Array.isArray(dishRows) ? dishRows : []).map(d => ({
          id: d.id,
          source: 'dish' as const,
          name: d.name,
          price: d.price,
          image_url: d.dish_image_url,
          category: d.category_name ?? undefined,
          restaurant_id: d.restaurant_id,
          restaurant_name: d.restaurant_name,
          is_african: false,
          unit: 'piece',
          stock_quantity: 0,
        }));
        const catalogNorm = (Array.isArray(catalog) ? catalog : []).map(p => ({
          ...p,
          source: 'catalog' as const,
        }));
        groceryShopRes = [...catalogNorm, ...mappedDishes];
      } catch {
        groceryShopRes = [];
      }
      if (getIsCancelled?.()) return;

      let topBanner = Array.isArray(topBannerRes) ? topBannerRes : [];
      let sectionPromosList = Array.isArray(sectionRes) ? sectionRes : [];
      let floatingPromosList = Array.isArray(floatingRes) ? floatingRes : [];

      // Fallback: si aucune promo par format, charger toutes les promos actives (comme afrodineui)
      if (topBanner.length === 0 || sectionPromosList.length === 0 || floatingPromosList.length === 0) {
        const anyPromos = await promotionsApi.getActivePromotions({limit: 15});
        if (!getIsCancelled?.() && Array.isArray(anyPromos) && anyPromos.length > 0) {
          if (topBanner.length === 0) topBanner = anyPromos.slice(0, 5);
          if (sectionPromosList.length === 0) sectionPromosList = anyPromos.slice(0, 5);
          if (floatingPromosList.length === 0) floatingPromosList = anyPromos.slice(5, 10);
        }
      }

      setPopularDishes(dishesRes);
      setNearbyRestaurants(restaurantsRes);
      setCategories(mapApiCategoriesToUi(categoriesRes));
      setTopBannerPromos(topBanner);
      setSectionPromos(sectionPromosList);
      setFloatingPromos(floatingPromosList);
      setCateringServices(cateringRes);
      setGroceryShopProducts(groceryShopRes);
      setGroceryShops(groceryShopsRes);
    } catch (e: any) {
      if (getIsCancelled?.()) return;
      setError(formatAxiosError(e, 'Erreur de chargement'));
      setPopularDishes([]);
      setNearbyRestaurants([]);
      setCategories([]);
      setTopBannerPromos([]);
      setSectionPromos([]);
      setFloatingPromos([]);
      setCateringServices([]);
      setGroceryShopProducts([]);
      setGroceryShops([]);
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

  const cateringRestaurantIds = new Set(cateringServices.map(s => s.restaurantId));

  const openMenuPromotion = async (promo: promotionsApi.PromotionForList) => {
    const menuId = promo.menuIds?.[0];
    if (!menuId) {
      navigation.navigate('RestaurantDetails', {restaurantId: promo.restaurantId});
      return;
    }
    setMenuPromoRestaurantId(promo.restaurantId);
    setMenuPromoVisible(true);
    setMenuPromoLoading(true);
    setMenuPromoDetail(null);
    try {
      const menu = await getMenuById(menuId);
      setMenuPromoDetail(menu);
    } catch {
      setMenuPromoVisible(false);
    } finally {
      setMenuPromoLoading(false);
    }
  };

  const closeMenuPromotion = () => {
    setMenuPromoVisible(false);
    setMenuPromoDetail(null);
  };

  const addMenuPromotionToCart = (menu: MenuApi) => {
    addItem({
      dishId: 0,
      menuId: menu.id,
      restaurantId: menuPromoRestaurantId ?? menu.restaurant_id ?? undefined,
      name: `Menu: ${menu.name}`,
      price: menu.price ?? 0,
      quantity: 1,
      imageUrl: menu.image_url ?? undefined,
    });
    closeMenuPromotion();
    stackNav.navigate('Cart');
  };

  return (
    <View style={styles.container}>
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={() => {
          setFilterModalVisible(false);
          navigation.navigate('Restaurants', {initialFilters: selectedFilters});
        }}
        onReset={() => setSelectedFilters({})}
        filterOptions={filterOptions}
        selectedFilters={selectedFilters}
        onFilterChange={(partial) => setSelectedFilters(prev => ({...prev, ...partial}))}
      />
      <TopBar
        navigation={navigation}
      />
      <LocationSection
        address={deliveryAddress}
        onPress={() => {
          if (!isAuthenticated || isRestaurant) return;
          navigation.navigate('EditProfile');
        }}
      />
      <SearchBar
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
            const restaurantSuggestions: SearchSuggestion[] = restaurantsRes
              .slice(0, 4)
              .map(r => ({
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
        onFilterPress={() => setFilterModalVisible(true)}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={[Colors.primary]} />
        }
        keyboardShouldPersistTaps="handled">
        <View style={styles.homeTabBar}>
          <TouchableOpacity
            style={[styles.homeTab, homeTab === 'accueil' && styles.homeTabActive]}
            onPress={() => setHomeTab('accueil')}
            activeOpacity={0.85}>
            <IconWrapper name="home-outline" size={18} color={homeTab === 'accueil' ? Colors.white : Colors.primary} />
            <Text style={[styles.homeTabLabel, homeTab === 'accueil' && styles.homeTabLabelActive]}>Accueil</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.homeTab, homeTab === 'groceryShop' && styles.homeTabActive]}
            onPress={() => setHomeTab('groceryShop')}
            activeOpacity={0.85}>
            <IconWrapper name="basket-outline" size={18} color={homeTab === 'groceryShop' ? Colors.white : Colors.primary} />
            <Text style={[styles.homeTabLabel, homeTab === 'groceryShop' && styles.homeTabLabelActive]}>Grocery shop</Text>
          </TouchableOpacity>
        </View>
        {homeTab === 'accueil' ? (
        <>
        <Image
          source={require('../assets/namke-banner.png')}
          style={styles.brandBanner}
          resizeMode="cover"
        />
        <View style={styles.promosSection}>
          {topBannerPromos.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.promosScroll}
              style={styles.promosScrollView}
              pagingEnabled
              snapToInterval={SCREEN_WIDTH}
              snapToAlignment="start"
              decelerationRate="fast">
              {topBannerPromos.map(promo => (
                <View key={`topbanner-${promo.id}`} style={styles.promoBannerWrap}>
                  <PromoBanner
                    title={promo.title}
                    subtitle={promo.subtitle}
                    buttonText={promo.buttonText}
                    imageUrl={promo.imageUrl}
                    backgroundColor={promo.backgroundColor}
                    discountLabel={promo.discountLabel}
                    onPress={() =>
                      navigation.navigate('RestaurantDetails', {
                        restaurantId: promo.restaurantId,
                      })
                    }
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            <PromoBanner
              title="Bienvenue"
              subtitle="Découvrez les restaurants et plats près de chez vous"
              buttonText="Explorer"
              onPress={() => navigation.navigate('Restaurants')}
            />
          )}
        </View>
        <CategoryGrid
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onCategoryPress={handleCategoryPress}
        />
        </>
        ) : null}
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
        {homeTab === 'accueil' && (
        <>
        <View style={styles.section}>
          <SectionHeader
            title={
              selectedCategoryId
                ? categories.find(c => c.id === selectedCategoryId)?.name ?? 'Plats populaires'
                : 'Plats populaires'
            }
            onSeeAllPress={() => stackNav.navigate('PopularDishes')}
          />
          {selectedCategoryId && categoryDishesLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} style={styles.loadingText} />
          ) : (selectedCategoryId ? categoryDishes : popularDishes).length === 0 ? (
            <Text style={styles.emptyText}>Aucun plat pour le moment</Text>
          ) : (
            (selectedCategoryId ? categoryDishes : popularDishes).map(dish => (
              <DishCard
                key={dish.id}
                {...dish}
                onPress={() => navigation.navigate('DishDetails', {dishId: dish.id, restaurantId: dish.restaurantId})}
                onFavoritePress={() => {}}
                onAddPress={() => {}}
              />
            ))
          )}
        </View>
        <View style={styles.section}>
          <SectionHeader title="Offres spéciales" />
          {sectionPromos.length > 0 ? (
            sectionPromos.map(promo => (
              <SpecialOfferCard
                key={`section-${promo.id}`}
                id={String(promo.id)}
                title={promo.title}
                description={promo.subtitle}
                discount={promo.discountLabel ?? ''}
                imageUrl={promo.imageUrl}
                backgroundColor={promo.backgroundColor}
                buttonText={promo.buttonText}
                icon="pricetag"
                onPress={() =>
                  navigation.navigate('RestaurantDetails', {restaurantId: promo.restaurantId})
                }
                onButtonPress={() => openMenuPromotion(promo)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>Aucune offre pour le moment</Text>
          )}
        </View>
        <View style={styles.section}>
          <SectionHeader
            title="Restaurants à proximité"
            onSeeAllPress={() => navigation.navigate('Restaurants')}
          />
          {nearbyRestaurants.length === 0 ? (
            <Text style={styles.emptyText}>Aucun restaurant pour le moment</Text>
          ) : (
            nearbyRestaurants.map(restaurant => (
              <RestaurantCard
                key={restaurant.id}
                {...restaurant}
                hasCatering={cateringRestaurantIds.has(restaurant.id)}
                onPress={() => navigation.navigate('RestaurantDetails', {restaurantId: restaurant.id})}
              />
            ))
          )}
        </View>
        {floatingPromos.length > 0 ? (
          <View style={styles.section}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.promosScroll}
              style={styles.floatingPromoScroll}
              snapToInterval={300}
              snapToAlignment="start"
              decelerationRate="fast">
              {floatingPromos.map(promo => (
                <TouchableOpacity
                  key={`float-${promo.id}`}
                  style={styles.floatingPromoCard}
                  onPress={() =>
                    navigation.navigate('RestaurantDetails', {restaurantId: promo.restaurantId})
                  }
                  activeOpacity={0.8}>
                  <PromoBanner
                    title={promo.title}
                    subtitle={promo.subtitle}
                    buttonText={promo.buttonText}
                    imageUrl={promo.imageUrl}
                    backgroundColor={promo.backgroundColor}
                    discountLabel={promo.discountLabel}
                    onPress={() =>
                      navigation.navigate('RestaurantDetails', {restaurantId: promo.restaurantId})
                    }
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}
        <View style={styles.section}>
          <SectionHeader
            title="Service traiteur"
            onSeeAllPress={() => stackNav.navigate('CateringDetails')}
          />
          {cateringServices.length === 0 ? (
            <TouchableOpacity
              style={styles.cateringBanner}
              onPress={() => stackNav.navigate('CateringDetails')}
              activeOpacity={0.9}>
              <View style={styles.cateringBannerContent}>
                <View style={[styles.cateringIconWrap, {backgroundColor: Colors.primary}]}>
                  <IconWrapper name="restaurant-outline" size={32} color={Colors.white} />
                </View>
                <View style={styles.cateringBannerText}>
                  <Text style={styles.cateringBannerTitle}>Traiteur pour vos événements</Text>
                  <Text style={styles.cateringBannerSubtitle}>
                    Mariages, séminaires, anniversaires
                  </Text>
                </View>
                <IconWrapper name="chevron-forward-outline" size={24} color={Colors.primary} />
              </View>
            </TouchableOpacity>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}>
              {cateringServices.map(service => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.cateringCard}
                  onPress={() =>
                    navigation.navigate('CateringServiceDetail', {
                      restaurantId: service.restaurantId,
                      serviceId: service.id,
                    })
                  }
                  activeOpacity={0.8}>
                  <Image
                    source={service.imageUrl ? {uri: getAbsoluteImageUrl(service.imageUrl) ?? service.imageUrl} : namkeFallback}
                    style={styles.cateringCardImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.cateringCardName} numberOfLines={2}>
                    {service.name}
                  </Text>
                  <Text style={styles.cateringCardPrice}>
                    À partir de {service.basePrice.toFixed(0)} €
                  </Text>
                  <Text style={styles.cateringCardGuests}>
                    {service.minGuests}–{service.maxGuests ?? '+'} pers.
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.cateringSeeAll}
                onPress={() => stackNav.navigate('CateringDetails')}>
                <IconWrapper name="arrow-forward-circle-outline" size={40} color={Colors.primary} />
                <Text style={styles.cateringSeeAllText}>Voir tout</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
        <View style={styles.section}>
          <SectionHeader
            title="Épicerie"
            onSeeAllPress={() => setHomeTab('groceryShop')}
          />
          {groceryShopProducts.length === 0 ? (
            <Text style={styles.emptyText}>Aucun produit pour le moment</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}>
              {groceryShopProducts.slice(0, 6).map(p => (
                <View key={`grocery-preview-${p.source ?? 'catalog'}-${p.id}`} style={styles.groceryPreviewCard}>
                  <GroceryShopProductCard
                    product={p}
                    compact
                    onPress={() => {
                      if (p.source === 'dish' && p.restaurant_id != null) {
                        stackNav.navigate('DishDetails', {
                          dishId: p.id,
                          restaurantId: p.restaurant_id,
                        });
                        return;
                      }
                      if (p.grocery_shop_id != null) {
                        stackNav.navigate('GroceryShopDetails', {
                          groceryShopId: p.grocery_shop_id,
                          groceryShopName: p.grocery_shop_name ?? undefined,
                        });
                        return;
                      }
                      setHomeTab('groceryShop');
                    }}
                  />
                </View>
              ))}
            </ScrollView>
          )}
        </View>
        </>
        )}
        {homeTab === 'groceryShop' && (
          <View style={styles.section}>
            <SectionHeader title="Grocery shop" />
            {groceryShops.length === 0 ? (
              <Text style={styles.emptyText}>Aucune boutique pour le moment</Text>
            ) : (
              <>
                <Text style={styles.groceryCountText}>
                  {groceryShops.length} boutique{groceryShops.length > 1 ? 's' : ''}
                </Text>
                {groceryShops.map(shop => (
                  <GroceryShopCard
                    key={shop.id}
                    shop={shop}
                    onPress={() =>
                      stackNav.navigate('GroceryShopDetails', {
                        groceryShopId: shop.id,
                        groceryShopName: shop.name,
                      })
                    }
                  />
                ))}
              </>
            )}
          </View>
        )}
        {homeTab === 'accueil' && (
        <>
        <View style={styles.section}>
          <View
            style={[
              styles.deliveryBanner,
              {backgroundColor: Colors.primary},
            ]}>
            <View style={styles.deliveryContent}>
              <View>
                <Text style={styles.deliveryTitle}>Livraison gratuite</Text>
                <Text style={styles.deliverySubtitle}>
                  Pour toute commande +25€
                </Text>
              </View>
              <View style={styles.deliveryIconContainer}>
                <IconWrapper name="bicycle-outline" size={28} color={Colors.white} />
              </View>
            </View>
            <View style={styles.deliveryStats}>
              <View style={styles.deliveryStat}>
                <Text style={styles.deliveryStatValue}>15min</Text>
                <Text style={styles.deliveryStatLabel}>Moyenne</Text>
              </View>
              <View style={styles.deliveryStat}>
                <Text style={styles.deliveryStatValue}>98%</Text>
                <Text style={styles.deliveryStatLabel}>À l'heure</Text>
              </View>
              <View style={styles.deliveryStat}>
                <Text style={styles.deliveryStatValue}>4.9★</Text>
                <Text style={styles.deliveryStatLabel}>Service</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <SectionHeader title="Pourquoi namke ?" />
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <IconWrapper name="flash-outline" size={22} color={Colors.textLight} />
              </View>
              <Text style={styles.featureTitle}>Livraison rapide</Text>
              <Text style={styles.featureSubtitle}>En moyenne 20 minutes</Text>
            </View>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <IconWrapper name="shield-checkmark-outline" size={22} color={Colors.textLight} />
              </View>
              <Text style={styles.featureTitle}>Paiement sécurisé</Text>
              <Text style={styles.featureSubtitle}>100% protégé</Text>
            </View>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <IconWrapper name="restaurant-outline" size={22} color={Colors.textLight} />
              </View>
              <Text style={styles.featureTitle}>Large choix</Text>
              <Text style={styles.featureSubtitle}>500+ restaurants</Text>
            </View>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <IconWrapper name="headset-outline" size={22} color={Colors.textLight} />
              </View>
              <Text style={styles.featureTitle}>Support 24/7</Text>
              <Text style={styles.featureSubtitle}>Toujours disponible</Text>
            </View>
          </View>
        </View>
        </>
        )}
          </>
        )}
      </ScrollView>
      <MenuPromotionModal
        visible={menuPromoVisible}
        loading={menuPromoLoading}
        menu={menuPromoDetail}
        onClose={closeMenuPromotion}
        onAddToCart={addMenuPromotionToCart}
      />
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
    paddingBottom: 20,
  },
  homeTabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  homeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  homeTabActive: {
    backgroundColor: Colors.primary,
  },
  homeTabLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  homeTabLabelActive: {
    color: Colors.white,
  },
  brandBanner: {
    width: '100%',
    height: 140,
    marginBottom: 12,
  },
  promosSection: {
    minHeight: 192,
    marginBottom: 8,
    flexGrow: 0,
  },
  promosScrollView: {
    height: 192,
    marginVertical: 8,
  },
  promosScroll: {
    alignItems: 'stretch',
  },
  promoBannerWrap: {
    width: SCREEN_WIDTH,
    height: 192,
  },
  floatingPromoScroll: {
    marginVertical: 8,
  },
  floatingPromoCard: {
    width: 300,
    marginRight: 12,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
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
    borderRadius: 12,
  },
  retryText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  groceryCountText: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  horizontalScroll: {
    paddingRight: 16,
  },
  groceryPreviewCard: {
    marginRight: 12,
  },
  deliveryBanner: {
    borderRadius: 16,
    padding: 16,
  },
  deliveryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  deliverySubtitle: {
    fontSize: 12,
    color: Colors.white + 'E6',
  },
  deliveryIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: Colors.white + '33',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deliveryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  deliveryStat: {
    backgroundColor: Colors.white + '1A',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  deliveryStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  deliveryStatLabel: {
    fontSize: 12,
    color: Colors.white + 'BF',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  featureSubtitle: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
  },
  cateringBanner: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cateringBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cateringIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cateringBannerText: {
    flex: 1,
  },
  cateringBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  cateringBannerSubtitle: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 2,
  },
  cateringCard: {
    width: 160,
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cateringCardImage: {
    width: '100%',
    height: 90,
    backgroundColor: Colors.gray[100],
  },
  cateringCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryDark,
    marginBottom: 4,
    marginTop: 10,
    paddingHorizontal: 14,
  },
  cateringCardPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    paddingHorizontal: 14,
  },
  cateringCardGuests: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  cateringSeeAll: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cateringSeeAllText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 6,
  },
});

export default HomeScreen;
