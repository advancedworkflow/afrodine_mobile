import React, {useEffect, useRef, useState} from 'react';
import {View, Text, StyleSheet, Animated, TouchableOpacity, Platform} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IconWrapper from '../components/IconWrapper';
import CustomIcon, {type CustomIconName} from '../components/CustomIcon';
import {useAuth} from '../contexts/AuthContext';
import {useNotificationBadges} from '../hooks/useNotificationBadges';
import {Colors} from '../utils/colors';
import {secondaryFont} from '../utils/fonts';
import {useTranslation} from 'react-i18next';

const modalScreenOptions = (
  title: string,
  showOptions = false,
  headerBackgroundColor: string = Colors.darkGreen,
) => ({
  // 'card' (au lieu de 'modal') garantit un bouton retour natif visible sur iOS et Android ;
  // la présentation modale masque ce chevron par défaut (attendu en swipe-to-dismiss).
  headerShown: true,
  title,
  headerStyle: {backgroundColor: headerBackgroundColor},
  headerTintColor: Colors.white,
  headerTitleStyle: {fontWeight: 'bold' as const, fontFamily: secondaryFont},
  headerRight: showOptions
    ? () => (
        <TouchableOpacity
          onPress={() => {}}
          style={{marginRight: 12}}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <IconWrapper name="ellipsis-vertical-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
      )
    : undefined,
});

// Screens
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen, {ONBOARDING_SEEN_KEY} from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import RestaurantsScreen from '../screens/RestaurantsScreen';
import RestaurantDetailsScreen from '../screens/RestaurantDetailsScreen';
import GroceryShopDetailsScreen from '../screens/GroceryShopDetailsScreen';
import GroceryShopsScreen from '../screens/GroceryShopsScreen';
import GroceryProductDetailScreen from '../screens/GroceryProductDetailScreen';
import DishDetailsScreen from '../screens/DishDetailsScreen';
import SearchResultsScreen from '../screens/SearchResultsScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import NotificationDetailScreen from '../screens/NotificationDetailScreen';
import RestaurantDashboardScreen from '../screens/restaurant/DashboardScreen';
import RestaurantOrdersScreen from '../screens/restaurant/OrdersScreen';
import RestaurantMenuScreen from '../screens/restaurant/MenuScreen';
import RestaurantAnalyticsScreen from '../screens/restaurant/AnalyticsScreen';
import RestaurantProfileScreen from '../screens/restaurant/ProfileScreen';
import RestaurantReviewsScreen from '../screens/restaurant/ReviewsScreen';
import RestaurantAnnouncementsScreen from '../screens/restaurant/AnnouncementsScreen';
import RestaurantWalletScreen from '../screens/restaurant/WalletScreen';
import GroceryManagementScreen from '../screens/restaurant/GroceryManagementScreen';
import GroceryProductFormScreen from '../screens/restaurant/GroceryProductFormScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import OrderStatsScreen from '../screens/OrderStatsScreen';
import CateringScreen from '../screens/CateringScreen';
import CateringDetailsScreen from '../screens/CateringDetailsScreen';
import CateringServiceDetailScreen from '../screens/CateringServiceDetailScreen';
import CateringFormulaDetailScreen from '../screens/CateringFormulaDetailScreen';
import PopularDishesScreen from '../screens/PopularDishesScreen';
import CateringManagementScreen from '../screens/restaurant/CateringManagementScreen';
import CateringOfferDetailScreen from '../screens/restaurant/CateringOfferDetailScreen';
import PromotionsManagementScreen from '../screens/restaurant/PromotionsManagementScreen';
import PromotionFormScreen from '../screens/restaurant/PromotionFormScreen';
import EmployeesManagementScreen from '../screens/restaurant/EmployeesManagementScreen';
import EmployeeFormScreen from '../screens/restaurant/EmployeeFormScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const SHOULD_USE_NATIVE_DRIVER = Platform.OS !== 'web';

const TabBarIconWithHighlight = ({
  focused,
  name,
  customIcon,
  size,
  color,
  title,
}: {
  focused: boolean;
  name: string;
  customIcon?: CustomIconName;
  size: number;
  color: string;
  title: string;
}) => {
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.92)).current;
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: focused ? 1 : 0.92,
        duration: 200,
        useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
      }),
      Animated.timing(opacityAnim, {
        toValue: focused ? 1 : 0.7,
        duration: 200,
        useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, [focused, scaleAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.tabIconWrapper,
        { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
      ]}>
      {customIcon ? (
        <CustomIcon name={customIcon} fallbackName={name} size={size} color={color} />
      ) : (
        <IconWrapper name={name} size={size} color={color} />
      )}
      <Text
        style={focused ? [styles.tabTitleActive, { color }] : styles.tabTitleInactive}
        numberOfLines={1}>
        {title}
      </Text>
    </Animated.View>
  );
};

// Main Tab Navigator for regular users (badge sur Profil = total notifications non lues)
const MainTabs = () => {
  const {t} = useTranslation();
  const {unreadCount} = useNotificationBadges();
  const profileBadge = unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined;
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.darkGreen,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
        headerShown: false,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({focused, color, size}) => (
            <TabBarIconWithHighlight focused={focused} name="home-outline" customIcon="home" size={size} color={color} title={t('nav.home')} />
          ),
          title: t('nav.home'),
        }}
      />
      <Tab.Screen
        name="Restaurants"
        component={RestaurantsScreen}
        options={{
          tabBarIcon: ({focused, color, size}) => (
            <TabBarIconWithHighlight focused={focused} name="restaurant-outline" customIcon="cook" size={size} color={color} title={t('nav.restaurants')} />
          ),
          title: t('nav.restaurants'),
        }}
      />
      <Tab.Screen
        name="Catering"
        component={CateringScreen}
        options={{
          tabBarIcon: ({focused, color, size}) => (
            <TabBarIconWithHighlight focused={focused} name="calendar-outline" customIcon="catering" size={size} color={color} title={t('nav.catering')} />
          ),
          title: t('nav.catering'),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarIcon: ({focused, color, size}) => (
            <TabBarIconWithHighlight focused={focused} name="cart-outline" customIcon="cart" size={size} color={color} title={t('nav.cart')} />
          ),
          title: t('nav.cart'),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({focused, color, size}) => (
            <TabBarIconWithHighlight focused={focused} name="person-outline" customIcon="profile" size={size} color={color} title={t('nav.profile')} />
          ),
          title: t('nav.profile'),
          tabBarBadge: profileBadge,
        }}
      />
    </Tab.Navigator>
  );
};

// Restaurant Tab Navigator for restaurant owners (badges selon contexte: commandes, tableau de bord)
const RestaurantTabs = () => {
  const {t} = useTranslation();
  const {byCategory} = useNotificationBadges();
  const dashboardBadgeCount =
    (byCategory.general ?? 0) + (byCategory.complaint ?? 0) + (byCategory.favorite ?? 0);
  const ordersBadgeCount = byCategory.order ?? 0;
  const dashboardBadge = dashboardBadgeCount > 0 ? (dashboardBadgeCount > 99 ? '99+' : dashboardBadgeCount) : undefined;
  const ordersBadge = ordersBadgeCount > 0 ? (ordersBadgeCount > 99 ? '99+' : ordersBadgeCount) : undefined;
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.darkGreen,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
        headerShown: false,
      }}>
      <Tab.Screen
        name="Dashboard"
        component={RestaurantDashboardScreen}
        options={{
          tabBarIcon: ({focused, color, size}) => (
            <TabBarIconWithHighlight focused={focused} name="grid-outline" size={size} color={color} title={t('nav.dashboard')} />
          ),
          title: t('nav.dashboard'),
          tabBarBadge: dashboardBadge,
        }}
      />
      <Tab.Screen
        name="Orders"
        component={RestaurantOrdersScreen}
        options={{
          tabBarIcon: ({focused, color, size}) => (
            <TabBarIconWithHighlight focused={focused} name="receipt-outline" size={size} color={color} title={t('nav.orders')} />
          ),
          title: t('nav.orders'),
          tabBarBadge: ordersBadge,
        }}
      />
      <Tab.Screen
        name="Menu"
        component={RestaurantMenuScreen}
        options={{
          tabBarIcon: ({focused, color, size}) => (
            <TabBarIconWithHighlight focused={focused} name="restaurant-outline" size={size} color={color} title={t('nav.menu')} />
          ),
          title: t('nav.menu'),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={RestaurantAnalyticsScreen}
        options={{
          tabBarIcon: ({focused, color, size}) => (
            <TabBarIconWithHighlight focused={focused} name="stats-chart-outline" size={size} color={color} title={t('nav.analytics')} />
          ),
          title: t('nav.analytics'),
        }}
      />
    </Tab.Navigator>
  );
};

const SPLASH_MIN_DURATION_MS = 3000; // Durée minimale d'affichage du splash (3 s)

const AppNavigator = () => {
  const {isAuthenticated, isLoading, isRestaurant} = useAuth();

  // Durée minimale du splash pour qu'il soit toujours visible au moins 3 s
  const [splashMinReached, setSplashMinReached] = useState(false);
  // Timeout de sécurité pour éviter le chargement infini
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const minTimer = setTimeout(() => setSplashMinReached(true), SPLASH_MIN_DURATION_MS);
    return () => clearTimeout(minTimer);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_SEEN_KEY)
      .then(value => setHasSeenOnboarding(value === '1'))
      .catch(() => setHasSeenOnboarding(true));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('Auth check taking too long, forcing ready state');
        setHasTimedOut(true);
      }
    }, 5000); // 5 s max pour l'auth avant forcer

    return () => clearTimeout(timeout);
  }, [isLoading]);

  const authReady = !isLoading || hasTimedOut;
  const showSplash = !splashMinReached || !authReady || hasSeenOnboarding === null;
  const authNavigatorKey = !isAuthenticated
    ? 'guest'
    : isRestaurant
      ? 'restaurant'
      : 'user';

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      key={authNavigatorKey}
      screenOptions={{headerShown: false}}
      initialRouteName={
        !isAuthenticated
          ? hasSeenOnboarding
            ? 'Login'
            : 'Onboarding'
          : isRestaurant
            ? 'RestaurantTabs'
            : 'MainTabs'
      }>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="RestaurantDetails"
            component={RestaurantDetailsScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="GroceryShopDetails"
            component={GroceryShopDetailsScreen}
            options={({route}: any) => ({
              ...modalScreenOptions(route.params?.groceryShopName || 'Épicerie', false),
            })}
          />
          <Stack.Screen
            name="GroceryProductDetail"
            component={GroceryProductDetailScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="GroceryShops"
            component={GroceryShopsScreen}
            options={modalScreenOptions('Épicerie', false)}
          />
          <Stack.Screen
            name="DishDetails"
            component={DishDetailsScreen}
            options={({route}: any) => ({
              ...modalScreenOptions(route.params?.dishName || 'Plat', true),
            })}
          />
          <Stack.Screen
            name="SearchResults"
            component={SearchResultsScreen}
            options={modalScreenOptions('Résultats de recherche', false)}
          />
          <Stack.Screen
            name="PopularDishes"
            component={PopularDishesScreen}
            options={{
              headerShown: true,
              title: 'Plats populaires',
              headerStyle: {backgroundColor: Colors.darkGreen},
              headerTintColor: Colors.white,
              headerTitleStyle: {fontWeight: 'bold' as const, fontFamily: secondaryFont},
            }}
          />
          <Stack.Screen
            name="CateringDetails"
            component={CateringDetailsScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Catering"
            component={CateringScreen}
            options={{...modalScreenOptions('Service traiteur', false), headerShown: false}}
          />
          <Stack.Screen
            name="CateringServiceDetail"
            component={CateringServiceDetailScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="CateringFormulaDetail"
            component={CateringFormulaDetailScreen}
            options={{headerShown: false}}
          />
        </>
      ) : isRestaurant ? (
        <>
          <Stack.Screen name="RestaurantTabs" component={RestaurantTabs} />
          <Stack.Screen
            name="RestaurantProfile"
            component={RestaurantProfileScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={modalScreenOptions('Paramètres', false)}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={modalScreenOptions('Notifications', false, Colors.darkGreen)}
          />
          <Stack.Screen
            name="NotificationDetail"
            component={NotificationDetailScreen}
            options={modalScreenOptions('Détail', false, Colors.darkGreen)}
          />
          <Stack.Screen
            name="RestaurantReviews"
            component={RestaurantReviewsScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="RestaurantAnnouncements"
            component={RestaurantAnnouncementsScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="RestaurantWallet"
            component={RestaurantWalletScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="GroceryManagement"
            component={GroceryManagementScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="GroceryProductForm"
            component={GroceryProductFormScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Catering"
            component={CateringScreen}
            options={{...modalScreenOptions('Service traiteur', false), headerShown: false}}
          />
          <Stack.Screen
            name="CateringManagement"
            component={CateringManagementScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="CateringOfferDetail"
            component={CateringOfferDetailScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="PromotionsManagement"
            component={PromotionsManagementScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="PromotionForm"
            component={PromotionFormScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="EmployeesManagement"
            component={EmployeesManagementScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="EmployeeForm"
            component={EmployeeFormScreen}
            options={{headerShown: false}}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="RestaurantDetails"
            component={RestaurantDetailsScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="GroceryShopDetails"
            component={GroceryShopDetailsScreen}
            options={({route}: any) => ({
              ...modalScreenOptions(route.params?.groceryShopName || 'Épicerie', false),
            })}
          />
          <Stack.Screen
            name="GroceryProductDetail"
            component={GroceryProductDetailScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="GroceryShops"
            component={GroceryShopsScreen}
            options={modalScreenOptions('Épicerie', false)}
          />
          <Stack.Screen
            name="DishDetails"
            component={DishDetailsScreen}
            options={({route}: any) => ({
              ...modalScreenOptions(route.params?.dishName || 'Plat', true),
            })}
          />
          <Stack.Screen
            name="SearchResults"
            component={SearchResultsScreen}
            options={modalScreenOptions('Résultats de recherche', false)}
          />
          <Stack.Screen
            name="PopularDishes"
            component={PopularDishesScreen}
            options={{
              headerShown: true,
              title: 'Plats populaires',
              headerStyle: {backgroundColor: Colors.darkGreen},
              headerTintColor: Colors.white,
              headerTitleStyle: {fontWeight: 'bold' as const, fontFamily: secondaryFont},
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={({navigation}) => ({
              ...modalScreenOptions('Paramètres', false),
              headerRight: () => (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Notifications')}
                  style={{marginRight: 12}}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <IconWrapper name="notifications-outline" size={24} color={Colors.white} />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={modalScreenOptions('Notifications', false, Colors.darkGreen)}
          />
          <Stack.Screen
            name="NotificationDetail"
            component={NotificationDetailScreen}
            options={modalScreenOptions('Détail', false, Colors.darkGreen)}
          />
          <Stack.Screen
            name="Favorites"
            component={FavoritesScreen}
            options={({navigation}) => ({
              headerShown: true,
              title: 'Favoris',
              headerStyle: {backgroundColor: Colors.darkGreen},
              headerTintColor: Colors.white,
              headerTitleStyle: {fontWeight: 'bold' as const, fontFamily: secondaryFont},
              headerRight: () => (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Notifications')}
                  style={{marginRight: 12}}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <IconWrapper name="notifications-outline" size={24} color={Colors.white} />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="OrderHistory"
            component={OrderHistoryScreen}
            options={({navigation}) => ({
              headerShown: true,
              title: 'Historique des commandes',
              headerStyle: {backgroundColor: Colors.darkGreen},
              headerTintColor: Colors.white,
              headerTitleStyle: {fontWeight: 'bold' as const, fontFamily: secondaryFont},
              headerRight: () => (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Notifications')}
                  style={{marginRight: 12}}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <IconWrapper name="notifications-outline" size={24} color={Colors.white} />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="OrderDetails"
            component={OrderDetailsScreen}
            options={{
              headerShown: true,
              title: 'Détail de la commande',
              headerStyle: {backgroundColor: Colors.darkGreen},
              headerTintColor: Colors.white,
              headerTitleStyle: {fontWeight: 'bold' as const, fontFamily: secondaryFont},
            }}
          />
          <Stack.Screen
            name="OrderStats"
            component={OrderStatsScreen}
            options={{
              headerShown: true,
              title: 'Statistiques commandes',
              headerStyle: {backgroundColor: Colors.darkGreen},
              headerTintColor: Colors.white,
              headerTitleStyle: {fontWeight: 'bold' as const, fontFamily: secondaryFont},
            }}
          />
          <Stack.Screen
            name="CateringDetails"
            component={CateringDetailsScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Catering"
            component={CateringScreen}
            options={{...modalScreenOptions('Service traiteur', false), headerShown: false}}
          />
          <Stack.Screen
            name="CateringServiceDetail"
            component={CateringServiceDetailScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="CateringFormulaDetail"
            component={CateringFormulaDetailScreen}
            options={{headerShown: false}}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIconWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 2,
    gap: 4,
  },
  tabTitleActive: {
    fontSize: 11,
    fontFamily: secondaryFont,
    fontWeight: '600',
    maxWidth: 72,
  },
  tabTitleInactive: {
    fontSize: 11,
    fontFamily: secondaryFont,
    color: Colors.textLight,
    maxWidth: 64,
  },
});

export default AppNavigator;

