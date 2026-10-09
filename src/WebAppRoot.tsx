/**
 * Full app tree for web: providers + navigation.
 */
import React, {useState} from 'react';
import {StatusBar, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {AuthProvider} from './contexts/AuthContext';
import {SearchProvider} from './contexts/SearchContext';
import {CartProvider} from './contexts/CartContext';
import {FavoritesProvider} from './contexts/FavoritesContext';
import {Colors} from './utils/colors';
import AppNavigatorComponent from './navigation/AppNavigator';
import GlobalTabBar from './components/GlobalTabBar';
import {navigationRef} from './navigation/navigationRef';
import {StripePaymentBridge} from './components/StripePaymentBridge';
import {StripeBootstrapProvider} from './contexts/StripeBootstrapContext';

export default function WebAppRoot() {
  const [currentRoute, setCurrentRoute] = useState<string | undefined>();

  return (
    <StripeBootstrapProvider>
    <StripePaymentBridge stripeReady={false}>
      <AuthProvider>
        <SearchProvider>
          <CartProvider>
            <FavoritesProvider>
              <View style={{flex: 1}}>
                <NavigationContainer
                  ref={navigationRef}
                  onReady={() => setCurrentRoute(navigationRef.getCurrentRoute()?.name)}
                  onStateChange={() => setCurrentRoute(navigationRef.getCurrentRoute()?.name)}>
                  <StatusBar barStyle="dark-content" backgroundColor={Colors.primary} />
                  <AppNavigatorComponent />
                </NavigationContainer>
                <GlobalTabBar currentRoute={currentRoute} />
              </View>
            </FavoritesProvider>
          </CartProvider>
        </SearchProvider>
      </AuthProvider>
    </StripePaymentBridge>
    </StripeBootstrapProvider>
  );
}
