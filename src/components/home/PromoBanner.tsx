import React, {useState} from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import {Colors, Radius} from '../../utils/colors';
import {fontButton, fontDisplay, fontHeading, fontUI} from '../../utils/fonts';
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
  subtitle = 'Sur votre première\ncommande',
  buttonText = 'Commander',
  imageUrl,
  backgroundColor,
  discountLabel,
  onPress,
}) => {
  const [imgError, setImgError] = useState(false);
  const resolvedUri =
    imageUrl && !imgError ? (getAbsoluteImageUrl(imageUrl) ?? imageUrl) : null;
  return (
    <View style={styles.container}>
      <Image
        source={resolvedUri ? {uri: resolvedUri} : namkeFallback}
        style={styles.image}
        resizeMode="cover"
        onError={() => setImgError(true)}
      />
      <View style={styles.overlay}>
        <View style={[styles.gradient, backgroundColor ? {backgroundColor: backgroundColor + 'CC'} : null]} />
        {discountLabel ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>{discountLabel}</Text>
          </View>
        ) : null}
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <TouchableOpacity style={styles.button} onPress={onPress}>
            <Text style={styles.buttonText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 160,
    overflow: 'hidden',
    width: '100%',
    marginVertical: 16,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  discountBadgeText: {
    fontSize: 14,
    fontFamily: fontHeading,
    color: Colors.primary,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primary + 'CC', // 80% opacity
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontFamily: fontDisplay,
    color: Colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fontUI,
    color: Colors.white,
    marginBottom: 12,
    lineHeight: 20,
  },
  button: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: Colors.primary,
    fontSize: 14,
    fontFamily: fontButton,
  },
});

export default PromoBanner;

