import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import IconWrapper from '../IconWrapper';
import {Colors} from '../../utils/colors';

interface LocationSectionProps {
  address?: string;
  onPress?: () => void;
}

const LocationSection: React.FC<LocationSectionProps> = ({
  address = '123 Rue de la Paix, Paris',
  onPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <IconWrapper name="location-outline" size={20} color={Colors.primaryLight} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Livrer à</Text>
          <Text style={styles.address} numberOfLines={1}>
            {address}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={onPress} style={styles.chevronButton}>
        <IconWrapper name="chevron-down-outline" size={20} color={Colors.primaryLight} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primaryLight + '1A', // 10% opacity
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 2,
  },
  address: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  chevronButton: {
    padding: 4,
  },
});

export default LocationSection;

