import React, {useCallback, useEffect, useRef, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {Animated, Platform, StatusBar, StyleSheet, View} from 'react-native';
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
import {getTopAreaColor, navigationRef} from './src/navigation/navigationRef';
import {Colors} from './src/utils/colors';
import notificationService from './src/services/notificationService';
import AppSplashScreen from './src/screens/SplashScreen';
import {StripeAppRoot} from './src/components/StripeAppRoot.native';

const App = () => {
  const [currentRoute, setCurrentRoute] = useState<string | undefined>();
  const [splashVisible, setSplashVisible] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    notificationService.configure();
    SplashScreen.hide();
  }, []);

  // Un seul splash, en calque plein écran au-dessus de l'app (pas de Modal : son ouverture et sa
  // fermeture faisaient clignoter l'écran en blanc) ; il s'efface quand AppNavigator est prêt.
  const hideSplash = useCallback(() => {
    Animated.timing(splashOpacity, {toValue: 0, duration: 250, useNativeDriver: true}).start(() =>
      setSplashVisible(false),
    );
  }, [splashOpacity]);

  const topAreaColor = getTopAreaColor(currentRoute);

  // Les écrans posent souvent leur propre StatusBar ; on impose ici le style lisible sur la bande du haut
  useEffect(() => {
    if (Platform.OS !== 'ios' || splashVisible) return;
    StatusBar.setBarStyle(topAreaColor === Colors.darkGreen ? 'light-content' : 'dark-content', true);
  }, [topAreaColor, splashVisible]);

  return (
    <SafeAreaProvider>
      {/* Edge-to-edge (Android 15+) : réserve la barre de navigation système en bas ; le
          provider imbriqué repart de ce cadre, pour que les navigateurs ne la comptent pas deux fois.
          iOS : réserve le haut (encoche / Dynamic Island), que les écrans ne gèrent pas, mais pas
          le bas : les barres d'onglets descendent jusqu'au bord et absorbent l'indicateur d'accueil. */}
      <SafeAreaView
        edges={Platform.OS === 'ios' ? ['top'] : ['bottom']}
        style={{flex: 1, backgroundColor: Platform.OS === 'ios' ? topAreaColor : Colors.background}}>
        <SafeAreaProvider>
          <StripeAppRoot>
            <AuthProvider>
              <SearchProvider>
                <CartProvider>
                  <FavoritesProvider>
                    <View style={{flex: 1, backgroundColor: Colors.background}}>
                      <NavigationContainer
                        ref={navigationRef}
                        onReady={() => setCurrentRoute(navigationRef.getCurrentRoute()?.name)}
                        onStateChange={() => setCurrentRoute(navigationRef.getCurrentRoute()?.name)}>
                        <StatusBar
                          barStyle="dark-content"
                          backgroundColor={Colors.primary}
                        />
                        <AppNavigator onSplashDone={hideSplash} />
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
      {splashVisible && (
        <Animated.View style={[StyleSheet.absoluteFill, {opacity: splashOpacity}]} pointerEvents="none">
          <AppSplashScreen />
        </Animated.View>
      )}
    </SafeAreaProvider>
  );
};

export default App;

