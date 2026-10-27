import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Linking, Platform} from 'react-native';
import {useTranslation} from 'react-i18next';
import IconWrapper from './IconWrapper';
import {Colors} from '../utils/colors';
import {mergeAddressLines} from '../utils/address';

// react-native-webview n'a pas de variante web — chargé uniquement sur Android/iOS
// (le build web de cette app utilise react-native-web et ne peut pas le résoudre).
const WebView = Platform.OS !== 'web' ? require('react-native-webview').WebView : null;

interface RestaurantMapProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
}

const RestaurantMap: React.FC<RestaurantMapProps> = ({latitude, longitude, address, city}) => {
  const {t} = useTranslation();
  const lat = latitude != null ? Number(latitude) : null;
  const lng = longitude != null ? Number(longitude) : null;
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  const fullAddress = mergeAddressLines(address, city);
  const directionsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  // Vue Google Maps privilégiée sur mobile (le web garde OpenStreetMap, cf. RestaurantLocation.jsx).
  // URL "output=embed" sans clé API — fonctionne dans une simple WebView.
  const mapEmbedUrl = hasCoords
    ? `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`
    : null;

  return (
    <View style={styles.container}>
      {hasCoords && WebView ? (
        <View style={styles.mapWrapper}>
          <WebView source={{uri: mapEmbedUrl!}} style={styles.map} />
        </View>
      ) : (
        <View style={styles.mapFallback}>
          <IconWrapper name="location-outline" size={32} color={Colors.textLight} />
          <Text style={styles.mapFallbackText}>
            {hasCoords ? t('restaurantMap.unavailableOnPlatform') : t('restaurantMap.unavailable')}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.directionsButton} onPress={() => Linking.openURL(directionsUrl)}>
        <IconWrapper name="navigate-outline" size={18} color={Colors.white} />
        <Text style={styles.directionsButtonText}>{t('restaurantMap.directions')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  mapWrapper: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  map: {
    flex: 1,
  },
  mapFallback: {
    height: 160,
    borderRadius: 12,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapFallbackText: {
    marginTop: 8,
    color: Colors.textLight,
    fontSize: 15,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    height: 44,
    marginTop: 12,
  },
  directionsButtonText: {
    color: Colors.white,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default RestaurantMap;
