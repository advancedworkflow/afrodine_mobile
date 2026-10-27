import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  ScrollView,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTranslation} from 'react-i18next';
import {Colors, Radius} from '../utils/colors';
import {fontButton, fontDisplay, fontUI} from '../utils/fonts';
import IconWrapper from '../components/IconWrapper';

export const ONBOARDING_SEEN_KEY = 'namke_onboarding_seen';

// La 1re slide garde la bannière photo ; les suivantes une illustration par icône
const SLIDES = [
  {key: 'home', titleKey: 'onboarding.title', subtitleKey: 'onboarding.subtitle'},
  {key: 'kitchens', titleKey: 'onboarding.slide2Title', subtitleKey: 'onboarding.slide2Subtitle', icon: 'storefront-outline', bg: Colors.terracotta},
  {key: 'order', titleKey: 'onboarding.slide3Title', subtitleKey: 'onboarding.slide3Subtitle', icon: 'bicycle-outline', bg: Colors.darkGreen},
];

const OnboardingScreen = ({navigation}: any) => {
  const {t} = useTranslation();
  const {width} = useWindowDimensions();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const goNext = () => {
    scrollRef.current?.scrollTo({x: (index + 1) * width, animated: true});
    setIndex(index + 1);
  };
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
      <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'} translucent backgroundColor="transparent" />
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        style={styles.slides}>
        {SLIDES.map((slide) => (
          <View key={slide.key} style={{width}}>
            <View style={styles.imageWrap}>
              {slide.icon ? (
                <View style={[styles.illustration, {backgroundColor: slide.bg}]}>
                  <View style={styles.illustrationCircle}>
                    <IconWrapper name={slide.icon} size={96} color={Colors.white} />
                  </View>
                </View>
              ) : (
                <>
                  <Image source={require('../assets/namke-banner.png')} style={styles.image} resizeMode="cover" />
                  <View style={styles.overlayTop} />
                </>
              )}
              <View style={styles.overlayBottom} />
            </View>
            <View style={styles.slideText}>
              <Text style={styles.title}>{t(slide.titleKey)}</Text>
              <Text style={styles.subtitle}>{t(slide.subtitleKey)}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.skipButton} onPress={() => finishOnboarding('Login')} activeOpacity={0.85}>
        <Text style={styles.skipButtonText}>{t('onboarding.skip')}</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <View key={slide.key} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={isLast ? () => finishOnboarding('Signup') : goNext}
            activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>{isLast ? t('onboarding.start') : t('onboarding.next')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => finishOnboarding('Login')} activeOpacity={0.7}>
            <Text style={styles.secondaryButtonText}>{t('onboarding.alreadyHaveAccount')}</Text>
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
  slides: {
    flex: 1,
  },
  imageWrap: {
    flex: 1,
    position: 'relative',
  },
  illustration: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideText: {
    paddingHorizontal: 30,
    paddingTop: 4,
    gap: 14,
    minHeight: 190,
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
    fontSize: 15,
    fontFamily: fontButton,
    color: Colors.darkGreen,
  },
  content: {
    paddingHorizontal: 30,
    paddingBottom: 22,
    gap: 18,
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
    fontSize: 17,
    lineHeight: 26,
    fontFamily: fontUI,
    color: Colors.textLight,
  },
  actions: {
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
    fontSize: 18,
    fontFamily: fontButton,
    color: Colors.namkeWhite,
  },
  secondaryButton: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16.5,
    fontFamily: fontButton,
    color: Colors.darkGreen,
  },
});

export default OnboardingScreen;
