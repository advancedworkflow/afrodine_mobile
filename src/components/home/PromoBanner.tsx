import React, {useState} from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Colors, Radius, Shadows} from '../../utils/colors';
import {fontButton, fontDisplayMedium, fontHeading, fontSub} from '../../utils/fonts';
import {getAbsoluteImageUrl} from '../../utils/api';

const namkeFallback = require('../../assets/namke-fallback.png');

interface PromoBannerProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  imageUrl?: string;
  backgroundColor?: string;
  discountLabel?: string;
  onPress?: () => void;
}

const PromoBanner: React.FC<PromoBannerProps> = ({
  title = '30% OFF',
  subtitle,
  buttonText,
  imageUrl,
  backgroundColor,
  discountLabel,
  onPress,
}) => {
  const {t} = useTranslation();
  const resolvedSubtitle = subtitle ?? t('promoBanner.defaultSubtitle');
  const resolvedButtonText = buttonText ?? t('promoBanner.defaultButtonText');
  const [imgError, setImgError] = useState(false);
  const resolvedUri =
    imageUrl && !imgError ? (getAbsoluteImageUrl(imageUrl) ?? imageUrl) : null;
  const accentColor = backgroundColor || Colors.terracotta;
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageWrap}>
        <Image
          source={resolvedUri ? {uri: resolvedUri} : namkeFallback}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
        {discountLabel ? (
          <View style={[styles.discountBadge, {backgroundColor: accentColor}]}>
            <Text style={styles.discountBadgeText}>{discountLabel}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>{resolvedSubtitle}</Text>
        <View style={[styles.button, {backgroundColor: accentColor}]}>
          <Text style={styles.buttonText}>{resolvedButtonText}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  imageWrap: {
    width: '100%',
    height: 130,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.gray[100],
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  discountBadgeText: {
    fontSize: 12.5,
    fontFamily: fontHeading,
    color: Colors.white,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: fontDisplayMedium,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13.5,
    fontFamily: fontSub,
    color: Colors.textLight,
    marginBottom: 12,
    lineHeight: 19,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 13,
    fontFamily: fontButton,
  },
});

export default PromoBanner;

