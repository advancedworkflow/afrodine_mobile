import React, {useState, useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  StatusBar,
  Linking,
} from 'react-native';
import {alert} from '../utils/alert';
import IconWrapper from '../components/IconWrapper';
import {Colors, Radius} from '../utils/colors';
import {GLOBAL_TAB_BAR_HEIGHT, useGlobalTabBarHeight} from '../navigation/navigationRef';
import {fontButton, fontDisplay, fontDisplayMedium, fontHeading, fontSub, fontUI} from '../utils/fonts';
import {useCart} from '../contexts/CartContext';
import {useAuth} from '../contexts/AuthContext';
import * as ordersApi from '../services/orders';
import * as restaurantsApi from '../services/restaurants';
import {getClientProfile} from '../services/clientProfile';
import {formatAxiosError} from '../utils/formatApiError';
import {mergeAddressLines} from '../utils/address';
import {useStripeBootstrap} from '../contexts/StripeBootstrapContext';

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/** rgb(5, 70, 37) — valeurs explicites pour le CTA (évite fond blanc + texte blanc sur RN Web). */
const CTA_BUTTON_BG = '#054625';
const CTA_BUTTON_TEXT = '#ffffff';

const CartScreen = ({navigation}: any) => {
  const tabBarHeight = useGlobalTabBarHeight();
  const {t} = useTranslation();
  const {items: cartItems, removeItem, updateQuantity, clearCart} = useCart();
  const {user, isAuthenticated, isRestaurant} = useAuth();
  const {mergePublishableKey} = useStripeBootstrap();
  /** Client connecté (pas compte restaurateur) → POST /orders avec token */
  const isClientUser = isAuthenticated && !isRestaurant;
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [addressLine3, setAddressLine3] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryEmail, setDeliveryEmail] = useState('');
  const [restaurantInfo, setRestaurantInfo] = useState<{name: string; city?: string} | null>(null);

  useEffect(() => {
    if (user?.email) setDeliveryEmail(user.email);
  }, [user?.email]);

  useEffect(() => {
    if (!isClientUser) return;
    let cancelled = false;
    (async () => {
      try {
        const profile = await getClientProfile();
        if (cancelled || !profile) return;
        if (profile.address && !addressLine1) setAddressLine1(profile.address);
        if (profile.phone && !deliveryPhone) setDeliveryPhone(profile.phone);
      } catch {
        // profil optionnel — l'utilisateur peut toujours saisir l'adresse manuellement
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClientUser]);

  useEffect(() => {
    const restaurantId = cartItems[0]?.restaurantId;
    if (restaurantId == null) {
      setRestaurantInfo(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const rest = await restaurantsApi.getRestaurantById(restaurantId);
        if (!cancelled && rest) setRestaurantInfo({name: rest.name, city: rest.city});
      } catch {
        if (!cancelled) setRestaurantInfo(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cartItems[0]?.restaurantId]);

  const restaurantInitials = (restaurantInfo?.name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('') || '··';

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
    const address = mergeAddressLines(addressLine1, addressLine2, addressLine3);
    const phone = deliveryPhone.trim();
    if (!addressLine1.trim()) {
      alert(t('cart.requiredFieldTitle'), t('cart.missingAddress'));
      return;
    }
    if (!phone) {
      alert(t('cart.requiredFieldTitle'), t('cart.missingPhone'));
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
        } else if (item.groceryShopProductId != null) {
          orderLines.push({
            grocery_shop_product_id: item.groceryShopProductId,
            quantity: item.quantity,
          });
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
        alert(t('cart.invalidCartTitle'), t('cart.invalidCartMessage'));
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
      setAddressLine1('');
      setAddressLine2('');
      setAddressLine3('');
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
          alert(t('cart.errorTitle'), t('cart.cannotOpenPaymentPage')),
        );
      };

      if (stripeClientSecret) {
        const orderLabel = orderId != null ? ` ${t('cart.orderNumberLabel', {id: orderId})}` : '';
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
              alert(
                t('cart.paymentTitle'),
                initError.message || t('cart.paymentAppUnavailable'),
                [
                  {text: t('cart.cancel'), style: 'cancel', onPress: goHomeOrHistory},
                  {
                    text: t('cart.continue'),
                    onPress: () => openWebCheckout(stripeClientSecret),
                  },
                ],
              );
            } else {
              const {error: presentError} = await StripeRn.presentPaymentSheet();
              if (presentError) {
                const code = (presentError as {code?: string}).code;
                if (code === 'Canceled') {
                  alert(
                    t('cart.paymentCancelledTitle'),
                    `${t('cart.orderSavedNotice')}${orderLabel}`,
                    [{text: 'OK', onPress: goHomeOrHistory}],
                  );
                } else {
                  alert(
                    t('cart.paymentTitle'),
                    presentError.message || t('cart.paymentFailed'),
                    [
                      {text: t('cart.cancel'), style: 'cancel', onPress: goHomeOrHistory},
                      {
                        text: t('cart.payOnline'),
                        onPress: () => openWebCheckout(stripeClientSecret),
                      },
                    ],
                  );
                }
              } else {
                alert(t('cart.paymentSuccessTitle'), `${t('cart.orderPaidNotice')}${orderLabel}`, [
                  {text: 'OK', onPress: goHomeOrHistory},
                ]);
              }
            }
          } catch (e: unknown) {
            console.warn('[Cart] Payment Sheet natif indisponible', e);
            openWebCheckout(stripeClientSecret);
            alert(
              t('cart.paymentTitle'),
              `${t('cart.openingSecurePaymentInBrowser')}${orderLabel}`,
              [{text: 'OK', onPress: goHomeOrHistory}],
            );
          }
        } else {
          openWebCheckout(stripeClientSecret);
          alert(
            t('cart.paymentTitle'),
            `${t('cart.finalizePaymentInBrowserTab')}${orderLabel}`,
            [{text: 'OK', onPress: goHomeOrHistory}],
          );
        }
      } else {
        const buttons: {text: string; onPress?: () => void}[] = [
          {text: 'OK', onPress: () => navigation.navigate('Home')},
        ];
        if (user) {
          buttons.unshift({
            text: t('cart.viewHistory'),
            onPress: () => navigation.navigate('OrderHistory'),
          });
        }
        alert(
          t('cart.orderSavedTitle'),
          orderTotal > 0
            ? t('cart.orderSavedNoStripeMessage')
            : t('cart.orderConfirmedMessage'),
          buttons,
        );
      }
    } catch (e: any) {
      alert(t('cart.errorTitle'), formatAxiosError(e, t('cart.orderError')));
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {navigation.canGoBack?.() && (
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <IconWrapper name="arrow-back-outline" size={22} color={Colors.darkGreen} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>{t('cart.title')}</Text>
      </View>
      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconWrapper name="cart-outline" size={80} color={Colors.textLight} />
          <Text style={styles.emptyText}>{t('cart.empty')}</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Home')}>
            <Text style={styles.browseButtonText}>{t('cart.browseRestaurants')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.itemsContainer}>
            <View style={styles.restaurantHeader}>
              <View style={styles.restaurantAvatar}>
                <Text style={styles.restaurantAvatarText}>{restaurantInitials}</Text>
              </View>
              <Text style={styles.restaurantName} numberOfLines={1}>{restaurantInfo?.name ?? t('cart.title')}</Text>
              {restaurantInfo?.city ? <Text style={styles.restaurantCity}>{restaurantInfo.city}</Text> : null}
            </View>

            {cartItems.map(item => (
              <View key={item.id} style={styles.cartItem}>
                <TouchableOpacity
                  style={styles.itemImageContainer}
                  onPress={() => {
                    if (item.menuId != null && item.restaurantId != null) {
                      navigation.navigate('RestaurantDetails', { restaurantId: item.restaurantId });
                    } else if (item.groceryShopProductId != null) {
                      navigation.navigate('GroceryProductDetail', {productId: item.groceryShopProductId});
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
                    <IconWrapper name={item.menuId != null ? 'restaurant-outline' : 'image-outline'} size={28} color={Colors.textLight} />
                  )}
                </TouchableOpacity>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.quantity} × {item.name}</Text>
                  {item.extras && item.extras.length > 0 && (
                    <Text style={styles.itemExtras} numberOfLines={1}>
                      {item.extras.map(e => e.name).join(' · ')}
                    </Text>
                  )}
                  <View style={styles.itemControls}>
                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => updateQuantity(item.id, -1)}
                      hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                      <IconWrapper name="remove" size={14} color={Colors.darkGreen} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => updateQuantity(item.id, 1)}
                      hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                      <IconWrapper name="add" size={14} color={Colors.darkGreen} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeItem(item.id)}
                      hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}
                      style={styles.removeLink}>
                      <Text style={styles.removeLinkText}>{t('cart.remove')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.itemPrice}>{itemTotal(item).toFixed(2)} €</Text>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addMoreRow}
              onPress={() => {
                const restaurantId = cartItems[0]?.restaurantId;
                if (restaurantId != null) navigation.navigate('RestaurantDetails', {restaurantId});
                else navigation.navigate('Home');
              }}>
              <Text style={styles.addMoreText}>{t('cart.addAnotherItem')}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.infoRow} onPress={openCheckoutModal} activeOpacity={0.7}>
            <View style={styles.infoIconWrap}>
              <IconWrapper name="location-outline" size={17} color={Colors.darkGreen} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoTitle} numberOfLines={1}>
                {mergeAddressLines(addressLine1, addressLine2, addressLine3) || t('cart.addAddress')}
              </Text>
              <Text style={styles.infoSubtitle} numberOfLines={1}>{deliveryPhone || t('cart.phoneRequired')}</Text>
            </View>
            <Text style={styles.infoAction}>{t('cart.change')}</Text>
          </TouchableOpacity>

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('cart.subtotal')}</Text>
              <Text style={styles.summaryValue}>{subtotal.toFixed(2)} €</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('cart.delivery')}</Text>
              <Text style={styles.summaryValue}>
                {deliveryFee === 0 ? t('cart.free') : `${deliveryFee.toFixed(2)} €`}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {cartItems.length > 0 && (
        <View style={[styles.bottomBar, {marginBottom: tabBarHeight}]}>
          <View style={styles.bottomBarTotal}>
            <Text style={styles.bottomBarTotalLabel}>{t('cart.total')}</Text>
            <Text style={styles.bottomBarTotalValue}>{total.toFixed(2)} €</Text>
          </View>
          <TouchableOpacity
            style={[styles.checkoutButton, checkoutLoading && styles.checkoutButtonDisabled]}
            onPress={openCheckoutModal}
            disabled={checkoutLoading}
            activeOpacity={0.8}>
            {checkoutLoading ? (
              <ActivityIndicator size="small" color={CTA_BUTTON_TEXT} />
            ) : (
              <Text style={styles.checkoutButtonText}>{t('cart.pay')}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={showCheckoutModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowCheckoutModal(false)}
        statusBarTranslucent>
        <View style={styles.checkoutModalFullScreen}>
          <StatusBar barStyle="light-content" backgroundColor={Colors.darkGreen} />
          <View style={styles.checkoutModalHeader}>
            <TouchableOpacity
              style={styles.checkoutModalCloseBtn}
              onPress={() => setShowCheckoutModal(false)}
              hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
              <IconWrapper name="close" size={28} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.checkoutModalHeaderTitle}>{t('cart.checkout')}</Text>
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
              <Text style={styles.checkoutModalSectionTitle}>{t('cart.deliveryAddress')}</Text>
              <TextInput
                style={styles.checkoutInput}
                placeholder={t('cart.addressLine1Placeholder')}
                placeholderTextColor={Colors.textLight}
                value={addressLine1}
                onChangeText={setAddressLine1}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.checkoutInput}
                placeholder={t('cart.addressLine2Placeholder')}
                placeholderTextColor={Colors.textLight}
                value={addressLine2}
                onChangeText={setAddressLine2}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.checkoutInput}
                placeholder={t('cart.addressLine3Placeholder')}
                placeholderTextColor={Colors.textLight}
                value={addressLine3}
                onChangeText={setAddressLine3}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.checkoutInput}
                placeholder={t('cart.phonePlaceholder')}
                placeholderTextColor={Colors.textLight}
                value={deliveryPhone}
                onChangeText={setDeliveryPhone}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.checkoutInput}
                placeholder={t('cart.emailOptionalPlaceholder')}
                placeholderTextColor={Colors.textLight}
                value={deliveryEmail}
                onChangeText={setDeliveryEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <View style={styles.checkoutStripeSection}>
                <View style={styles.checkoutStripeHeader}>
                  <IconWrapper name="card-outline" size={24} color={Colors.darkGreen} />
                  <Text style={styles.checkoutModalSectionTitle}>{t('cart.payment')}</Text>
                </View>
                <View style={styles.checkoutStripeBadge}>
                  <Text style={styles.checkoutStripeText}>{t('cart.securePaymentByStripe')}</Text>
                </View>
                <Text style={styles.checkoutStripeHint}>
                  {t('cart.redirectedAfterOrderNotice')}
                </Text>
              </View>

              <View style={styles.checkoutSummaryRow}>
                <Text style={styles.checkoutSummaryLabel}>{t('cart.total')}</Text>
                <Text style={styles.checkoutSummaryValue}>{total.toFixed(2)}€</Text>
              </View>

              <TouchableOpacity
                style={styles.checkoutModalConfirmFull}
                onPress={submitCheckout}
                activeOpacity={0.8}>
                <Text style={styles.checkoutModalConfirmText}>{t('cart.confirmOrder')}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: fontDisplay,
    color: Colors.text,
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
    fontSize: 19,
    fontFamily: fontUI,
    color: Colors.textLight,
    marginTop: 16,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: Colors.terracotta,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: Radius.pill,
  },
  browseButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontFamily: fontButton,
  },
  itemsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: 14,
    padding: 16,
    gap: 12,
  },
  restaurantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  restaurantAvatar: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    backgroundColor: Colors.olive,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantAvatarText: {
    fontSize: 13,
    fontFamily: fontHeading,
    color: Colors.namkeBlack,
  },
  restaurantName: {
    fontSize: 18,
    fontFamily: fontDisplayMedium,
    color: Colors.text,
  },
  restaurantCity: {
    marginLeft: 'auto',
    fontSize: 13.5,
    fontFamily: fontSub,
    color: Colors.textLight,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemImageContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  itemName: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: fontButton,
  },
  itemPrice: {
    fontSize: 16,
    fontFamily: fontButton,
    color: Colors.text,
  },
  itemExtras: {
    fontSize: 13,
    fontFamily: fontSub,
    color: Colors.textLight,
  },
  itemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  qtyButton: {
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeLink: {
    marginLeft: 6,
  },
  removeLinkText: {
    fontSize: 13,
    fontFamily: fontHeading,
    color: Colors.terracotta,
  },
  addMoreRow: {
    minHeight: 40,
    justifyContent: 'center',
  },
  addMoreText: {
    fontSize: 14.5,
    fontFamily: fontHeading,
    color: Colors.terracotta,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 22,
    padding: 14,
    marginBottom: 12,
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  infoTitle: {
    fontSize: 15.5,
    fontFamily: fontButton,
    color: Colors.text,
  },
  infoSubtitle: {
    fontSize: 13,
    fontFamily: fontSub,
    color: Colors.textLight,
  },
  infoAction: {
    fontSize: 14,
    fontFamily: fontHeading,
    color: Colors.terracotta,
  },
  summary: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 16,
    gap: 7,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 14.5,
    fontFamily: fontSub,
    color: Colors.textLight,
  },
  summaryValue: {
    fontSize: 14.5,
    fontFamily: fontSub,
    color: Colors.text,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 22,
    paddingTop: 12,
    marginBottom: GLOBAL_TAB_BAR_HEIGHT,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  bottomBarTotal: {
    gap: 1,
  },
  bottomBarTotalLabel: {
    fontSize: 13,
    fontFamily: fontUI,
    color: Colors.textLight,
  },
  bottomBarTotalValue: {
    fontSize: 22,
    fontFamily: fontDisplay,
    color: Colors.text,
  },
  checkoutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.terracotta,
    minHeight: 56,
    borderRadius: Radius.pill,
    ...(Platform.OS === 'web'
      ? ({
          borderWidth: 0,
          outlineStyle: 'none',
          cursor: 'pointer',
        } as Record<string, unknown>)
      : {}),
  },
  checkoutButtonText: {
    color: CTA_BUTTON_TEXT,
    fontSize: 17,
    fontFamily: fontButton,
  },
  checkoutIcon: {
    marginLeft: 0,
  },
  checkoutButtonDisabled: {
    opacity: 0.8,
  },
  checkoutModalFullScreen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  checkoutModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.darkGreen,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  checkoutModalCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutModalHeaderTitle: {
    fontSize: 20,
    color: Colors.white,
    fontFamily: fontDisplayMedium,
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
    fontSize: 19,
    color: Colors.text,
    marginBottom: 12,
    fontFamily: fontDisplay,
  },
  checkoutInput: {
    backgroundColor: Colors.white,
    borderRadius: Radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 12,
    fontSize: 17,
    fontFamily: fontUI,
    color: Colors.text,
  },
  checkoutStripeSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  checkoutStripeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  checkoutStripeBadge: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  checkoutStripeText: {
    fontSize: 16,
    color: Colors.primary,
    fontFamily: fontHeading,
  },
  checkoutStripeHint: {
    fontSize: 14,
    fontFamily: fontUI,
    color: Colors.textLight,
  },
  checkoutSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  checkoutSummaryLabel: {
    fontSize: 19,
    fontFamily: fontUI,
    color: Colors.text,
  },
  checkoutSummaryValue: {
    fontSize: 20,
    color: Colors.text,
    fontFamily: fontDisplay,
  },
  checkoutModalConfirmFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CTA_BUTTON_BG,
    paddingVertical: 16,
    borderRadius: Radius.pill,
    ...(Platform.OS === 'web'
      ? ({
          borderWidth: 0,
          outlineStyle: 'none',
          cursor: 'pointer',
        } as Record<string, unknown>)
      : {}),
  },
  checkoutModalConfirmText: {
    fontSize: 17,
    color: CTA_BUTTON_TEXT,
    marginRight: 8,
    fontFamily: fontButton,
  },
});

export default CartScreen;
