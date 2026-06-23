import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import IconWrapper from '../components/IconWrapper';
import {Colors} from '../utils/colors';
import {secondaryFont} from '../utils/fonts';
import DishCard from '../components/home/DishCard';
import SectionHeader from '../components/home/SectionHeader';
import {useFavorites} from '../contexts/FavoritesContext';
import {useCart} from '../contexts/CartContext';
import * as restaurantsApi from '../services/restaurants';
import {getLoyaltyAccount} from '../services/loyalty';
import {getAbsoluteImageUrl} from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {formatAxiosError} from '../utils/formatApiError';

interface RestaurantDetailsScreenProps {
  route: any;
  navigation: any;
}

const RestaurantDetailsScreen: React.FC<RestaurantDetailsScreenProps> = ({
  route,
  navigation,
}) => {
  const {restaurantId} = route.params || {};
  const [restaurant, setRestaurant] = useState<any>(null);
  const [dishes, setDishes] = useState<restaurantsApi.DishForList[]>([]);
  const [menusWithDishes, setMenusWithDishes] = useState<restaurantsApi.MenuWithDishesApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showMenuSection, setShowMenuSection] = useState(true);
  const [activeTab, setActiveTab] = useState<'menu' | 'plats'>('menu');
  const [reviews, setReviews] = useState<restaurantsApi.RestaurantReviewApi[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loyaltyPointsBalance, setLoyaltyPointsBalance] = useState<number | null>(null);
  const [loyaltyBalanceLoading, setLoyaltyBalanceLoading] = useState(false);
  const {isFavorite: isFav, toggleFavorite} = useFavorites();
  const {items: cartItems, addItem} = useCart();
  const isFavorite = restaurant ? isFav(String(restaurant.id)) : false;

  const deliveryFeeNum =
    restaurant?.deliveryFee === 'Gratuit'
      ? 0
      : parseFloat(String(restaurant?.deliveryFee ?? '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

  const cartForRestaurant = useMemo(() => {
    if (!restaurant?.id) return { count: 0, total: 0 };
    const restId = Number(restaurant.id);
    const items = cartItems.filter(
      (i: any) => (typeof i.restaurantId === 'number' ? i.restaurantId : Number(i.restaurantId)) === restId,
    );
    const subtotal = items.reduce((sum: number, i: any) => {
      const ext = (i.extras ?? []).reduce((s: number, e: any) => s + (e.price ?? 0), 0);
      return sum + ((i.price ?? 0) + ext) * (i.quantity ?? 1);
    }, 0);
    const count = items.reduce((s: number, i: any) => s + (i.quantity ?? 1), 0);
    const total = items.length > 0 ? subtotal + deliveryFeeNum : 0;
    return { count, total };
  }, [cartItems, restaurant?.id, deliveryFeeNum]);

  const displayRating =
    restaurant?.rating != null && restaurant.rating !== undefined
      ? Number(restaurant.rating).toFixed(1)
      : '—';

  const categories = useMemo(() => {
    const set = new Set<string>();
    dishes.forEach(d => {
      const name = d.categoryName?.trim() || 'Sans catégorie';
      set.add(name);
    });
    const list = Array.from(set).sort((a, b) => {
      if (a === 'Sans catégorie') return 1;
      if (b === 'Sans catégorie') return -1;
      return a.localeCompare(b);
    });
    return list;
  }, [dishes]);

  const filteredDishes = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'Tout') return dishes;
    return dishes.filter(
      d => (d.categoryName?.trim() || 'Sans catégorie') === selectedCategory,
    );
  }, [dishes, selectedCategory]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const id = Number(restaurantId) || restaurantId;
        const [restData, dishesList, menusList] = await Promise.all([
          restaurantsApi.getRestaurantById(id),
          restaurantsApi.getRestaurantDishes(id),
          restaurantsApi.getRestaurantMenusWithDishes(id),
        ]);
        if (cancelled) return;
        setMenusWithDishes(Array.isArray(menusList) ? menusList : []);
        if (restData) {
          // Bannière : profil (banner/logo) puis image du menu (comme en "menu detail") puis premier plat
          let imageUrl = restData.profile?.banner_image_url || restData.profile?.logo_url;
          if (!imageUrl && Array.isArray(menusList) && menusList.length > 0) {
            for (const menu of menusList) {
              const menuImg = (menu as any).image_url;
              if (menuImg) {
                imageUrl = menuImg;
                break;
              }
              const firstDish = (menu as any).dishes?.find((d: any) => d.dish_image_url || d.image_url);
              if (firstDish) {
                imageUrl = firstDish.dish_image_url || firstDish.image_url;
                break;
              }
            }
          }
          if (!imageUrl && Array.isArray(dishesList) && dishesList.length > 0) {
            const firstDishWithImage = dishesList.find((d: any) => d.imageUrl);
            imageUrl = firstDishWithImage?.imageUrl;
          }
          const priceRange =
            restData.minimum_order != null
              ? restData.minimum_order >= 20
                ? '€€€'
                : restData.minimum_order >= 10
                  ? '€€'
                  : '€'
              : '€€';
          const openingHours = restData.profile?.opening_hours;
          const hoursDisplay =
            typeof openingHours === 'string'
              ? openingHours
              : openingHours && typeof openingHours === 'object'
                ? Object.entries(openingHours)
                    .filter(([, v]) => v && typeof v === 'object' && (v as any).open)
                    .map(([day, v]) => `${day}: ${(v as any).open_time || ''}-${(v as any).close_time || ''}`)
                    .join(' • ') || '—'
                : '—';
          setRestaurant({
            id: restData.id,
            name: restData.name,
            cuisine: restData.cuisine_type,
            priceRange,
            rating: restData.rating,
            deliveryTime: (restData as any).delivery_time ?? '—',
            deliveryFee:
              restData.delivery_fee != null
                ? restData.delivery_fee === 0
                  ? 'Gratuit'
                  : `${Number(restData.delivery_fee).toFixed(1)}€`
                : '—',
            imageUrl: imageUrl || undefined,
            description: restData.description,
            address: restData.address,
            city: restData.city,
            phone: restData.phone,
            hours: hoursDisplay,
            loyaltyEnabled: restData.loyalty_enabled !== false,
            loyaltyTrancheEuros:
              restData.loyalty_tranche_euros != null
                ? Number(restData.loyalty_tranche_euros)
                : 10,
            loyaltyPointsPerTranche:
              restData.loyalty_points_per_tranche != null
                ? Number(restData.loyalty_points_per_tranche)
                : 1,
          });
          const profile = restData.profile as restaurantsApi.RestaurantProfileApi | undefined;
          const urls: string[] = [];
          const byType = profile?.images_by_type || {};
          const order = ['banner', 'logo', 'slide', 'card', 'restaurant', 'gallery'];
          order.forEach(type => {
            const arr = byType[type];
            if (Array.isArray(arr)) {
              arr.forEach((item: { image_url?: string }) => {
                if (item?.image_url) urls.push(item.image_url);
              });
            }
          });
          if (urls.length === 0 && profile) {
            [profile.banner_image_url, profile.logo_url, profile.slide_image_url, profile.card_image_url, profile.restaurant_image_url]
              .filter(Boolean)
              .forEach((u: string | undefined) => u && urls.push(u));
          }
          setGalleryImages(urls);
        } else {
          setRestaurant(null);
          setGalleryImages([]);
        }
        setDishes(dishesList);
      } catch (e) {
        if (!cancelled) setRestaurant(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await AsyncStorage.getItem('access_token');
      if (!token || !restaurant?.id) {
        if (!cancelled) {
          setLoyaltyPointsBalance(null);
          setLoyaltyBalanceLoading(false);
        }
        return;
      }
      setLoyaltyBalanceLoading(true);
      try {
        const acc = await getLoyaltyAccount();
        if (cancelled) return;
        if (acc && typeof acc.available_points === 'number') {
          setLoyaltyPointsBalance(acc.available_points);
        } else {
          setLoyaltyPointsBalance(null);
        }
      } catch {
        if (!cancelled) {
          setLoyaltyPointsBalance(null);
        }
      } finally {
        if (!cancelled) {
          setLoyaltyBalanceLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurant?.id]);

  React.useEffect(() => {
    if (restaurant) {
      navigation.setOptions({title: restaurant.name});
    }
  }, [restaurant, navigation]);

  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    (async () => {
      try {
        const [reviewsList, token] = await Promise.all([
          restaurantsApi.getRestaurantReviews(restaurantId),
          AsyncStorage.getItem('access_token'),
        ]);
        if (cancelled) return;
        setReviews(reviewsList);
        setIsLoggedIn(!!token);
      } catch (_) {
        if (!cancelled) setReviews([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const handleSubmitReview = async () => {
    if (!restaurantId || reviewRating < 1 || reviewRating > 5) {
      Alert.alert('Erreur', 'Veuillez choisir une note entre 1 et 5 étoiles.');
      return;
    }
    if (!isLoggedIn) {
      Alert.alert('Connexion requise', 'Connectez-vous pour laisser un avis.');
      return;
    }
    setReviewSubmitting(true);
    try {
      await restaurantsApi.createRestaurantReview(restaurantId, {
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      const id = Number(restaurantId) || restaurantId;
      const [restData, reviewsList] = await Promise.all([
        restaurantsApi.getRestaurantById(id),
        restaurantsApi.getRestaurantReviews(restaurantId),
      ]);
      if (restaurant && restData) {
        setRestaurant((prev: any) => (prev ? {...prev, rating: restData.rating} : null));
      }
      setReviews(reviewsList);
      setReviewRating(0);
      setReviewComment('');
      setUserHasReviewed(true);
      Alert.alert('Merci !', 'Votre avis a bien été enregistré.');
    } catch (e: any) {
      const msg = formatAxiosError(e, 'Erreur lors de l\'envoi.');
      if (msg.toLowerCase().includes('already reviewed')) {
        setUserHasReviewed(true);
        Alert.alert('Déjà avis', 'Vous avez déjà laissé un avis pour ce restaurant.');
      } else {
        Alert.alert('Erreur', msg);
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }
  if (!restaurant) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Restaurant introuvable</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image header */}
        <View style={styles.imageContainer}>
          {(() => {
            const bannerUri = getAbsoluteImageUrl(restaurant.imageUrl);
            const showBanner = restaurant.imageUrl && bannerUri && !imageLoadError;
            return showBanner ? (
            <Image
                source={{uri: bannerUri}}
              style={styles.headerImage}
              resizeMode="cover"
              onError={() => setImageLoadError(true)}
            />
          ) : (
            <View style={[styles.headerImage, styles.headerPlaceholder]}>
              <IconWrapper name="restaurant-outline" size={64} color={Colors.textLight} />
              <Text style={styles.headerPlaceholderText}>Bannière du restaurant</Text>
            </View>
            );
          })()}
          <View style={styles.headerOverlay} />
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => {
              if (restaurant) {
                toggleFavorite({
                  id: String(restaurant.id),
                  name: restaurant.name,
                  cuisine: restaurant.cuisine,
                  priceRange: restaurant.priceRange,
                  rating: restaurant.rating ?? undefined,
                  deliveryTime: restaurant.deliveryTime,
                  deliveryFee: restaurant.deliveryFee,
                  imageUrl: restaurant.imageUrl,
                });
              }
            }}>
            <IconWrapper
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? Colors.error : Colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Restaurant Info */}
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.titleLeft}>
                <Text style={styles.name}>{restaurant.name}</Text>
                <Text style={styles.cuisine}>{restaurant.cuisine} • {restaurant.priceRange}</Text>
              </View>
              <View style={styles.titleRight}>
                <View style={styles.ratingBadge}>
                  <IconWrapper name="star" size={16} color={Colors.warning} />
                  <Text style={styles.ratingText}>{displayRating}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Info Cards */}
          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <IconWrapper name="time-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoCardText}>{restaurant.deliveryTime}</Text>
            </View>
            <View style={styles.infoCard}>
              <IconWrapper name="bicycle-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoCardText}>{restaurant.deliveryFee}</Text>
            </View>
            <View style={styles.infoCard}>
              <IconWrapper name="star-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoCardText}>{restaurant.rating}★</Text>
            </View>
          </View>

          {restaurant.loyaltyEnabled !== false && (
            <View style={styles.loyaltyBanner}>
              <IconWrapper name="gift-outline" size={22} color={Colors.primary} />
              <View style={styles.loyaltyBannerTextWrap}>
                <Text style={styles.loyaltyBannerTitle}>Points de fidélité namke</Text>
                <Text style={styles.loyaltyBannerSub}>
                  {Number(restaurant.loyaltyPointsPerTranche ?? 1) || 0} point(s) tous les{' '}
                  {Number(restaurant.loyaltyTrancheEuros ?? 10).toLocaleString('fr-FR', {
                    maximumFractionDigits: 2,
                  })}{' '}
                  € dépensés (après paiement).
                </Text>
                {isLoggedIn && loyaltyBalanceLoading && (
                  <ActivityIndicator style={{marginTop: 8}} size="small" color={Colors.primary} />
                )}
                {isLoggedIn && !loyaltyBalanceLoading && loyaltyPointsBalance !== null && (
                  <Text style={styles.loyaltyBalance}>
                    Vos points disponibles : <Text style={styles.loyaltyBalanceNum}>{loyaltyPointsBalance}</Text>
                  </Text>
                )}
                {!isLoggedIn && (
                  <Text style={styles.loyaltyHint}>Connectez-vous pour voir votre solde de points.</Text>
                )}
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>À propos</Text>
            <Text style={styles.description}>{restaurant.description}</Text>
          </View>

          {/* Contact Info */}
          <View style={styles.section}>
            <View style={styles.contactItem}>
              <IconWrapper name="location-outline" size={20} color={Colors.primary} />
              <Text style={styles.contactText}>{restaurant.address}</Text>
            </View>
            <View style={styles.contactItem}>
              <IconWrapper name="call-outline" size={20} color={Colors.primary} />
              <Text style={styles.contactText}>{restaurant.phone}</Text>
            </View>
            <View style={styles.contactItem}>
              <IconWrapper name="time-outline" size={20} color={Colors.primary} />
              <Text style={styles.contactText}>{restaurant.hours}</Text>
            </View>
          </View>

          {/* Images du restaurant */}
          {galleryImages.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Images du restaurant</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryScroll}
              >
                {galleryImages.map((uri, index) => (
                  <View key={`gallery-${index}`} style={styles.galleryItem}>
                    <Image
                      source={{ uri: getAbsoluteImageUrl(uri) }}
                      style={styles.galleryImage}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Laisser un avis */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Laisser un avis</Text>
            {!isLoggedIn ? (
              <Text style={styles.reviewHint}>Connectez-vous pour noter ce restaurant.</Text>
            ) : userHasReviewed ? (
              <Text style={styles.reviewHint}>Vous avez déjà laissé un avis.</Text>
            ) : (
              <>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setReviewRating(star)}
                      style={styles.starButton}
                      activeOpacity={0.7}>
                      <IconWrapper
                        name={reviewRating >= star ? 'star' : 'star-outline'}
                        size={32}
                        color={reviewRating >= star ? Colors.warning : Colors.textLight}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.reviewInput}
                  placeholder="Votre avis (optionnel)"
                  placeholderTextColor={Colors.textLight}
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity
                  style={[styles.reviewSubmitButton, reviewSubmitting && styles.reviewSubmitDisabled]}
                  onPress={handleSubmitReview}
                  disabled={reviewSubmitting || reviewRating < 1}>
                  {reviewSubmitting ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.reviewSubmitText}>Envoyer l'avis</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
            {reviews.length > 0 && (
              <View style={styles.reviewsList}>
                <Text style={styles.reviewsListTitle}>Avis ({reviews.length})</Text>
                {reviews.slice(0, 5).map(r => (
                  <View key={r.id} style={styles.reviewItem}>
                    <View style={styles.reviewItemHeader}>
                      <Text style={styles.reviewItemRating}>{r.rating} ★</Text>
                    </View>
                    {r.comment ? (
                      <Text style={styles.reviewItemComment}>{r.comment}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Résumé: icône sombre, Plats, Prix total, Catégories */}
          <View style={styles.summaryBar}>
            <IconWrapper name="nutrition-outline" size={22} color={Colors.primary} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Plats</Text>
              <Text style={styles.summaryValue}>{dishes.length}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Prix total</Text>
              <Text style={styles.summaryValue}>
                {cartForRestaurant.total > 0 ? `${cartForRestaurant.total.toFixed(2)} €` : '—'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Catégories</Text>
              <Text style={styles.summaryValue}>{categories.length}</Text>
            </View>
          </View>

          {/* Tabs Menu / Plats */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'menu' && styles.tabActive]}
              onPress={() => setActiveTab('menu')}
              activeOpacity={0.8}>
              <IconWrapper
                name="restaurant-outline"
                size={20}
                color={activeTab === 'menu' ? Colors.primary : Colors.textLight}
              />
              <Text style={[styles.tabText, activeTab === 'menu' && styles.tabTextActive]}>
                Menu {menusWithDishes.length > 0 ? `(${menusWithDishes.length})` : ''}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'plats' && styles.tabActive]}
              onPress={() => setActiveTab('plats')}
              activeOpacity={0.8}>
              <IconWrapper
                name="nutrition-outline"
                size={20}
                color={activeTab === 'plats' ? Colors.primary : Colors.textLight}
              />
              <Text style={[styles.tabText, activeTab === 'plats' && styles.tabTextActive]}>
                Plats {dishes.length > 0 ? `(${dishes.length})` : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Contenu selon l’onglet actif */}
          {activeTab === 'menu' ? (
            <View style={styles.section}>
              <SectionHeader title="Menus" />
              {menusWithDishes.length > 0 ? (
                <>
                  <TouchableOpacity
                    style={styles.voirMenuButton}
                    onPress={() => setShowMenuSection(!showMenuSection)}
                    activeOpacity={0.8}>
                    <IconWrapper
                      name={showMenuSection ? 'chevron-up-circle' : 'chevron-down-circle'}
                      size={24}
                      color={Colors.primary}
                    />
                    <Text style={styles.voirMenuButtonText}>
                      {showMenuSection ? 'Masquer le menu' : 'Voir menu'}
                    </Text>
                  </TouchableOpacity>
                  {showMenuSection &&
                    menusWithDishes.map(menu => (
                      <View key={menu.id} style={styles.menuCard}>
                        <View style={styles.menuCardHeader}>
                          {(() => {
                            const firstDishImage = menu.dishes?.[0]?.image_url;
                            const uri = firstDishImage
                              ? (getAbsoluteImageUrl(firstDishImage) ?? firstDishImage)
                              : null;
                            return uri ? (
                              <Image
                                source={{uri}}
                                style={styles.menuCardImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={[styles.menuCardImage, styles.menuCardImagePlaceholder]}>
                                <IconWrapper name="restaurant-outline" size={40} color={Colors.textLight} />
                              </View>
                            );
                          })()}
                          <View style={styles.menuCardInfo}>
                            <Text style={styles.menuCardName}>{menu.name}</Text>
                            {menu.description ? (
                              <Text style={styles.menuCardDescription} numberOfLines={2}>
                                {menu.description}
                              </Text>
                            ) : null}
                            <Text style={styles.menuCardPlats}>
                              {menu.dishes?.length ?? 0} plat{(menu.dishes?.length ?? 0) > 1 ? 's' : ''}
                            </Text>
                          </View>
                        </View>
                        {menu.dishes && menu.dishes.length > 0 ? (
                          <View style={styles.menuCardDishes}>
                            {menu.dishes.map(dish => (
                              <DishCard
                                key={`${menu.id}-${dish.id}`}
                                id={String(dish.id)}
                                name={dish.name}
                                description={dish.description}
                                price={dish.price}
                                imageUrl={dish.image_url}
                                onPress={() =>
                                  navigation.navigate('DishDetails', {
                                    dishId: String(dish.id),
                                    restaurantId: restaurant.id,
                                  })
                                }
                                onFavoritePress={() => {}}
                                onAddPress={() => {
                                  addItem({
                                    dishId: dish.id,
                                    restaurantId: restaurant.id,
                                    name: dish.name,
                                    price: dish.price ?? 0,
                                    quantity: 1,
                                    imageUrl: dish.image_url ?? undefined,
                                    deliveryFee: deliveryFeeNum > 0 ? deliveryFeeNum : undefined,
                                  });
                                  navigation.navigate('Cart');
                                }}
                              />
                            ))}
                          </View>
                        ) : (
                          <Text style={styles.noDishes}>Aucun plat dans ce menu.</Text>
                        )}
                        <TouchableOpacity
                          style={styles.addMenuToCartButton}
                          onPress={() => {
                            const menuPrice =
                              menu.price != null && menu.price > 0
                                ? menu.price
                                : (menu.dishes ?? []).reduce((s, d) => s + (d.price ?? 0), 0);
                            const dishIds = (menu.dishes ?? []).map(d => d.id);
                            addItem({
                              dishId: 0,
                              menuId: menu.id,
                              dishIds: dishIds.length > 0 ? dishIds : undefined,
                              restaurantId: restaurant.id,
                              name: `Menu: ${menu.name}`,
                              price: menuPrice,
                              quantity: 1,
                              imageUrl: menu.dishes?.[0]?.image_url ?? undefined,
                              deliveryFee: deliveryFeeNum > 0 ? deliveryFeeNum : undefined,
                            });
                            navigation.navigate('Cart');
                          }}
                          activeOpacity={0.8}>
                          <IconWrapper name="cart-outline" size={20} color={Colors.white} />
                          <Text style={styles.addMenuToCartText} numberOfLines={1}>
                            Ajouter le menu au panier
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                </>
              ) : (
                <Text style={styles.noDishes}>Aucun menu pour le moment.</Text>
              )}
            </View>
          ) : (
            <View style={styles.section}>
              <SectionHeader title="Plats" />
              {categories.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.bubblesContainer}
                  style={styles.bubblesScroll}>
                  <TouchableOpacity
                    style={[
                      styles.bubble,
                      (!selectedCategory || selectedCategory === 'Tout') && styles.bubbleActive,
                    ]}
                    onPress={() => setSelectedCategory('Tout')}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        styles.bubbleText,
                        (!selectedCategory || selectedCategory === 'Tout') && styles.bubbleTextActive,
                      ]}>
                      Tout
                    </Text>
                  </TouchableOpacity>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.bubble, selectedCategory === cat && styles.bubbleActive]}
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.7}>
                      <Text
                        style={[
                          styles.bubbleText,
                          selectedCategory === cat && styles.bubbleTextActive,
                        ]}
                        numberOfLines={1}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              {filteredDishes.length === 0 ? (
                <Text style={styles.noDishes}>Aucun plat pour le moment.</Text>
              ) : (
                filteredDishes.map(dish => (
              <DishCard
                key={dish.id}
                {...dish}
                onPress={() =>
                      navigation.navigate('DishDetails', {
                        dishId: dish.id,
                        restaurantId: restaurant.id,
                      })
                    }
                    onFavoritePress={() => {}}
                    onAddPress={() => {
                      addItem({
                        dishId: Number(dish.id),
                        restaurantId: restaurant.id,
                        name: dish.name,
                        price: dish.price,
                        quantity: 1,
                        imageUrl: dish.imageUrl ?? undefined,
                        deliveryFee: deliveryFeeNum > 0 ? deliveryFeeNum : undefined,
                      });
                      navigation.navigate('Cart');
                    }}
                  />
                ))
              )}
          </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerPlaceholder: {
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.black + '40',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.black + '60',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.black + '60',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleLeft: {
    flex: 1,
    marginRight: 12,
  },
  titleRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
    fontFamily: secondaryFont,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight + '1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginLeft: 4,
    fontFamily: secondaryFont,
  },
  cuisine: {
    fontSize: 16,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  infoCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  infoCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  infoCardText: {
    fontSize: 12,
    color: Colors.text,
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: secondaryFont,
  },
  loyaltyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.gray[100],
    gap: 12,
  },
  loyaltyBannerTextWrap: {
    flex: 1,
  },
  loyaltyBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
    fontFamily: secondaryFont,
  },
  loyaltyBannerSub: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
    fontFamily: secondaryFont,
  },
  loyaltyBalance: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  loyaltyBalanceNum: {
    fontWeight: '800',
    color: Colors.primary,
  },
  loyaltyHint: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.textLight,
    fontStyle: 'italic',
    fontFamily: secondaryFont,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.gray[100],
    gap: 16,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textLight,
    fontFamily: secondaryFont,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: Colors.white,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  tabTextActive: {
    color: Colors.primary,
    fontFamily: secondaryFont,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 12,
    fontFamily: secondaryFont,
  },
  description: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    fontFamily: secondaryFont,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 12,
    flex: 1,
    fontFamily: secondaryFont,
  },
  galleryScroll: {
    paddingVertical: 8,
    gap: 12,
  },
  galleryItem: {
    width: 140,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  reviewHint: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: secondaryFont,
    marginBottom: 8,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  starButton: {
    padding: 4,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    fontFamily: secondaryFont,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  reviewSubmitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  reviewSubmitDisabled: {
    opacity: 0.7,
  },
  reviewSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: secondaryFont,
  },
  reviewsList: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  reviewsListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 12,
    fontFamily: secondaryFont,
  },
  reviewItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  reviewItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewItemRating: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warning,
    fontFamily: secondaryFont,
  },
  reviewItemComment: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    fontFamily: secondaryFont,
  },
  bubblesScroll: {
    marginBottom: 16,
    marginHorizontal: -16,
  },
  bubblesContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    paddingVertical: 4,
    alignItems: 'center',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.gray[100],
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 10,
  },
  bubbleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  bubbleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  bubbleTextActive: {
    color: Colors.white,
  },
  noDishes: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    paddingVertical: 24,
    fontFamily: secondaryFont,
  },
  voirMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  voirMenuButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: secondaryFont,
  },
  menuCard: {
    marginBottom: 24,
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  menuCardHeader: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  menuCardImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  menuCardImagePlaceholder: {
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  menuCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    fontFamily: secondaryFont,
    marginBottom: 4,
  },
  menuCardDescription: {
    fontSize: 13,
    color: Colors.textLight,
    lineHeight: 18,
    fontFamily: secondaryFont,
    marginBottom: 4,
  },
  menuCardPlats: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  addMenuToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  addMenuToCartText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: secondaryFont,
    marginLeft: 8,
    flexShrink: 1,
  },
  menuCardDishes: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  menuBlock: {
    marginBottom: 24,
  },
  menuName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 6,
    fontFamily: secondaryFont,
  },
  menuDescription: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 12,
    lineHeight: 20,
    fontFamily: secondaryFont,
  },
});

export default RestaurantDetailsScreen;

