import React from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet, StatusBar} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Colors, Radius} from '../utils/colors';
import {fontButton, fontDisplay, fontUI} from '../utils/fonts';

export const ONBOARDING_SEEN_KEY = 'namke_onboarding_seen';

const OnboardingScreen = ({navigation}: any) => {
  const finishOnboarding = async (next: 'Signup' | 'Login') => {
    try {
      await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, '1');
    } catch (_) {
      // ignore
    }
    navigation.replace(next);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.imageWrap}>
        <Image source={require('../assets/namke-banner.png')} style={styles.image} resizeMode="cover" />
        <View style={styles.overlayTop} />
        <View style={styles.overlayBottom} />
        <TouchableOpacity style={styles.skipButton} onPress={() => finishOnboarding('Login')} activeOpacity={0.85}>
          <Text style={styles.skipButtonText}>Passer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <Text style={styles.title}>Mangez comme à la maison</Text>
        <Text style={styles.subtitle}>
          Des plats africains mijotés le matin par des voisin·e·s de Neukölln, Kreuzberg et Wedding.
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => finishOnboarding('Signup')} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Commencer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => finishOnboarding('Login')} activeOpacity={0.7}>
            <Text style={styles.secondaryButtonText}>J'ai déjà un compte</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  imageWrap: {
    height: '55%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: Colors.namkeBlack,
    opacity: 0.22,
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: Colors.background,
    opacity: 0.9,
  },
  skipButton: {
    position: 'absolute',
    top: 18,
    right: 22,
    backgroundColor: 'rgba(252,251,245,0.9)',
    borderRadius: Radius.pill,
    paddingHorizontal: 20,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    fontFamily: fontButton,
    color: Colors.darkGreen,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 4,
    paddingBottom: 22,
    gap: 14,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(5,16,4,0.18)',
  },
  dotActive: {
    width: 26,
    backgroundColor: Colors.terracotta,
  },
  title: {
    fontSize: 38,
    lineHeight: 38,
    fontFamily: fontDisplay,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 25,
    fontFamily: fontUI,
    color: Colors.textLight,
  },
  actions: {
    marginTop: 'auto',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.terracotta,
    borderRadius: Radius.pill,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 17,
    fontFamily: fontButton,
    color: Colors.namkeWhite,
  },
  secondaryButton: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15.5,
    fontFamily: fontButton,
    color: Colors.darkGreen,
  },
});

export default OnboardingScreen;
