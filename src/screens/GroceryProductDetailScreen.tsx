import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import IconWrapper from '../components/IconWrapper';
import {Colors, Radius} from '../utils/colors';
import {fontButton, fontDisplay, fontDisplayMedium, fontHeading, fontUI} from '../utils/fonts';
import {getGroceryShopProductById, type GroceryShopProductApi} from '../services/groceryShop';
import {getAbsoluteImageUrl} from '../utils/api';
import {useCart} from '../contexts/CartContext';

const namkeFallback = require('../assets/namke-fallback.png');

const formatPrice = (p: number | string) => {
  const n = typeof p === 'string' ? parseFloat(p) : p;
  if (Number.isNaN(n)) return '—';
  return `${n.toFixed(2)} €`;
};

const GroceryProductDetailScreen = ({navigation, route}: any) => {
  const {productId} = route.params || {};
  const {addItem} = useCart();
  const [product, setProduct] = useState<GroceryShopProductApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getGroceryShopProductById(productId);
        if (!cancelled) setProduct(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Produit introuvable</Text>
        </View>
      </View>
    );
  }

  const origin = [product.origin_country, product.origin_region].filter(Boolean).join(', ');
  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
  const total = (Number.isNaN(price) ? 0 : price) * quantity;
  const maxStock = Math.max(1, product.stock_quantity ?? 1);

  const handleAddToCart = () => {
    addItem({
      dishId: 0,
      groceryShopProductId: product.id,
      restaurantId: product.restaurant_id ?? undefined,
      name: product.name,
      price: Number.isNaN(price) ? 0 : price,
      quantity,
      imageUrl: product.image_url ?? undefined,
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageContainer}>
          <Image
            source={product.image_url ? {uri: getAbsoluteImageUrl(product.image_url) ?? product.image_url} : namkeFallback}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <IconWrapper name="arrow-back-outline" size={22} color={Colors.darkGreen} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{product.name}</Text>
            <Text style={styles.headerPrice}>{formatPrice(product.price)}</Text>
          </View>
          <Text style={styles.metaLine}>
            {[product.unit ? `au ${product.unit}` : null, origin || null].filter(Boolean).join(' · ')}
          </Text>
          {product.description ? <Text style={styles.description}>{product.description}</Text> : null}

          <View style={styles.infoBox}>
            {origin ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Origine</Text>
                <Text style={styles.infoValue}>{origin}</Text>
              </View>
            ) : null}
            {product.category ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Catégorie</Text>
                <Text style={styles.infoValue}>{product.category}</Text>
              </View>
            ) : null}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Stock restant</Text>
              <Text style={[styles.infoValue, styles.infoValueAccent]}>
                {product.stock_quantity} {product.unit || ''}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButtonMinus}
            onPress={() => setQuantity(q => Math.max(1, q - 1))}>
            <IconWrapper name="remove-outline" size={18} color={Colors.darkGreen} />
          </TouchableOpacity>
          <Text style={styles.quantity}>{quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButtonPlus}
            onPress={() => setQuantity(q => Math.min(maxStock, q + 1))}>
            <IconWrapper name="add-outline" size={18} color={Colors.cream} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart} activeOpacity={0.85}>
          <Text style={styles.addToCartText}>Ajouter · {formatPrice(total)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textLight,
    fontFamily: fontUI,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  imageContainer: {
    height: 292,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.gray[100],
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
  content: {
    padding: 22,
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  name: {
    flex: 1,
    fontSize: 27,
    fontFamily: fontDisplay,
    color: Colors.text,
  },
  headerPrice: {
    fontSize: 23,
    fontFamily: fontDisplay,
    color: Colors.text,
  },
  metaLine: {
    fontSize: 13,
    fontFamily: fontHeading,
    color: Colors.textLight,
  },
  description: {
    fontSize: 14.5,
    fontFamily: fontUI,
    color: Colors.text,
    lineHeight: 21,
  },
  infoBox: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 13,
    fontFamily: fontUI,
    color: Colors.textLight,
  },
  infoValue: {
    fontSize: 13,
    fontFamily: fontButton,
    color: Colors.text,
  },
  infoValueAccent: {
    color: Colors.darkGreen,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 22,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    padding: 5,
  },
  quantityButtonMinus: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonPlus: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Colors.darkGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    minWidth: 26,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: fontHeading,
    color: Colors.text,
  },
  addToCartButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: Radius.pill,
    backgroundColor: Colors.terracotta,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartText: {
    fontSize: 16,
    fontFamily: fontButton,
    color: Colors.namkeWhite,
  },
});

export default GroceryProductDetailScreen;
