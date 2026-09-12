import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import IconWrapper from '../IconWrapper';
import {Colors, Radius} from '../../utils/colors';
import {fontButton, fontHeading} from '../../utils/fonts';

interface LocationSectionProps {
  address?: string;
  onPress?: () => void;
  onNotificationsPress?: () => void;
  hasUnreadNotifications?: boolean;
}

const LocationSection: React.FC<LocationSectionProps> = ({
  address = 'Adresse non renseignée',
  onPress,
  onNotificationsPress,
  hasUnreadNotifications = true,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.textContainer} onPress={onPress} activeOpacity={0.7}>
        <Text style={styles.label}>Livrer à</Text>
        <Text style={styles.address} numberOfLines={1}>
          {address} ▾
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.notificationButton}
        onPress={onNotificationsPress}
        activeOpacity={0.8}>
        <IconWrapper name="notifications-outline" size={20} color={Colors.white} />
        {hasUnreadNotifications && <View style={styles.notificationBadge} />}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 16,
    backgroundColor: Colors.darkGreen,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontFamily: fontHeading,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: 'rgba(251,249,217,0.7)',
    marginBottom: 2,
  },
  address: {
    fontSize: 16.5,
    fontFamily: fontButton,
    color: Colors.white,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 10,
    height: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.terracotta,
  },
});

export default LocationSection;
