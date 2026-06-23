import React, {useState} from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import {Colors} from '../../utils/colors';
import {getAbsoluteImageUrl} from '../../utils/api';

interface PromoBannerProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  imageUrl?: string;
  discountLabel?: string;
  onPress?: () => void;
}

const DEFAULT_IMAGE = 'https://placehold.co/800x400/png?text=Promo';

const PromoBanner: React.FC<PromoBannerProps> = ({
  title = '30% OFF',
  subtitle = 'Sur votre première\ncommande',
  buttonText = 'Commander',
  imageUrl,
  discountLabel,
  onPress,
}) => {
  const [imgError, setImgError] = useState(false);
  const resolvedUri =
    imageUrl && !imgError
      ? (getAbsoluteImageUrl(imageUrl) ?? imageUrl)
      : DEFAULT_IMAGE;
  return (
    <View style={styles.container}>
      <Image
        source={{uri: resolvedUri}}
        style={styles.image}
        resizeMode="cover"
        onError={() => setImgError(true)}
      />
      <View style={styles.overlay}>
        <View style={styles.gradient} />
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
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
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
    borderRadius: 8,
  },
  discountBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.white,
    marginBottom: 12,
    lineHeight: 20,
  },
  button: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PromoBanner;

