import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import IconWrapper from '../IconWrapper';
import {Colors} from '../../utils/colors';

interface SpecialOfferCardProps {
  id: string;
  title: string;
  description: string;
  discount: string;
  originalPrice?: number;
  currentPrice?: number;
  icon?: string;
  gradientColors?: string[];
  onPress?: () => void;
}

const SpecialOfferCard: React.FC<SpecialOfferCardProps> = ({
  title,
  description,
  discount,
  originalPrice,
  currentPrice,
  icon = 'fast-food',
  gradientColors = ['#f97316', '#ef4444'], // orange to red
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {backgroundColor: gradientColors[0]},
      ]}
      onPress={onPress}
      activeOpacity={0.8}>
      <View style={styles.content}>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{discount}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        {originalPrice && currentPrice && (
          <View style={styles.priceContainer}>
            <Text style={styles.originalPrice}>{originalPrice.toFixed(2)}€</Text>
            <Text style={styles.currentPrice}>{currentPrice.toFixed(2)}€</Text>
          </View>
        )}
      </View>
      <View style={styles.iconContainer}>
        <IconWrapper name={icon} size={32} color={Colors.white} />
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
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: Colors.white + 'BF', // 75% opacity
    textDecorationLine: 'line-through',
  },
  currentPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: Colors.white + '1A', // 10% opacity
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SpecialOfferCard;

