import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import {Colors, Radius} from '../utils/colors';
import IconWrapper from '../components/IconWrapper';
import {fontDisplay, fontDisplayMedium, fontHeading, fontUI} from '../utils/fonts';
import * as groceryShopApi from '../services/groceryShop';
import * as restaurantsApi from '../services/restaurants';
import {useCart} from '../contexts/CartContext';
import {getAbsoluteImageUrl} from '../utils/api';
import {formatAxiosError} from '../utils/formatApiError';

const namkeFallback = require('../assets/namke-fallback.png');
const ALL = 'Tous';
type Tab = 'rayons' | 'avis' | 'infos';

const formatPrice = (p: number | string) => {
  const n = typeof p === 'string' ? parseFloat(p) : p;
  if (Number.isNaN(n)) return '—';
  return `${n.toFixed(2).replace('.', ',')} €`;
};

const GroceryShopDetailsScreen = ({route, navigation}: any) => {
  const {groceryShopId, groceryShopName} = route.params || {};
  const {items, addItem} = useCart();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shop, setShop] = useState<groceryShopApi.GroceryShopApi | null>(null);
  const [restaurant, setRestaurant] = useState<restaurantsApi.RestaurantApi | null>(null);
  const [products, setProducts] = useState<groceryShopApi.GroceryShopProductApi[]>([]);
  const [reviews, setReviews] = useState<restaurantsApi.RestaurantReviewApi[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL);
  const [activeTab, setActiveTab] = useState<Tab>('rayons');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!groceryShopId) {
        setError('Épicerie introuvable');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [shopData, productRows] = await Promise.all([
          groceryShopApi.getGroceryShopById(groceryShopId).catch(() => null),
          groceryShopApi.getProductsForGroceryShop(groceryShopId, {limit: 200}),
        ]);
        if (cancelled) return;
        setShop(shopData);
        setProducts(productRows);
        if (shopData?.restaurant_id) {
          restaurantsApi
            .getRestaurantById(shopData.restaurant_id)
            .then(r => {
              if (!cancelled) setRestaurant(r);
            })
            .catch(() => {});
          restaurantsApi
            .getRestaurantReviews(shopData.restaurant_id)
            .then(rows => {
              if (!cancelled) setReviews(rows);
            })
            .catch(() => {});
        }
      } catch (e: any) {
        if (!cancelled) setError(formatAxiosError(e, 'Erreur de chargement'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [groceryShopId]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => set.add((p.category ?? '').trim() || 'Autres'));
    return [ALL, ...Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === ALL) return products;
    return products.filter(p => ((p.category ?? '').trim() || 'Autres') === selectedCategory);
  }, [products, selectedCategory]);

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleAddProduct = (p: groceryShopApi.GroceryShopProductApi) => {
    addItem({
      dishId: 0,
      groceryShopProductId: p.id,
      name: p.name,
      price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
      quantity: 1,
      imageUrl: p.image_url ?? undefined,
    });
  };

  const name = shop?.name ?? groceryShopName ?? 'Épicerie';
  const isOpen = shop?.is_active !== false && restaurant?.is_active !== false;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.darkGreen} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.coverWrap}>
          <Image
            source={shop?.banner_url ? {uri: getAbsoluteImageUrl(shop.banner_url) ?? shop.banner_url} : namkeFallback}
            style={styles.cover}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.roundButton}
            onPress={() => navigation.goBack()}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <IconWrapper name="arrow-back-outline" size={20} color={Colors.darkGreen} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View style={styles.identityRow}>
            <View style={styles.logoWrap}>
              <Image
                source={shop?.image_url ? {uri: getAbsoluteImageUrl(shop.image_url) ?? shop.image_url} : namkeFallback}
                style={styles.logo}
                resizeMode="cover"
              />
            </View>
          </View>

          <View style={styles.titleBlock}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{name}</Text>
              <View style={[styles.statusBadge, !isOpen && styles.statusBadgeClosed]}>
                <Text style={styles.statusBadgeText}>{isOpen ? 'Ouverte' : 'Fermée'}</Text>
              </View>
            </View>
            <Text style={styles.subLine} numberOfLines={2}>
              {[
                restaurant?.rating != null ? `★ ${restaurant.rating.toFixed(1)}` : null,
                reviews.length > 0 ? `${reviews.length} avis` : null,
                restaurant?.cuisine_type,
                restaurant?.city,
              ].filter(Boolean).join(' · ')}
            </Text>
            {(restaurant?.minimum_order != null || restaurant?.delivery_fee != null) && (
              <Text style={styles.deliveryLine}>
                {restaurant?.minimum_order != null ? `Min. ${restaurant.minimum_order.toFixed(0)} €` : ''}
                {restaurant?.minimum_order != null && restaurant?.delivery_fee != null ? ' · ' : ''}
                {restaurant?.delivery_fee != null ? `livraison ${restaurant.delivery_fee.toFixed(2)} €` : ''}
              </Text>
            )}
          </View>

          <View style={styles.tabsRow}>
            {(['rayons', 'avis', 'infos'] as Tab[]).map(tab => (
              <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tabButton}>
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'rayons' ? 'Rayons' : tab === 'avis' ? 'Avis' : 'Infos'}
                </Text>
                {activeTab === tab && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'rayons' && (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesScroll}>
                {categories.map(category => {
                  const isActive = selectedCategory === category;
                  return (
                    <TouchableOpacity
                      key={category}
                      style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                      onPress={() => setSelectedCategory(category)}
                      activeOpacity={0.85}>
                      <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]} numberOfLines={1}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.productsList}>
                {filteredProducts.length === 0 ? (
                  <View style={styles.emptyState}>
                    <IconWrapper name="basket-outline" size={40} color={Colors.gray[300]} />
                    <Text style={styles.emptyText}>Aucun produit dans cette catégorie</Text>
                  </View>
                ) : (
                  filteredProducts.map(p => {
                    const origin = [p.origin_country, p.origin_region].filter(Boolean).join(', ');
                    return (
                      <TouchableOpacity
                        key={`${p.source ?? 'catalog'}-${p.id}`}
                        style={styles.productRow}
                        activeOpacity={0.85}
                        onPress={() => {
                          if (p.source === 'dish' && p.restaurant_id != null) {
                            navigation.navigate('DishDetails', {dishId: p.id, restaurantId: p.restaurant_id});
                          } else {
                            navigation.navigate('GroceryProductDetail', {productId: p.id});
                          }
                        }}>
                        <Image
                          source={p.image_url ? {uri: getAbsoluteImageUrl(p.image_url) ?? p.image_url} : namkeFallback}
                          style={styles.productImage}
                          resizeMode="cover"
                        />
                        <View style={styles.productInfo}>
                          <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                          <Text style={styles.productMeta} numberOfLines={1}>
                            {[p.unit, origin].filter(Boolean).join(' · ')}
                          </Text>
                          <View style={styles.productPriceRow}>
                            <Text style={styles.productPrice}>{formatPrice(p.price)}</Text>
                            {p.stock_quantity > 0 && p.stock_quantity <= 5 && (
                              <Text style={styles.stockBadge}>{p.stock_quantity} restants</Text>
                            )}
                            <TouchableOpacity
                              style={styles.addButton}
                              onPress={e => {
                                e.stopPropagation();
                                handleAddProduct(p);
                              }}
                              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                              <IconWrapper name="add" size={18} color={Colors.white} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </>
          )}

          {activeTab === 'avis' && (
            <View style={styles.reviewsList}>
              {reviews.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconWrapper name="chatbubble-outline" size={40} color={Colors.gray[300]} />
                  <Text style={styles.emptyText}>Aucun avis pour le moment</Text>
                </View>
              ) : (
                reviews.map(r => (
                  <View key={r.id} style={styles.reviewCard}>
                    <Text style={styles.reviewRating}>★ {r.rating.toFixed(1)}</Text>
                    {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
                    <Text style={styles.reviewDate}>{new Date(r.created_at).toLocaleDateString('fr-FR')}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'infos' && (
            <View style={styles.infosList}>
              {shop?.description ? (
                <View style={styles.infoRow}>
                  <IconWrapper name="information-circle-outline" size={20} color={Colors.darkGreen} />
                  <Text style={styles.infoText}>{shop.description}</Text>
                </View>
              ) : null}
              {restaurant?.address ? (
                <View style={styles.infoRow}>
                  <IconWrapper name="location-outline" size={20} color={Colors.darkGreen} />
                  <Text style={styles.infoText}>{restaurant.address}</Text>
                </View>
              ) : null}
              {restaurant?.phone ? (
                <View style={styles.infoRow}>
                  <IconWrapper name="call-outline" size={20} color={Colors.darkGreen} />
                  <Text style={styles.infoText}>{restaurant.phone}</Text>
                </View>
              ) : null}
              {!shop?.description && !restaurant?.address && !restaurant?.phone && (
                <Text style={styles.emptyText}>Aucune information disponible.</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {cartCount > 0 && (
        <View style={styles.cartBar}>
          <TouchableOpacity style={styles.cartButton} activeOpacity={0.9} onPress={() => navigation.navigate('Cart')}>
            <Text style={styles.cartButtonText}>
              Voir le panier · {cartCount} article{cartCount > 1 ? 's' : ''}
            </Text>
            <Text style={styles.cartButtonTotal}>{formatPrice(cartTotal)}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    fontFamily: fontUI,
    color: Colors.textLight,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  coverWrap: {
    position: 'relative',
    height: 170,
  },
  cover: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.gray[100],
  },
  roundButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(252,251,245,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 22,
  },
  identityRow: {
    marginTop: -32,
    flexDirection: 'row',
  },
  logoWrap: {
    width: 68,
    height: 68,
    borderRadius: 18,
    borderWidth: 4,
    borderColor: Colors.backgroundLight,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  titleBlock: {
    marginTop: 12,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 23,
    fontFamily: fontDisplay,
    color: Colors.text,
  },
  statusBadge: {
    backgroundColor: Colors.olive,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  statusBadgeClosed: {
    backgroundColor: Colors.gray[400],
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: fontHeading,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: Colors.namkeBlack,
  },
  subLine: {
    fontSize: 13,
    fontFamily: fontUI,
    color: Colors.textLight,
  },
  deliveryLine: {
    fontSize: 13,
    fontFamily: fontHeading,
    color: Colors.darkGreen,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabButton: {
    paddingBottom: 11,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    fontFamily: fontUI,
    color: Colors.textLight,
  },
  tabTextActive: {
    fontFamily: fontHeading,
    color: Colors.darkGreen,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    height: 3,
    width: '100%',
    borderRadius: 2,
    backgroundColor: Colors.terracotta,
  },
  categoriesScroll: {
    gap: 8,
    paddingVertical: 14,
  },
  categoryChip: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.darkGreen,
    borderColor: Colors.darkGreen,
  },
  categoryLabel: {
    fontSize: 12.5,
    fontFamily: fontUI,
    color: Colors.text,
  },
  categoryLabelActive: {
    color: Colors.cream,
    fontFamily: fontHeading,
  },
  productsList: {
    gap: 10,
  },
  productRow: {
    flexDirection: 'row',
    gap: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 11,
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 15,
    backgroundColor: Colors.gray[100],
  },
  productInfo: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  productName: {
    fontSize: 15.5,
    fontFamily: fontDisplayMedium,
    color: Colors.text,
  },
  productMeta: {
    fontSize: 12,
    fontFamily: fontUI,
    color: Colors.textLight,
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productPrice: {
    fontSize: 15,
    fontFamily: fontHeading,
    color: Colors.text,
  },
  stockBadge: {
    fontSize: 10.5,
    fontFamily: fontUI,
    color: Colors.textLight,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  addButton: {
    marginLeft: 'auto',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewsList: {
    gap: 12,
    paddingVertical: 14,
  },
  reviewCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 14,
    gap: 4,
  },
  reviewRating: {
    fontSize: 13,
    fontFamily: fontHeading,
    color: Colors.darkGreen,
  },
  reviewComment: {
    fontSize: 14,
    fontFamily: fontUI,
    color: Colors.text,
  },
  reviewDate: {
    fontSize: 11.5,
    fontFamily: fontUI,
    color: Colors.textLight,
  },
  infosList: {
    gap: 14,
    paddingVertical: 14,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontUI,
    color: Colors.text,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fontUI,
    color: Colors.textLight,
    textAlign: 'center',
  },
  cartBar: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.backgroundLight,
  },
  cartButton: {
    backgroundColor: Colors.darkGreen,
    borderRadius: Radius.pill,
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  cartButtonText: {
    fontSize: 15.5,
    fontFamily: fontHeading,
    color: Colors.cream,
  },
  cartButtonTotal: {
    fontSize: 14.5,
    fontFamily: fontUI,
    color: Colors.mustard,
  },
});

export default GroceryShopDetailsScreen;
