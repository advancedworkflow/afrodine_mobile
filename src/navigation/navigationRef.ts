import {useContext} from 'react';
import {Platform} from 'react-native';
import {SafeAreaInsetsContext} from 'react-native-safe-area-context';
import {createNavigationContainerRef} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

/** Hauteur de <GlobalTabBar> — à réserver en bas des écrans du parcours client
 * (padding de scroll, ou décalage des barres d'action sticky) pour ne pas être masqués. */
export const GLOBAL_TAB_BAR_HEIGHT = 64;

/** Hauteur affichée de <GlobalTabBar> : sur iOS elle descend jusqu'au bord de l'écran et
 * inclut l'indicateur d'accueil. Contexte (et non le hook) : pas de SafeAreaProvider sur le web. */
export function useGlobalTabBarHeight(): number {
  const insets = useContext(SafeAreaInsetsContext);
  return GLOBAL_TAB_BAR_HEIGHT + (Platform.OS === 'ios' ? insets?.bottom ?? 0 : 0);
}

/** Nom de l'onglet client actif d'après la route courante, ou null si non applicable (auth, onboarding...). */
export type ClientTabName = 'Home' | 'Restaurants' | 'Catering' | 'Cart' | 'Profile';

const ROUTE_TO_TAB: Record<string, ClientTabName> = {
  Home: 'Home',
  DishDetails: 'Home',
  SearchResults: 'Home',
  PopularDishes: 'Home',
  GroceryShops: 'Home',
  GroceryShopDetails: 'Home',
  GroceryProductDetail: 'Home',
  Notifications: 'Home',
  NotificationDetail: 'Home',
  Restaurants: 'Restaurants',
  RestaurantDetails: 'Restaurants',
  Catering: 'Catering',
  CateringDetails: 'Catering',
  CateringServiceDetail: 'Catering',
  CateringFormulaDetail: 'Catering',
  Cart: 'Cart',
  Profile: 'Profile',
  EditProfile: 'Profile',
  Settings: 'Profile',
  TwoFactorAuth: 'Profile',
  Help: 'Profile',
  Terms: 'Profile',
  Favorites: 'Profile',
  OrderHistory: 'Profile',
  OrderDetails: 'Profile',
  OrderStats: 'Profile',
};

/**
 * Onglet actif pour une route donnée, ou null si la route ne fait pas partie du parcours
 * client à onglets (auth, onboarding, dashboard restaurateur...) — la barre reste alors masquée.
 */
export function getActiveClientTab(routeName?: string): ClientTabName | null {
  if (!routeName) return null;
  return ROUTE_TO_TAB[routeName] ?? null;
}
