import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  StatusBar,
  Linking,
} from 'react-native';
import IconWrapper from '../components/IconWrapper';
import TopBar from '../components/TopBar';
import {Colors} from '../utils/colors';
import {secondaryFont} from '../utils/fonts';
import {useCart} from '../contexts/CartContext';
import {useAuth} from '../contexts/AuthContext';
import * as ordersApi from '../services/orders';
import {formatAxiosError} from '../utils/formatApiError';
import {useStripeBootstrap} from '../contexts/StripeBootstrapContext';

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/** rgb(5, 70, 37) — valeurs explicites pour le CTA (évite fond blanc + texte blanc sur RN Web). */
const CTA_BUTTON_BG = '#054625';
const CTA_BUTTON_TEXT = '#ffffff';

const CartScreen = ({navigation}: any) => {
  const {items: cartItems, removeItem, updateQuantity, clearCart} = useCart();
  const {user, isAuthenticated, isRestaurant} = useAuth();
  const {mergePublishableKey} = useStripeBootstrap();
  /** Client connecté (pas compte restaurateur) → POST /orders avec token */
  const isClientUser = isAuthenticated && !isRestaurant;
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryEmail, setDeliveryEmail] = useState('');

  useEffect(() => {
    if (user?.email) setDeliveryEmail(user.email);
  }, [user?.email]);

  const subtotal = cartItems.reduce((sum, item) => {
    const extrasTotal = item.extras?.reduce((s, e) => s + e.price, 0) ?? 0;
    return sum + (item.price + extrasTotal) * item.quantity;
  }, 0);
  // Frais de livraison du restaurant (premier article du panier ; une commande = un restaurant)
  const deliveryFee =
    cartItems.length > 0 && cartItems[0].deliveryFee != null ? cartItems[0].deliveryFee : 0;
  const total = subtotal + deliveryFee;

  const itemTotal = (item: (typeof cartItems)[0]) => {
    const extrasTotal = item.extras?.reduce((s, e) => s + e.price, 0) ?? 0;
    return (item.price + extrasTotal) * item.quantity;
  };

  const openCheckoutModal = () => {
    if (cartItems.length === 0) return;
    setShowCheckoutModal(true);
  };

  const submitCheckout = async () => {
    const address = deliveryAddress.trim();
    const phone = deliveryPhone.trim();
    if (!address) {
      Alert.alert('Champ requis', 'Veuillez saisir votre adresse de livraison.');
      return;
    }
    if (!phone) {
      Alert.alert('Champ requis', 'Veuillez saisir votre numéro de téléphone.');
      return;
    }
    setCheckoutLoading(true);
    setShowCheckoutModal(false);
    try {
      const orderLines: ordersApi.OrderItemCreatePayload[] = [];
      for (const item of cartItems) {
        if (item.menuId != null && item.dishIds != null && item.dishIds.length > 0) {
          for (const dishId of item.dishIds) {
            for (let q = 0; q < item.quantity; q++) {
              orderLines.push({ dish_id: dishId, quantity: 1 });
            }
          }
        } else {
          const dishId = typeof item.dishId === 'string' ? parseInt(item.dishId, 10) : item.dishId;
          if (dishId > 0) {
            orderLines.push({
              dish_id: dishId,
              quantity: item.quantity,
              supplements: (item.extras ?? []).map(extra => ({
                supplement_id: parseInt(extra.id, 10),
                quantity: 1,
              })),
            });
          }
        }
      }
      if (orderLines.length === 0) {
        Alert.alert('Panier invalide', 'Aucun article valide pour la commande. Ajoutez un plat au panier.');
        setCheckoutLoading(false);
        return;
      }

      const payload: ordersApi.OrderCreatePayload = {
        address,
        phone,
        email: deliveryEmail.trim() || user?.email || undefined,
        items: orderLines,
      };
      const orderResponse = isClientUser
        ? await ordersApi.createOrder(payload)
        : await ordersApi.createGuestOrder(payload);
      clearCart();
      setDeliveryAddress('');
      setDeliveryPhone('');
      const orderId = orderResponse?.id;
      const stripeClientSecret = orderResponse?.stripe_client_secret as string | undefined;
      const stripePublishableFromOrder = (orderResponse as ordersApi.OrderWithStripeSecret)
        ?.stripe_publishable_key;
      mergePublishableKey(stripePublishableFromOrder);

      const webAppUrl =
        (typeof process !== 'undefined' && process.env?.REACT_APP_WEB_APP_URL) ||
        (__DEV__ ? 'http://localhost:3000' : 'https://namke.app');
      const orderTotal = total;

      const goHomeOrHistory = () => {
        if (user) {
          navigation.navigate('OrderHistory');
        } else {
          navigation.navigate('Home');
        }
      };

      const openWebCheckout = (secret: string) => {
        // Ouvre la racine avec un flag afin d'eviter les 404 sur les hebergements
        // qui ne reecrivent pas les routes SPA comme /checkout-pay.
        const payUrl = `${webAppUrl.replace(/\/$/, '')}/?checkout=pay#secret=${encodeURIComponent(secret)}`;
        Linking.openURL(payUrl).catch(() =>
          Alert.alert('Erreur', "Impossible d'ouvrir la page de paiement."),
        );
      };

      if (stripeClientSecret) {
        const orderLabel = orderId != null ? ` Commande #${orderId}.` : '';
        const emailForStripe = deliveryEmail.trim() || user?.email || undefined;

        if (Platform.OS !== 'web') {
          // Laisser StripeProvider réagir à la clé (config + réponse commande), puis Payment Sheet natif
          await sleep(500);
          try {
            const StripeRn = require('@stripe/stripe-react-native') as {
              initPaymentSheet: (p: {
                merchantDisplayName: string;
                paymentIntentClientSecret: string;
                defaultBillingDetails?: {email?: string};
              }) => Promise<{error?: {message?: string; code?: string}}>;
              presentPaymentSheet: () => Promise<{error?: {message?: string; code?: string}}>;
            };
            const {error: initError} = await StripeRn.initPaymentSheet({
              merchantDisplayName: 'Afrodine',
              paymentIntentClientSecret: stripeClientSecret,
              defaultBillingDetails: emailForStripe ? {email: emailForStripe} : undefined,
            });
            if (initError) {
              Alert.alert(
                'Paiement',
                initError.message ||
                  'Impossible d’ouvrir le paiement dans l’app. Ouverture du navigateur sécurisé.',
                [
                  {text: 'Annuler', style: 'cancel', onPress: goHomeOrHistory},
                  {
                    text: 'Continuer',
                    onPress: () => openWebCheckout(stripeClientSecret),
                  },
                ],
              );
            } else {
              const {error: presentError} = await StripeRn.presentPaymentSheet();
              if (presentError) {
                const code = (presentError as {code?: string}).code;
                if (code === 'Canceled') {
                  Alert.alert(
                    'Paiement annulé',
                    `La commande est enregistrée.${orderLabel}`,
                    [{text: 'OK', onPress: goHomeOrHistory}],
                  );
                } else {
                  Alert.alert(
                    'Paiement',
                    presentError.message || 'Le paiement a échoué.',
                    [
                      {text: 'Annuler', style: 'cancel', onPress: goHomeOrHistory},
                      {
                        text: 'Payer en ligne',
                        onPress: () => openWebCheckout(stripeClientSecret),
                      },
                    ],
                  );
                }
              } else {
                Alert.alert('Paiement réussi', `Votre commande${orderLabel} a été payée.`, [
                  {text: 'OK', onPress: goHomeOrHistory},
                ]);
              }
            }
          } catch (e: unknown) {
            console.warn('[Cart] Payment Sheet natif indisponible', e);
            openWebCheckout(stripeClientSecret);
            Alert.alert(
              'Paiement',
              `Ouverture du paiement sécurisé dans le navigateur.${orderLabel}`,
              [{text: 'OK', onPress: goHomeOrHistory}],
            );
          }
        } else {
          openWebCheckout(stripeClientSecret);
          Alert.alert(
            'Paiement',
            `Finalisez le paiement dans l’onglet du navigateur.${orderLabel}`,
            [{text: 'OK', onPress: goHomeOrHistory}],
          );
        }
      } else {
        const buttons: {text: string; onPress?: () => void}[] = [
          {text: 'OK', onPress: () => navigation.navigate('Home')},
        ];
        if (user) {
          buttons.unshift({
            text: 'Voir l\'historique',
            onPress: () => navigation.navigate('OrderHistory'),
          });
        }
        Alert.alert(
          'Commande enregistrée',
          orderTotal > 0
            ? 'Votre commande est enregistrée, mais le paiement par carte n’a pas pu être démarré (vérifiez la configuration Stripe sur le serveur : STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY).'
            : 'Votre commande a bien été prise en compte.',
          buttons,
        );
      }
    } catch (e: any) {
      Alert.alert('Erreur', formatAxiosError(e, 'Erreur lors de la commande'));
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TopBar navigation={navigation} title="Panier" />
      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconWrapper name="cart-outline" size={80} color={Colors.textLight} />
          <Text style={styles.emptyText}>Votre panier est vide</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Home')}>
            <Text style={styles.browseButtonText}>Parcourir les restaurants</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.itemsContainer}>
            {cartItems.map(item => (
              <View key={item.id} style={styles.cartItem}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeItem(item.id)}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <IconWrapper name="trash-outline" size={22} color={Colors.error} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.itemImageContainer}
                  onPress={() => {
                    if (item.menuId != null && item.restaurantId != null) {
                      navigation.navigate('RestaurantDetails', { restaurantId: item.restaurantId });
                    } else if (item.dishId > 0) {
                      navigation.navigate('DishDetails', {
                        dishId: item.dishId,
                        restaurantId: item.restaurantId,
                      });
                    }
                  }}>
                  {item.imageUrl ? (
                    <Image source={{uri: item.imageUrl}} style={styles.itemImage} />
                  ) : (
                    <IconWrapper name={item.menuId != null ? 'restaurant-outline' : 'image-outline'} size={40} color={Colors.textLight} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.itemDetails}
                  onPress={() => {
                    if (item.menuId != null && item.restaurantId != null) {
                      navigation.navigate('RestaurantDetails', { restaurantId: item.restaurantId });
                    } else if (item.dishId > 0) {
                      navigation.navigate('DishDetails', {
                        dishId: item.dishId,
                        restaurantId: item.restaurantId,
                      });
                    }
                  }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.extras && item.extras.length > 0 && (
                    <Text style={styles.itemExtras} numberOfLines={1}>
                      + {item.extras.map(e => e.name).join(', ')}
                    </Text>
                  )}
                  <Text style={styles.itemPrice}>{itemTotal(item).toFixed(2)}€</Text>
                </TouchableOpacity>
                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.id, -1)}>
                    <IconWrapper name="remove-outline" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.quantity}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={[styles.quantityButton, styles.quantityButtonRight]}
                    onPress={() => updateQuantity(item.id, 1)}>
                    <IconWrapper name="add-outline" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sous-total</Text>
              <Text style={styles.summaryValue}>{subtotal.toFixed(2)}€</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Frais de livraison</Text>
              <Text style={styles.summaryValue}>
                {deliveryFee === 0 ? 'Gratuit' : `${deliveryFee.toFixed(2)}€`}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{total.toFixed(2)}€</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.checkoutButton, checkoutLoading && styles.checkoutButtonDisabled]}
            onPress={openCheckoutModal}
            disabled={checkoutLoading}
            activeOpacity={0.8}>
            {checkoutLoading ? (
              <View style={styles.checkoutButtonContent}>
                <ActivityIndicator size="small" color={CTA_BUTTON_TEXT} />
                <Text style={[styles.checkoutButtonText, styles.checkoutButtonTextWithLoader]}>
                  Envoi en cours...
                </Text>
              </View>
            ) : (
              <View style={styles.checkoutButtonContent}>
                <Text style={styles.checkoutButtonText}>Passer la commande</Text>
                <IconWrapper name="arrow-forward-outline" size={20} color={CTA_BUTTON_TEXT} style={styles.checkoutIcon} />
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      <Modal
        visible={showCheckoutModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowCheckoutModal(false)}
        statusBarTranslucent>
        <View style={styles.checkoutModalFullScreen}>
          <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
          <View style={styles.checkoutModalHeader}>
            <TouchableOpacity
              style={styles.checkoutModalCloseBtn}
              onPress={() => setShowCheckoutModal(false)}
              hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
              <IconWrapper name="close" size={28} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.checkoutModalHeaderTitle}>Checkout</Text>
            <View style={styles.checkoutModalHeaderRight} />
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.checkoutModalBody}>
            <ScrollView
              style={styles.checkoutModalScroll}
              contentContainerStyle={styles.checkoutModalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              <Text style={styles.checkoutModalSectionTitle}>Adresse de livraison</Text>
              <TextInput
                style={styles.checkoutInput}
                placeholder="Adresse complète"
                placeholderTextColor={Colors.textLight}
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.checkoutInput}
                placeholder="Téléphone"
                placeholderTextColor={Colors.textLight}
                value={deliveryPhone}
                onChangeText={setDeliveryPhone}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.checkoutInput}
                placeholder="Email (optionnel)"
                placeholderTextColor={Colors.textLight}
                value={deliveryEmail}
                onChangeText={setDeliveryEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <View style={styles.checkoutStripeSection}>
                <View style={styles.checkoutStripeHeader}>
                  <IconWrapper name="card-outline" size={24} color={Colors.primary} />
                  <Text style={styles.checkoutModalSectionTitle}>Paiement</Text>
                </View>
                <View style={styles.checkoutStripeBadge}>
                  <Text style={styles.checkoutStripeText}>Paiement sécurisé par Stripe</Text>
                </View>
                <Text style={styles.checkoutStripeHint}>
                  Vous serez redirigé vers le paiement après validation de la commande.
                </Text>
              </View>

              <View style={styles.checkoutSummaryRow}>
                <Text style={styles.checkoutSummaryLabel}>Total</Text>
                <Text style={styles.checkoutSummaryValue}>{total.toFixed(2)}€</Text>
              </View>

              <TouchableOpacity
                style={styles.checkoutModalConfirmFull}
                onPress={submitCheckout}
                activeOpacity={0.8}>
                <Text style={styles.checkoutModalConfirmText}>Confirmer la commande</Text>
                <IconWrapper name="arrow-forward-outline" size={20} color={CTA_BUTTON_TEXT} style={styles.checkoutIcon} />
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.textLight,
    marginTop: 16,
    marginBottom: 24,
    fontFamily: secondaryFont,
  },
  browseButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  browseButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: secondaryFont,
  },
  itemsContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingLeft: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  deleteButton: {
    marginRight: 8,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: Colors.textLight,
  },
  itemExtras: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  quantityButtonRight: {
    marginLeft: 12,
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    minWidth: 24,
    textAlign: 'center',
    fontFamily: secondaryFont,
  },
  summary: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  summaryValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    fontFamily: secondaryFont,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    fontFamily: secondaryFont,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CTA_BUTTON_BG,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    ...(Platform.OS === 'web'
      ? ({
          borderWidth: 0,
          outlineStyle: 'none',
          cursor: 'pointer',
        } as Record<string, unknown>)
      : {}),
  },
  checkoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButtonText: {
    color: CTA_BUTTON_TEXT,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    fontFamily: secondaryFont,
  },
  checkoutIcon: {
    marginLeft: 0,
  },
  checkoutButtonDisabled: {
    opacity: 0.8,
  },
  checkoutButtonTextWithLoader: {
    marginLeft: 8,
  },
  checkoutModalFullScreen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  checkoutModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  checkoutModalCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutModalHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: secondaryFont,
  },
  checkoutModalHeaderRight: {
    width: 44,
  },
  checkoutModalBody: {
    flex: 1,
  },
  checkoutModalScroll: {
    flex: 1,
  },
  checkoutModalScrollContent: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 48 : 24,
  },
  checkoutModalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 12,
    fontFamily: secondaryFont,
  },
  checkoutInput: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    fontFamily: secondaryFont,
  },
  checkoutStripeSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  checkoutStripeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  checkoutStripeBadge: {
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  checkoutStripeText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: secondaryFont,
  },
  checkoutStripeHint: {
    fontSize: 13,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  checkoutSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  checkoutSummaryLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  checkoutSummaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    fontFamily: secondaryFont,
  },
  checkoutModalConfirmFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CTA_BUTTON_BG,
    paddingVertical: 16,
    borderRadius: 12,
    ...(Platform.OS === 'web'
      ? ({
          borderWidth: 0,
          outlineStyle: 'none',
          cursor: 'pointer',
        } as Record<string, unknown>)
      : {}),
  },
  checkoutModalConfirmText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CTA_BUTTON_TEXT,
    marginRight: 8,
    fontFamily: secondaryFont,
  },
});

export default CartScreen;
