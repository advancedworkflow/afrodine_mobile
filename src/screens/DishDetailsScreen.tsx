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
import {Colors} from '../utils/colors';
import {secondaryFont} from '../utils/fonts';
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
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => setIsFavorite(!isFavorite)}>
            <IconWrapper
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? Colors.error : Colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Dish Info */}
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.titleLeft}>
                <Text style={styles.name}>{dish.name}</Text>
                <Text style={styles.restaurantName}>{dish.restaurantName}</Text>
              </View>
              <View style={styles.titleRight}>
                <View style={styles.ratingBadge}>
                  <IconWrapper name="star" size={16} color={Colors.warning} />
                  <Text style={styles.ratingText}>{dish.rating}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.description}>{dish.description}</Text>
          </View>

          {/* Info Cards */}
          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <IconWrapper name="flame-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoCardLabel}>Calories</Text>
              <Text style={styles.infoCardValue}>{dish.calories ?? '—'}</Text>
            </View>
            <View style={styles.infoCard}>
              <IconWrapper name="time-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoCardLabel}>Temps</Text>
              <Text style={styles.infoCardValue}>{dish.deliveryTime ?? '—'}</Text>
            </View>
            <View style={styles.infoCard}>
              <IconWrapper name="star-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoCardLabel}>Note</Text>
              <Text style={styles.infoCardValue}>{dish.rating != null ? `${dish.rating}★` : '—'}</Text>
            </View>
            <View style={styles.infoCard}>
              <IconWrapper name="car-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoCardLabel}>Livraison</Text>
              <Text style={styles.infoCardValue}>
                {deliveryFee === 0 ? 'Gratuit' : `${deliveryFee.toFixed(2)}€`}
              </Text>
            </View>
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
              <Text style={styles.sectionTitle}>Suppléments</Text>
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
            style={styles.quantityButton}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}>
            <IconWrapper name="remove-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.quantity}>{quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity(quantity + 1)}>
            <IconWrapper name="add-outline" size={20} color={Colors.primary} />
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
          <View style={styles.addToCartTextWrap}>
            <Text style={styles.addToCartText} numberOfLines={1}>
              Ajouter au panier
            </Text>
            <Text style={styles.addToCartPrice} numberOfLines={1}>
              {totalPrice.toFixed(2)}€
              {deliveryFee > 0 ? ` + ${deliveryFee.toFixed(2)}€ livr.` : ''}
            </Text>
          </View>
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
    paddingBottom: 100,
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
  restaurantName: {
    fontSize: 16,
    color: Colors.primaryLight,
    fontWeight: '600',
    fontFamily: secondaryFont,
  },
  description: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
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
  infoCardLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 8,
  },
  infoCardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 4,
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
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ingredientTag: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
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
    borderRadius: 16,
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
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.gray[200],
  },
  extraItemSelected: {
    borderColor: Colors.primaryLight,
    backgroundColor: Colors.primaryLight + '0A',
  },
  extraItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryLight,
  },
  extraItemText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
    fontFamily: secondaryFont,
  },
  extraItemPrice: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: 'bold',
    fontFamily: secondaryFont,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: 8,
    marginRight: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
    fontFamily: secondaryFont,
  },
  addToCartButton: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  addToCartTextWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: secondaryFont,
  },
  addToCartPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: secondaryFont,
    marginTop: 2,
    opacity: 0.95,
  },
});

export default DishDetailsScreen;

