import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import IconWrapper from '../IconWrapper';
import {Colors} from '../../utils/colors';

interface SpecialOfferCardProps {
  id: string;
  title: string;
  description: string;
  discount: string;
  imageUrl?: string;
  backgroundColor?: string;
  buttonText?: string;
  icon?: string;
  onPress?: () => void;
  onButtonPress?: () => void;
}

const SpecialOfferCard: React.FC<SpecialOfferCardProps> = ({
  title,
  description,
  discount,
  imageUrl,
  backgroundColor,
  buttonText = 'Découvrir',
  icon = 'fast-food',
  onPress,
  onButtonPress,
}) => {
  const bg = backgroundColor || Colors.primary;

  return (
    <TouchableOpacity
      style={[styles.container, {backgroundColor: bg}]}
      onPress={onPress}
      activeOpacity={0.9}>
      <View style={styles.content}>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{discount}</Text>
        </View>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.description} numberOfLines={2}>{description}</Text>
        <TouchableOpacity style={styles.button} onPress={onButtonPress ?? onPress} activeOpacity={0.85}>
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.iconContainer}>
        {imageUrl ? (
          <Image source={{uri: imageUrl}} style={styles.image} resizeMode="cover" />
        ) : (
          <IconWrapper name={icon} size={32} color={Colors.white} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingRight: 12,
  },
  discountBadge: {
    backgroundColor: Colors.white + '33', // 20% opacity
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  discountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.white,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: Colors.white + 'E6', // 90% opacity
    marginBottom: 12,
    lineHeight: 16,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark ?? Colors.primary,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: Colors.white + '1A', // 10% opacity
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default SpecialOfferCard;
