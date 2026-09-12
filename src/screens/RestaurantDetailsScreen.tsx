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
} from 'react-native';
import {alert} from '../utils/alert';
import IconWrapper from '../components/IconWrapper';
import RestaurantMap from '../components/RestaurantMap';
import {Colors, Radius} from '../utils/colors';
import {secondaryFont, fontButton, fontDisplay, fontDisplayMedium, fontHeading} from '../utils/fonts';
import SectionHeader from '../components/home/SectionHeader';
import {useFavorites} from '../contexts/FavoritesContext';
import {useCart} from '../contexts/CartContext';
import * as restaurantsApi from '../services/restaurants';
import {getLoyaltyAccount} from '../services/loyalty';
import {getAbsoluteImageUrl} from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {formatAxiosError} from '../utils/formatApiError';
import ReportModal from '../components/ReportModal';

interface RestaurantDetailsScreenProps {
  route: any;
  navigation: any;
}

type DetailTab = 'carte' | 'avis' | 'infos';

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
  const [detailTab, setDetailTab] = useState<DetailTab>('carte');
  const [cardTab, setCardTab] = useState<'menu' | 'plats'>('plats');
  const [reviews, setReviews] = useState<restaurantsApi.RestaurantReviewApi[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loyaltyPointsBalance, setLoyaltyPointsBalance] = useState<number | null>(null);
  const [loyaltyBalanceLoading, setLoyaltyBalanceLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
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
            avatarUrl: restData.profile?.logo_url || undefined,
            description: restData.description,
            address: restData.address,
            city: restData.city,
            latitude: restData.latitude,
            longitude: restData.longitude,
            phone: restData.phone,
            hours: hoursDisplay,
            minimumOrder: restData.minimum_order ?? undefined,
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
      alert('Erreur', 'Veuillez choisir une note entre 1 et 5 étoiles.');
      return;
    }
    if (!isLoggedIn) {
      alert('Connexion requise', 'Connectez-vous pour laisser un avis.');
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
      alert('Merci !', 'Votre avis a bien été enregistré.');
    } catch (e: any) {
      const msg = formatAxiosError(e, 'Erreur lors de l\'envoi.');
      if (msg.toLowerCase().includes('already reviewed')) {
        setUserHasReviewed(true);
        alert('Déjà avis', 'Vous avez déjà laissé un avis pour ce restaurant.');
      } else {
        alert('Erreur', msg);
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Couverture */}
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
              </View>
            );
          })()}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <IconWrapper name="arrow-back-outline" size={22} color={Colors.darkGreen} />
          </TouchableOpacity>
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
              size={22}
              color={isFavorite ? Colors.error : Colors.terracotta}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => setShowReportModal(true)}>
            <IconWrapper name="flag-outline" size={18} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Avatar */}
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrap}>
              {restaurant.avatarUrl ? (
                <Image source={{uri: getAbsoluteImageUrl(restaurant.avatarUrl)}} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                  <IconWrapper name="restaurant-outline" size={26} color={Colors.textLight} />
                </View>
              )}
            </View>
          </View>

          {/* Titre + meta */}
          <View style={styles.header}>
            <Text style={styles.name}>{restaurant.name}</Text>
            <Text style={styles.metaLine}>
              ★ {displayRating} · {reviews.length} avis · {restaurant.cuisine}
              {restaurant.city ? ` · ${restaurant.city}` : ''}
            </Text>
            {restaurant.minimumOrder != null && (
              <Text style={styles.metaHighlight}>Min. {Number(restaurant.minimumOrder).toFixed(0)} €</Text>
            )}
          </View>

          {/* Onglets Carte / Avis / Infos */}
          <View style={styles.tabContainer}>
            {([
              {key: 'carte', label: 'Carte'},
              {key: 'avis', label: `Avis${reviews.length > 0 ? ` (${reviews.length})` : ''}`},
              {key: 'infos', label: 'Infos'},
            ] as {key: DetailTab; label: string}[]).map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={styles.tab}
                onPress={() => setDetailTab(tab.key)}
                activeOpacity={0.7}>
                <Text style={[styles.tabText, detailTab === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </Text>
                {detailTab === tab.key && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            ))}
          </View>

          {detailTab === 'carte' && (
            <View style={styles.section}>
              <View style={styles.cardSubTabs}>
                <TouchableOpacity
                  style={[styles.cardSubTab, cardTab === 'plats' && styles.cardSubTabActive]}
                  onPress={() => setCardTab('plats')}
                  activeOpacity={0.8}>
                  <Text style={[styles.cardSubTabText, cardTab === 'plats' && styles.cardSubTabTextActive]}>
                    Plats {dishes.length > 0 ? `(${dishes.length})` : ''}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cardSubTab, cardTab === 'menu' && styles.cardSubTabActive]}
                  onPress={() => setCardTab('menu')}
                  activeOpacity={0.8}>
                  <Text style={[styles.cardSubTabText, cardTab === 'menu' && styles.cardSubTabTextActive]}>
                    Menus {menusWithDishes.length > 0 ? `(${menusWithDishes.length})` : ''}
                  </Text>
                </TouchableOpacity>
              </View>

              {cardTab === 'plats' ? (
                <>
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
                    filteredDishes.map(dish => {
                      const dishUri = getAbsoluteImageUrl(dish.imageUrl);
                      return (
                        <TouchableOpacity
                          key={dish.id}
                          style={styles.dishRow}
                          activeOpacity={0.85}
                          onPress={() =>
                            navigation.navigate('DishDetails', {
                              dishId: dish.id,
                              restaurantId: restaurant.id,
                            })
                          }>
                          {dishUri ? (
                            <Image source={{uri: dishUri}} style={styles.dishRowImage} resizeMode="cover" />
                          ) : (
                            <View style={[styles.dishRowImage, styles.dishRowImagePlaceholder]}>
                              <IconWrapper name="restaurant-outline" size={24} color={Colors.textLight} />
                            </View>
                          )}
                          <View style={styles.dishRowInfo}>
                            <Text style={styles.dishRowName} numberOfLines={1}>{dish.name}</Text>
                            {dish.description ? (
                              <Text style={styles.dishRowDescription} numberOfLines={1}>{dish.description}</Text>
                            ) : null}
                            <View style={styles.dishRowFooter}>
                              <Text style={styles.dishRowPrice}>{dish.price.toFixed(2)} €</Text>
                              <TouchableOpacity
                                style={styles.dishRowAdd}
                                onPress={() => {
                                  addItem({
                                    dishId: Number(dish.id),
                                    restaurantId: restaurant.id,
                                    name: dish.name,
                                    price: dish.price,
                                    quantity: 1,
                                    imageUrl: dish.imageUrl ?? undefined,
                                    deliveryFee: deliveryFeeNum > 0 ? deliveryFeeNum : undefined,
                                  });
                                }}
                                activeOpacity={0.8}>
                                <IconWrapper name="add" size={18} color={Colors.namkeWhite} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </>
              ) : menusWithDishes.length > 0 ? (
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
          )}

          {detailTab === 'avis' && (
            <View style={styles.section}>
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
              {reviews.length > 0 ? (
                <View style={styles.reviewsList}>
                  {reviews.map(r => (
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
              ) : (
                <Text style={styles.noDishes}>Aucun avis pour le moment.</Text>
              )}
            </View>
          )}

          {detailTab === 'infos' && (
            <View style={styles.section}>
              {restaurant.description ? (
                <View style={styles.infoBlock}>
                  <Text style={styles.sectionTitle}>À propos</Text>
                  <Text style={styles.description}>{restaurant.description}</Text>
                </View>
              ) : null}

              <View style={styles.infoBlock}>
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
                <RestaurantMap
                  latitude={restaurant.latitude}
                  longitude={restaurant.longitude}
                  address={restaurant.address}
                  city={restaurant.city}
                />
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

              {galleryImages.length > 0 && (
                <View style={styles.infoBlock}>
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
            </View>
          )}
        </View>
      </ScrollView>

      {cartForRestaurant.count > 0 && (
        <View style={styles.cartBar}>
          <TouchableOpacity
            style={styles.cartBarButton}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.85}>
            <Text style={styles.cartBarText}>
              Voir le panier · {cartForRestaurant.count} article{cartForRestaurant.count > 1 ? 's' : ''}
            </Text>
            <Text style={styles.cartBarPrice}>{cartForRestaurant.total.toFixed(2)} €</Text>
          </TouchableOpacity>
        </View>
      )}

      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        restaurantId={restaurant ? Number(restaurant.id) : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  scrollContent: {
    paddingBottom: 24,
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
    height: 230,
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
  backButton: {
    position: 'absolute',
    top: 16,
    left: 20,
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(252,251,245,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(252,251,245,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportButton: {
    position: 'absolute',
    top: 72,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(252,251,245,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 22,
  },
  avatarRow: {
    marginTop: -34,
    marginBottom: 10,
  },
  avatarWrap: {
    width: 76,
    height: 76,
    borderRadius: Radius.pill,
    borderWidth: 4,
    borderColor: Colors.background,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 10,
    gap: 5,
  },
  name: {
    fontSize: 26,
    color: Colors.text,
    fontFamily: fontDisplay,
  },
  metaLine: {
    fontSize: 13,
    color: Colors.textLight,
    fontFamily: fontHeading,
  },
  metaHighlight: {
    fontSize: 13,
    fontFamily: fontHeading,
    color: Colors.darkGreen,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 22,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 16,
  },
  tab: {
    paddingBottom: 12,
  },
  tabText: {
    fontSize: 15,
    fontFamily: secondaryFont,
    color: Colors.textLight,
  },
  tabTextActive: {
    color: Colors.darkGreen,
    fontFamily: fontButton,
  },
  tabIndicator: {
    marginTop: 8,
    height: 3,
    borderRadius: Radius.pill,
    backgroundColor: Colors.terracotta,
  },
  cardSubTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    padding: 4,
    marginBottom: 16,
  },
  cardSubTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },
  cardSubTabActive: {
    backgroundColor: Colors.primary,
  },
  cardSubTabText: {
    fontSize: 13.5,
    fontFamily: fontHeading,
    color: Colors.textLight,
  },
  cardSubTabTextActive: {
    color: Colors.white,
  },
  section: {
    marginBottom: 24,
  },
  infoBlock: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    color: Colors.text,
    marginBottom: 12,
    fontFamily: fontDisplay,
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
  loyaltyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 14,
    marginBottom: 24,
    gap: 12,
  },
  loyaltyBannerTextWrap: {
    flex: 1,
  },
  loyaltyBannerTitle: {
    fontSize: 15,
    color: Colors.text,
    marginBottom: 4,
    fontFamily: fontDisplayMedium,
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
    fontFamily: fontHeading,
    color: Colors.primary,
  },
  loyaltyHint: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.textLight,
    fontStyle: 'italic',
    fontFamily: secondaryFont,
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
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
  reviewSubmitDisabled: {
    opacity: 0.7,
  },
  reviewSubmitText: {
    fontSize: 16,
    color: Colors.white,
    fontFamily: fontButton,
  },
  reviewsList: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
    color: Colors.warning,
    fontFamily: fontHeading,
  },
  reviewItemComment: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    fontFamily: secondaryFont,
  },
  bubblesScroll: {
    marginBottom: 16,
    marginHorizontal: -22,
  },
  bubblesContainer: {
    paddingHorizontal: 22,
    flexDirection: 'row',
    paddingVertical: 4,
    alignItems: 'center',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    marginRight: 10,
  },
  bubbleActive: {
    backgroundColor: Colors.darkGreen,
  },
  bubbleText: {
    fontSize: 13.5,
    color: Colors.text,
    fontFamily: fontHeading,
  },
  bubbleTextActive: {
    color: Colors.cream,
  },
  noDishes: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    paddingVertical: 24,
    fontFamily: secondaryFont,
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 12,
    marginBottom: 12,
  },
  dishRowImage: {
    width: 74,
    height: 74,
    borderRadius: 18,
    backgroundColor: Colors.gray[100],
  },
  dishRowImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dishRowInfo: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  dishRowName: {
    fontSize: 17,
    fontFamily: fontDisplayMedium,
    color: Colors.text,
  },
  dishRowDescription: {
    fontSize: 12.5,
    fontFamily: secondaryFont,
    color: Colors.textLight,
  },
  dishRowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dishRowPrice: {
    fontSize: 15.5,
    fontFamily: fontHeading,
    color: Colors.text,
  },
  dishRowAdd: {
    marginLeft: 'auto',
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: Colors.terracotta,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voirMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
  },
  voirMenuButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontFamily: fontHeading,
  },
  menuCard: {
    marginBottom: 16,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    padding: 12,
  },
  menuCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuCardImage: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
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
    color: Colors.text,
    fontFamily: fontDisplayMedium,
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
    borderRadius: Radius.pill,
    marginTop: 12,
  },
  addMenuToCartText: {
    fontSize: 14,
    color: Colors.white,
    fontFamily: fontButton,
    marginLeft: 8,
    flexShrink: 1,
  },
  cartBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cartBarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.darkGreen,
    borderRadius: Radius.pill,
    minHeight: 56,
  },
  cartBarText: {
    fontSize: 16,
    fontFamily: fontButton,
    color: Colors.cream,
  },
  cartBarPrice: {
    fontSize: 16,
    fontFamily: fontHeading,
    color: Colors.cream,
  },
});

export default RestaurantDetailsScreen;
