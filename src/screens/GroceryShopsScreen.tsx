import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import IconWrapper from '../components/IconWrapper';
import {Colors, Radius} from '../utils/colors';
import {fontDisplay, fontDisplayMedium, fontHeading, fontUI} from '../utils/fonts';
import * as groceryShopApi from '../services/groceryShop';
import * as restaurantsApi from '../services/restaurants';
import {getAbsoluteImageUrl} from '../utils/api';

const namkeFallback = require('../assets/namke-fallback.png');

interface ShopWithInfo extends groceryShopApi.GroceryShopApi {
  city?: string;
  cuisine_type?: string;
  rating?: number;
  delivery_fee?: number;
  minimum_order?: number;
  isOpen: boolean;
}

const GroceryShopsScreen = ({navigation}: any) => {
  const [shops, setShops] = useState<ShopWithInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const shopsRes = await groceryShopApi.getGroceryShops().catch(() => []);
      const enriched = await Promise.all(
        shopsRes.map(async (shop): Promise<ShopWithInfo> => {
          if (!shop.restaurant_id) {
            return {...shop, isOpen: shop.is_active};
          }
          try {
            const restaurant = await restaurantsApi.getRestaurantById(shop.restaurant_id);
            if (!restaurant) return {...shop, isOpen: shop.is_active};
            return {
              ...shop,
              city: restaurant.city,
              cuisine_type: restaurant.cuisine_type,
              rating: restaurant.rating,
              delivery_fee: restaurant.delivery_fee,
              minimum_order: restaurant.minimum_order,
              isOpen: restaurant.is_active !== false && shop.is_active,
            };
          } catch {
            return {...shop, isOpen: shop.is_active};
          }
        }),
      );
      setShops(enriched);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const cuisineOptions = useMemo(() => {
    const set = new Set<string>();
    shops.forEach(s => {
      if (s.cuisine_type) set.add(s.cuisine_type);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [shops]);

  const filteredShops = useMemo(() => {
    let list = shops;
    if (onlyOpen) list = list.filter(s => s.isOpen);
    if (selectedCuisine) list = list.filter(s => s.cuisine_type === selectedCuisine);
    const q = query.trim().toLowerCase();
    if (q.length > 0) {
      list = list.filter(
        s =>
          s.name.toLowerCase().includes(q) ||
          (s.description ?? '').toLowerCase().includes(q) ||
          (s.cuisine_type ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [shops, onlyOpen, selectedCuisine, query]);

  const [featured, ...rest] = filteredShops;

  const goToShop = (shop: ShopWithInfo) =>
    navigation.navigate('GroceryShopDetails', {groceryShopId: shop.id, groceryShopName: shop.name});

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Épiceries</Text>
        <Text style={styles.pageSubtitle}>
          {loading ? 'Chargement…' : `${filteredShops.length} épicerie${filteredShops.length > 1 ? 's' : ''} disponible${filteredShops.length > 1 ? 's' : ''}`}
        </Text>

        <View style={styles.searchBar}>
          <IconWrapper name="search-outline" size={18} color={Colors.darkGreen} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Une boutique, un produit, un rayon…"
            placeholderTextColor={Colors.textLight}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.chipsRow}>
          <TouchableOpacity
            style={[styles.chip, !onlyOpen && styles.chipActive]}
            onPress={() => setOnlyOpen(false)}
            activeOpacity={0.85}>
            <Text style={[styles.chipText, !onlyOpen && styles.chipTextActive]}>Toutes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, onlyOpen && styles.chipActive]}
            onPress={() => setOnlyOpen(true)}
            activeOpacity={0.85}>
            <Text style={[styles.chipText, onlyOpen && styles.chipTextActive]}>Ouvertes</Text>
          </TouchableOpacity>
        </View>

        {cuisineOptions.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cuisineRow}>
            {cuisineOptions.map(cuisine => {
              const active = selectedCuisine === cuisine;
              return (
                <TouchableOpacity
                  key={cuisine}
                  style={[styles.cuisineChip, active && styles.cuisineChipActive]}
                  onPress={() => setSelectedCuisine(active ? null : cuisine)}
                  activeOpacity={0.85}>
                  <Text style={[styles.cuisineChipText, active && styles.cuisineChipTextActive]}>{cuisine}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={[Colors.darkGreen]} />
        }>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.darkGreen} style={styles.loading} />
        ) : filteredShops.length === 0 ? (
          <View style={styles.emptyState}>
            <IconWrapper name="storefront-outline" size={44} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>Aucune épicerie ne correspond à votre recherche</Text>
          </View>
        ) : (
          <>
            {featured && (
              <TouchableOpacity style={styles.featuredCard} onPress={() => goToShop(featured)} activeOpacity={0.9}>
                <View style={styles.featuredImageWrap}>
                  <Image
                    source={featured.banner_url ? {uri: getAbsoluteImageUrl(featured.banner_url) ?? featured.banner_url} : namkeFallback}
                    style={styles.featuredImage}
                    resizeMode="cover"
                  />
                  <View style={[styles.statusBadge, !featured.isOpen && styles.statusBadgeClosed]}>
                    <Text style={styles.statusBadgeText}>{featured.isOpen ? 'Ouverte' : 'Fermée'}</Text>
                  </View>
                </View>
                <View style={styles.featuredBody}>
                  <View style={styles.featuredTitleRow}>
                    <Text style={styles.featuredName}>{featured.name}</Text>
                    {featured.rating != null && <Text style={styles.rating}>★ {featured.rating.toFixed(1)}</Text>}
                  </View>
                  <Text style={styles.meta} numberOfLines={1}>
                    {[featured.cuisine_type, featured.city].filter(Boolean).join(' · ') || `${featured.products_count ?? ''} produits`.trim()}
                  </Text>
                  <View style={styles.footerRow}>
                    {(featured.minimum_order != null || featured.delivery_fee != null) && (
                      <Text style={styles.footerText}>
                        {featured.minimum_order != null ? `Min. ${featured.minimum_order.toFixed(0)} €` : ''}
                        {featured.minimum_order != null && featured.delivery_fee != null ? ' · ' : ''}
                        {featured.delivery_fee != null ? `frais ${featured.delivery_fee.toFixed(2)} €` : ''}
                      </Text>
                    )}
                    <View style={styles.visitButton}>
                      <Text style={styles.visitButtonText}>Visiter</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {rest.map(shop => (
              <TouchableOpacity key={shop.id} style={styles.compactRow} onPress={() => goToShop(shop)} activeOpacity={0.85}>
                <Image
                  source={shop.image_url ? {uri: getAbsoluteImageUrl(shop.image_url) ?? shop.image_url} : namkeFallback}
                  style={styles.compactImage}
                  resizeMode="cover"
                />
                <View style={styles.compactInfo}>
                  <Text style={styles.compactName} numberOfLines={1}>{shop.name}</Text>
                  <Text style={styles.compactMeta} numberOfLines={1}>
                    {[shop.cuisine_type, shop.city].filter(Boolean).join(' · ') || (shop.isOpen ? 'Ouverte' : 'Fermée')}
                  </Text>
                </View>
                {shop.rating != null && <Text style={styles.rating}>★ {shop.rating.toFixed(1)}</Text>}
              </TouchableOpacity>
            ))}
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
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 12,
  },
  pageTitle: {
    fontSize: 26,
    fontFamily: fontDisplay,
    color: Colors.text,
  },
  pageSubtitle: {
    fontSize: 12.5,
    fontFamily: fontUI,
    color: Colors.textLight,
    marginTop: -6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: Radius.pill,
    paddingHorizontal: 18,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    fontFamily: fontUI,
    color: Colors.text,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
  },
  chipActive: {
    backgroundColor: Colors.darkGreen,
  },
  chipText: {
    fontSize: 13,
    fontFamily: fontHeading,
    color: Colors.text,
  },
  chipTextActive: {
    color: Colors.cream,
  },
  cuisineRow: {
    gap: 8,
  },
  cuisineChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cuisineChipActive: {
    backgroundColor: Colors.darkGreen,
    borderColor: Colors.darkGreen,
  },
  cuisineChipText: {
    fontSize: 12.5,
    fontFamily: fontUI,
    color: Colors.text,
  },
  cuisineChipTextActive: {
    color: Colors.cream,
  },
  scrollContent: {
    padding: 22,
    paddingBottom: 40,
    gap: 14,
  },
  loading: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14.5,
    fontFamily: fontUI,
    color: Colors.textLight,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  featuredCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  featuredImageWrap: {
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: 132,
    backgroundColor: Colors.gray[100],
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: Colors.olive,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  statusBadgeClosed: {
    backgroundColor: Colors.gray[400],
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontFamily: fontHeading,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: Colors.namkeBlack,
  },
  featuredBody: {
    padding: 16,
    gap: 6,
  },
  featuredTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  featuredName: {
    fontSize: 19,
    fontFamily: fontDisplayMedium,
    color: Colors.text,
    flexShrink: 1,
  },
  rating: {
    marginLeft: 'auto',
    fontSize: 12.5,
    fontFamily: fontHeading,
    color: Colors.darkGreen,
  },
  meta: {
    fontSize: 12.5,
    fontFamily: fontUI,
    color: Colors.textLight,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  footerText: {
    fontSize: 12,
    fontFamily: fontUI,
    color: Colors.textLight,
    flex: 1,
  },
  visitButton: {
    backgroundColor: Colors.terracotta,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: Radius.pill,
  },
  visitButtonText: {
    fontSize: 13,
    fontFamily: fontHeading,
    color: Colors.white,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 12,
  },
  compactImage: {
    width: 66,
    height: 66,
    borderRadius: 18,
    backgroundColor: Colors.gray[100],
  },
  compactInfo: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  compactName: {
    fontSize: 16.5,
    fontFamily: fontDisplayMedium,
    color: Colors.text,
  },
  compactMeta: {
    fontSize: 12.5,
    fontFamily: fontUI,
    color: Colors.textLight,
  },
});

export default GroceryShopsScreen;
