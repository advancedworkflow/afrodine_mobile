/**
 * Full app tree for web: providers + navigation.
 */
import React from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {AuthProvider} from './contexts/AuthContext';
import {SearchProvider} from './contexts/SearchContext';
import {CartProvider} from './contexts/CartContext';
import {FavoritesProvider} from './contexts/FavoritesContext';
import {Colors} from './utils/colors';
import AppNavigatorComponent from './navigation/AppNavigator';
import {StripePaymentBridge} from './components/StripePaymentBridge';
import {StripeBootstrapProvider} from './contexts/StripeBootstrapContext';

export default function WebAppRoot() {
  return (
    <StripeBootstrapProvider>
    <StripePaymentBridge stripeReady={false}>
      <AuthProvider>
        <SearchProvider>
          <CartProvider>
            <FavoritesProvider>
              <NavigationContainer>
                <StatusBar barStyle="dark-content" backgroundColor={Colors.primary} />
                <AppNavigatorComponent />
              </NavigationContainer>
            </FavoritesProvider>
          </CartProvider>
        </SearchProvider>
      </AuthProvider>
    </StripePaymentBridge>
    </StripeBootstrapProvider>
  );
}
