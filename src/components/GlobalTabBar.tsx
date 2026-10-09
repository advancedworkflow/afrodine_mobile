import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import {StackActions} from '@react-navigation/native';
import CustomIcon, {type CustomIconName} from './CustomIcon';
import {useAuth} from '../contexts/AuthContext';
import {useNotificationBadges} from '../hooks/useNotificationBadges';
import {Colors, Shadows} from '../utils/colors';
import {secondaryFont} from '../utils/fonts';
import {getActiveClientTab, navigationRef, GLOBAL_TAB_BAR_HEIGHT, type ClientTabName} from '../navigation/navigationRef';

interface GlobalTabBarProps {
  currentRoute?: string;
}

const TABS: {key: ClientTabName; icon: CustomIconName; labelKey: string}[] = [
  {key: 'Home', icon: 'home', labelKey: 'nav.home'},
  {key: 'Restaurants', icon: 'cook', labelKey: 'nav.restaurants'},
  {key: 'Catering', icon: 'catering', labelKey: 'nav.catering'},
  {key: 'Cart', icon: 'cart', labelKey: 'nav.cart'},
  {key: 'Profile', icon: 'profile', labelKey: 'nav.profile'},
];

/**
 * Barre d'onglets rendue par-dessus toute l'app (App.tsx / WebAppRoot.tsx), en dehors du
 * Tab.Navigator : reste visible même sur les écrans de détail empilés sur la pile racine
 * (DishDetails, RestaurantDetails...), contrairement à la tabBar native de MainTabs (masquée).
 */
const GlobalTabBar: React.FC<GlobalTabBarProps> = ({currentRoute}) => {
  const {t} = useTranslation();
  const {isAuthenticated, isRestaurant} = useAuth();
  const {unreadCount} = useNotificationBadges();
  const activeTab = getActiveClientTab(currentRoute);

  if (isRestaurant || !activeTab) {
    return null;
  }

  const goToTab = (tab: ClientTabName) => {
    if (!navigationRef.isReady()) return;
    navigationRef.dispatch(StackActions.popTo('MainTabs', {screen: tab}));
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.bar}>
        {TABS.map(tab => {
          const focused = tab.key === activeTab;
          const color = focused ? Colors.terracotta : Colors.textLight;
          const badge = tab.key === 'Profile' && unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : undefined;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              activeOpacity={0.75}
              onPress={() => goToTab(tab.key)}>
              <View>
                <CustomIcon name={tab.icon} fallbackName={tab.icon} size={24} color={color} />
                {badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={[styles.label, {color}, focused && styles.labelActive]}
                numberOfLines={1}>
                {t(tab.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: GLOBAL_TAB_BAR_HEIGHT,
    paddingBottom: 8,
    paddingTop: 8,
    ...Shadows.md,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontFamily: secondaryFont,
    maxWidth: 72,
  },
  labelActive: {
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.terracotta,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontFamily: secondaryFont,
    color: Colors.white,
  },
});

export default GlobalTabBar;
