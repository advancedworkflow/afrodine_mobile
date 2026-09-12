import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import IconWrapper from '../components/IconWrapper';
import {Colors, Radius} from '../utils/colors';
import {secondaryFont, fontButton, fontDisplay, fontHeading} from '../utils/fonts';
import * as dishesApi from '../services/dishes';
import * as supplementsApi from '../services/supplements';
import * as restaurantsApi from '../services/restaurants';
import {useCart} from '../contexts/CartContext';
import type {CartExtra} from '../contexts/CartContext';

interface DishDetailsScreenProps {
  route: any;
  navigation: any;
}

const DishDetailsScreen: React.FC<DishDetailsScreenProps> = ({
  route,
  navigation,
}) => {
  const {dishId, restaurantId} = route.params || {};
  const {addItem} = useCart();
  const [dish, setDish] = useState<dishesApi.DishForDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [supplements, setSupplements] = useState<supplementsApi.SupplementApi[]>([]);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const id = Number(dishId) || dishId;
        const data = await dishesApi.getDishById(id);
        if (cancelled) return;
        setDish(data || null);
      } catch (e) {
        if (!cancelled) setDish(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dishId]);

  useEffect(() => {
    if (!dish?.id) {
      setSupplements([]);
      setSelectedExtras([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await supplementsApi.getSupplementsForDish(Number(dish.id));
        if (!cancelled) setSupplements(list);
      } catch (_) {
        if (!cancelled) setSupplements([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dish?.id]);

  useEffect(() => {
    if (!dish?.restaurantId) {
      setDeliveryFee(0);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const rest = await restaurantsApi.getRestaurantById(dish.restaurantId!);
        if (!cancelled && rest?.delivery_fee != null) setDeliveryFee(Number(rest.delivery_fee));
        else if (!cancelled) setDeliveryFee(0);
      } catch (_) {
        if (!cancelled) setDeliveryFee(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dish?.restaurantId]);

  useEffect(() => {
    if (dish) {
      navigation.setOptions({title: dish.name});
    }
  }, [dish, navigation]);

  const totalPrice = dish
    ? dish.price * quantity +
      supplements
        .filter(s => selectedExtras.includes(String(s.id)))
        .reduce((sum, s) => sum + s.price, 0)
    : 0;

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
  if (!dish) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Plat introuvable</Text>
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
          <Image
            source={{uri: dish.imageUrl}}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <View style={styles.headerOverlay} />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <IconWrapper name="arrow-back-outline" size={22} color={Colors.darkGreen} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => setIsFavorite(!isFavorite)}>
            <IconWrapper
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? Colors.error : Colors.terracotta}
            />
          </TouchableOpacity>
        </View>

        {/* Dish Info */}
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.name} numberOfLines={2}>{dish.name}</Text>
              <Text style={styles.headerPrice}>{dish.price.toFixed(2)} €</Text>
            </View>
            <Text style={styles.metaLine}>
              {dish.restaurantName ? `${dish.restaurantName} · ` : ''}
              {dish.rating != null ? `★ ${dish.rating} · ` : ''}
              {dish.deliveryTime ?? '—'}
            </Text>
            <Text style={styles.description}>{dish.description}</Text>
          </View>

          {/* Ingredients */}
          {dish.ingredients && dish.ingredients.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingrédients</Text>
              <View style={styles.ingredientsList}>
                {dish.ingredients.map((ingredient: string, index: number) => (
                  <View key={index} style={styles.ingredientTag}>
                    <Text style={styles.ingredientText}>{ingredient}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Allergens */}
          {dish.allergens && dish.allergens.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Allergènes</Text>
              <View style={styles.allergensList}>
                {dish.allergens.map((allergen: string, index: number) => (
                  <View key={index} style={styles.allergenTag}>
                    <IconWrapper name="warning-outline" size={16} color={Colors.error} />
                    <Text style={styles.allergenText}>{allergen}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Suppléments (depuis la base de données) */}
          {supplements.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Accompagnements</Text>
              {supplements.map(sup => (
                <TouchableOpacity
                  key={sup.id}
                  style={[
                    styles.extraItem,
                    selectedExtras.includes(String(sup.id)) && styles.extraItemSelected,
                  ]}
                  onPress={() => {
                    if (selectedExtras.includes(String(sup.id))) {
                      setSelectedExtras(selectedExtras.filter(id => id !== String(sup.id)));
                    } else {
                      setSelectedExtras([...selectedExtras, String(sup.id)]);
                    }
                  }}>
                  <View style={styles.extraItemLeft}>
                    <View
                      style={[
                        styles.checkbox,
                        selectedExtras.includes(String(sup.id)) && styles.checkboxSelected,
                      ]}>
                      {selectedExtras.includes(String(sup.id)) && (
                        <IconWrapper name="checkmark" size={16} color={Colors.white} />
                      )}
                    </View>
                    <Text style={styles.extraItemText}>{sup.name}</Text>
                  </View>
                  <Text style={styles.extraItemPrice}>+{Number(sup.price).toFixed(2)}€</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButtonMinus}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}>
            <IconWrapper name="remove-outline" size={20} color={Colors.darkGreen} />
          </TouchableOpacity>
          <Text style={styles.quantity}>{quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButtonPlus}
            onPress={() => setQuantity(quantity + 1)}>
            <IconWrapper name="add-outline" size={20} color={Colors.cream} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={() => {
            const cartExtras: CartExtra[] = supplements
              .filter(s => selectedExtras.includes(String(s.id)))
              .map(s => ({id: String(s.id), name: s.name, price: Number(s.price)}));
            addItem({
              dishId: Number(dish.id),
              restaurantId: dish.restaurantId ? Number(dish.restaurantId) : undefined,
              name: dish.name,
              price: dish.price,
              quantity,
              imageUrl: dish.imageUrl,
              extras: cartExtras.length > 0 ? cartExtras : undefined,
              deliveryFee: deliveryFee > 0 ? deliveryFee : undefined,
            });
            navigation.navigate('Cart');
          }}>
          <Text style={styles.addToCartText} numberOfLines={1}>
            Ajouter · {totalPrice.toFixed(2)} €
            {deliveryFee > 0 ? ` (+ ${deliveryFee.toFixed(2)} € livr.)` : ''}
          </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textLight,
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.black + '40',
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
  content: {
    padding: 22,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 16,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  name: {
    flex: 1,
    fontSize: 28,
    color: Colors.text,
    fontFamily: fontDisplay,
  },
  headerPrice: {
    fontSize: 24,
    fontFamily: fontDisplay,
    color: Colors.text,
  },
  metaLine: {
    fontSize: 13,
    fontFamily: fontHeading,
    color: Colors.textLight,
  },
  description: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    fontFamily: secondaryFont,
    marginTop: 2,
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
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ingredientTag: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    marginRight: 8,
    marginBottom: 8,
  },
  ingredientText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  allergensList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  allergenTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    marginRight: 8,
    marginBottom: 8,
  },
  allergenText: {
    fontSize: 14,
    color: Colors.error,
    marginLeft: 6,
    fontWeight: '600',
    fontFamily: secondaryFont,
  },
  extraItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: Radius.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  extraItemSelected: {
    borderColor: Colors.darkGreen,
    borderWidth: 1,
    backgroundColor: Colors.surface,
  },
  extraItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.darkGreen,
    borderColor: Colors.darkGreen,
  },
  extraItemText: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  extraItemPrice: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: fontHeading,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    padding: 5,
    marginRight: 12,
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
    fontSize: 18,
    color: Colors.text,
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
    fontFamily: fontHeading,
  },
  addToCartButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.terracotta,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 56,
    borderRadius: Radius.pill,
  },
  addToCartText: {
    fontSize: 16,
    color: Colors.white,
    fontFamily: fontButton,
  },
});

export default DishDetailsScreen;

