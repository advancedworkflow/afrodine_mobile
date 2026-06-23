import React, {useEffect, useRef, useState} from 'react';
import {View, Text, StyleSheet, Animated, TouchableOpacity, Platform} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import IconWrapper from '../components/IconWrapper';
import {useAuth} from '../contexts/AuthContext';
import {useNotificationBadges} from '../hooks/useNotificationBadges';
import {Colors} from '../utils/colors';
import {secondaryFont} from '../utils/fonts';

const modalScreenOptions = (title: string, showOptions = false) => ({
  presentation: 'modal' as const,
  headerShown: true,
  title,
  headerStyle: {backgroundColor: Colors.primary},
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
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import RestaurantsScreen from '../screens/RestaurantsScreen';
import RestaurantDetailsScreen from '../screens/RestaurantDetailsScreen';
import DishDetailsScreen from '../screens/DishDetailsScreen';
import SearchResultsScreen from '../screens/SearchResultsScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import RestaurantDashboardScreen from '../screens/restaurant/DashboardScreen';
import RestaurantOrdersScreen from '../screens/restaurant/OrdersScreen';
import RestaurantMenuScreen from '../screens/restaurant/MenuScreen';
import RestaurantAnalyticsScreen from '../screens/restaurant/AnalyticsScreen';
import RestaurantProfileScreen from '../screens/restaurant/ProfileScreen';
import RestaurantReviewsScreen from '../screens/restaurant/ReviewsScreen';
import RestaurantAnnouncementsScreen from '../screens/restaurant/AnnouncementsScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import OrderStatsScreen from '../screens/OrderStatsScreen';
import CateringScreen from '../screens/CateringScreen';
import CateringDetailsScreen from '../screens/CateringDetailsScreen';
import CateringServiceDetailScreen from '../screens/CateringServiceDetailScreen';
import PopularDishesScreen from '../screens/PopularDishesScreen';
import CateringManagementScreen from '../screens/restaurant/CateringManagementScreen';
import CateringOfferDetailScreen from '../screens/restaurant/CateringOfferDetailScreen';
import PromotionsManagementScreen from '../screens/restaurant/PromotionsManagementScreen';
import PromotionFormScreen from '../screens/restaurant/PromotionFormScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const SHOULD_USE_NATIVE_DRIVER = Platform.OS !== 'web';

const ACTIVE_ICON_BG = 'rgba(114, 183, 68, 0.45)'; // olive

const TabBarIconWithHighlight = ({
  focused,
  name,
  size,
  color,
  title,
}: {
  focused: boolean;
  name: string;
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
        focused && styles.tabIconWrapperActive,
        { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
      ]}>
      <IconWrapper name={name} size={size} color={color} />
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
  const {unreadCount} = useNotificationBadges();
  const profileBadge = unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined;
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: Colors.white,
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
            <TabBarIconWithHighlight focused={focused} name="home-outline" size={size} color={color} title="Accueil" />
          ),
          title: 'Accueil',
        }}
      />
      <Tab.Screen
        name="Restaurants"
        component={RestaurantsScreen}
        options={{
          tabBarIcon: ({focused, color, size}) => (
            <TabBarIconWithHighlight focused={focused} name="restaurant-outline" size={size} color={color} title="Restaurants" />
          ),
          title: 'Restaurants',
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarIcon: ({focused, color, size}) => (
            <TabBarIconWithHighlight focused={focused} name="cart-outline" size={size} color={color} title="Panier" />
          ),
          title: 'Panier',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({focused, color, size}) => (
            <TabBarIconWithHighlight focused={focused} name="person-outline" size={size} color={color} title="Profil" />
          ),
          title: 'Profil',
          tabBarBadge: profileBadge,
        }}
      />
    </Tab.Navigator>
  );
};

// Restaurant Tab Navigator for restaurant owners (badges selon contexte: commandes, tableau de bord)
const RestaurantTabs = () => {
  const {byCategory} = useNotificationBadges();
  const dashboardBadgeCount =
    (byCategory.general ?? 0) + (byCategory.complaint ?? 0) + (byCategory.favorite ?? 0);
  const ordersBadgeCount = byCategory.order ?? 0;
  const dashboardBadge = dashboardBadgeCount > 0 ? (dashboardBadgeCount > 99 ? '99+' : dashboardBadgeCount) : undefined;
  const ordersBadge = ordersBadgeCount > 0 ? (ordersBadgeCount > 99 ? '99+' : ordersBadgeCount) : undefined;
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: Colors.white,
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
            <TabBarIconWithHighlight focused={focused} name="grid-outline" size={size} color={color} title="Tableau de bord" />
          ),
          title: 'Tableau de bord',
          tabBarBadge: dashboardBadge,
        }}
      />
      <Tab.Screen
        name="Orders"
        component={RestaurantOrdersScreen}
        options={{
          tabBarIcon: ({focused, color, size}) => (
            <TabBarIconWithHighlight focused={focused} name="receipt-outline" size={size} color={color} title="Commandes" />
          ),
          title: 'Commandes',
          tabBarBadge: ordersBadge,
        }}
      />
      <Tab.Screen
        name="Menu"
        component={RestaurantMenuScreen}
        options={{
          tabBarIcon: ({focused, color, size}) => (
            <TabBarIconWithHighlight focused={focused} name="restaurant-outline" size={size} color={color} title="Menu" />
          ),
          title: 'Menu',
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={RestaurantAnalyticsScreen}
        options={{
          tabBarIcon: ({focused, color, size}) => (
            <TabBarIconWithHighlight focused={focused} name="stats-chart-outline" size={size} color={color} title="Statistiques" />
          ),
          title: 'Statistiques',
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

  useEffect(() => {
    const minTimer = setTimeout(() => setSplashMinReached(true), SPLASH_MIN_DURATION_MS);
    return () => clearTimeout(minTimer);
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
  const showSplash = !splashMinReached || !authReady;
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
      initialRouteName={!isAuthenticated ? "Login" : isRestaurant ? "RestaurantTabs" : "MainTabs"}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="RestaurantDetails"
            component={RestaurantDetailsScreen}
            options={({route}: any) => ({
              ...modalScreenOptions(route.params?.restaurantName || 'Restaurant', false),
            })}
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
              headerStyle: {backgroundColor: Colors.primary},
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
            options={modalScreenOptions('Notifications', false)}
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
        </>
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="RestaurantDetails"
            component={RestaurantDetailsScreen}
            options={({route}: any) => ({
              ...modalScreenOptions(route.params?.restaurantName || 'Restaurant', false),
            })}
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
              headerStyle: {backgroundColor: Colors.primary},
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
            options={modalScreenOptions('Notifications', false)}
          />
          <Stack.Screen
            name="Favorites"
            component={FavoritesScreen}
            options={({navigation}) => ({
              headerShown: true,
              title: 'Favoris',
              headerStyle: {backgroundColor: Colors.primary},
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
              headerStyle: {backgroundColor: Colors.primary},
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
              headerStyle: {backgroundColor: Colors.primary},
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
              headerStyle: {backgroundColor: Colors.primary},
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
    paddingVertical: 6,
    borderRadius: 999,
    gap: 2,
  },
  tabIconWrapperActive: {
    backgroundColor: ACTIVE_ICON_BG,
  },
  tabTitleActive: {
    fontSize: 11,
    fontWeight: '600',
    maxWidth: 72,
  },
  tabTitleInactive: {
    fontSize: 10,
    color: Colors.textLight,
    maxWidth: 64,
  },
});

export default AppNavigator;

