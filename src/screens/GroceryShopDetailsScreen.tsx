import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import {Colors} from '../utils/colors';
import IconWrapper from '../components/IconWrapper';
import GroceryShopProductCard from '../components/home/GroceryShopProductCard';
import {getGroceryCategoryIcon} from '../utils/groceryCategoryIcon';
import * as groceryShopApi from '../services/groceryShop';
import {formatAxiosError} from '../utils/formatApiError';

const ALL = 'Tous';

const GroceryShopDetailsScreen = ({route, navigation}: any) => {
  const {groceryShopId, groceryShopName} = route.params || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string | null>(groceryShopName ?? null);
  const [products, setProducts] = useState<groceryShopApi.GroceryShopProductApi[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL);

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
        const rows = await groceryShopApi.getProductsForGroceryShop(groceryShopId, {limit: 200});
        if (cancelled) return;
        setProducts(rows);
        if (rows[0]?.grocery_shop_name) {
          setShopName(rows[0].grocery_shop_name ?? null);
        } else if (!groceryShopName) {
          const shop = await groceryShopApi.getGroceryShopById(groceryShopId).catch(() => null);
          if (!cancelled && shop) setShopName(shop.name);
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
  }, [groceryShopId, groceryShopName]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => set.add((p.category ?? '').trim() || 'Autres'));
    return [ALL, ...Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === ALL) return products;
    return products.filter(p => ((p.category ?? '').trim() || 'Autres') === selectedCategory);
  }, [products, selectedCategory]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
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
        {shopName ? <Text style={styles.shopName}>{shopName}</Text> : null}
        <Text style={styles.productCount}>
          {products.length} produit{products.length > 1 ? 's' : ''}
        </Text>

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
                <Image source={getGroceryCategoryIcon(category)} style={styles.categoryIcon} resizeMode="cover" />
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
            filteredProducts.map(p => (
              <GroceryShopProductCard
                key={`${p.source ?? 'catalog'}-${p.id}`}
                product={p}
                onPress={() => {
                  if (p.source === 'dish' && p.restaurant_id != null) {
                    navigation.navigate('DishDetails', {dishId: p.id, restaurantId: p.restaurant_id});
                  }
                }}
              />
            ))
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  shopName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primaryDark ?? Colors.primary,
    marginBottom: 4,
  },
  productCount: {
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 16,
  },
  categoriesScroll: {
    paddingBottom: 8,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    marginRight: 10,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.category.orange.bg,
    borderColor: Colors.terracotta,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textLight,
    maxWidth: 110,
  },
  categoryLabelActive: {
    color: Colors.textDark,
  },
  productsList: {
    marginTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textLight,
  },
});

export default GroceryShopDetailsScreen;
