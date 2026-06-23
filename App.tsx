import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {StatusBar} from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import {AuthProvider} from './src/contexts/AuthContext';
import {SearchProvider} from './src/contexts/SearchContext';
import {CartProvider} from './src/contexts/CartContext';
import {FavoritesProvider} from './src/contexts/FavoritesContext';
import AppNavigator from './src/navigation/AppNavigator';
import {Colors} from './src/utils/colors';
import notificationService from './src/services/notificationService';
import {StripeAppRoot} from './src/components/StripeAppRoot.native';

const App = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Configure notifications
    notificationService.configure();

    // Hide splash screen after app is ready (3 s)
    const timer = setTimeout(() => {
      SplashScreen.hide();
      setIsReady(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <StripeAppRoot>
      <AuthProvider>
        <SearchProvider>
          <CartProvider>
            <FavoritesProvider>
              <NavigationContainer>
                <StatusBar
                  barStyle="dark-content"
                  backgroundColor={Colors.primary}
                />
                <AppNavigator />
              </NavigationContainer>
            </FavoritesProvider>
          </CartProvider>
        </SearchProvider>
      </AuthProvider>
    </StripeAppRoot>
  );
};

export default App;

