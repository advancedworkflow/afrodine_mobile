import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {StatusBar, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import SplashScreen from 'react-native-splash-screen';
import './src/utils/applyDefaultFont';
import './src/i18n';
import {AuthProvider} from './src/contexts/AuthContext';
import {SearchProvider} from './src/contexts/SearchContext';
import {CartProvider} from './src/contexts/CartContext';
import {FavoritesProvider} from './src/contexts/FavoritesContext';
import AppNavigator from './src/navigation/AppNavigator';
import GlobalTabBar from './src/components/GlobalTabBar';
import {navigationRef} from './src/navigation/navigationRef';
import {Colors} from './src/utils/colors';
import notificationService from './src/services/notificationService';
import {StripeAppRoot} from './src/components/StripeAppRoot.native';

const App = () => {
  const [isReady, setIsReady] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<string | undefined>();

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
    <SafeAreaProvider>
      {/* Edge-to-edge (Android 15+) : réserve la barre de navigation système en bas ; le
          provider imbriqué repart de ce cadre, pour que les navigateurs ne la comptent pas deux fois. */}
      <SafeAreaView edges={['bottom']} style={{flex: 1, backgroundColor: Colors.background}}>
        <SafeAreaProvider>
          <StripeAppRoot>
            <AuthProvider>
              <SearchProvider>
                <CartProvider>
                  <FavoritesProvider>
                    <View style={{flex: 1}}>
                      <NavigationContainer
                        ref={navigationRef}
                        onReady={() => setCurrentRoute(navigationRef.getCurrentRoute()?.name)}
                        onStateChange={() => setCurrentRoute(navigationRef.getCurrentRoute()?.name)}>
                        <StatusBar
                          barStyle="dark-content"
                          backgroundColor={Colors.primary}
                        />
                        <AppNavigator />
                      </NavigationContainer>
                      <GlobalTabBar currentRoute={currentRoute} />
                    </View>
                  </FavoritesProvider>
                </CartProvider>
              </SearchProvider>
            </AuthProvider>
          </StripeAppRoot>
        </SafeAreaProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default App;

