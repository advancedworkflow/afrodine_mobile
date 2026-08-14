import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Linking, Platform} from 'react-native';
import IconWrapper from './IconWrapper';
import {Colors} from '../utils/colors';

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
  const lat = latitude != null ? Number(latitude) : null;
  const lng = longitude != null ? Number(longitude) : null;
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  const fullAddress = [address, city].filter(Boolean).join(', ');
  const directionsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  // Même formule que le web (RestaurantLocation.jsx) : bbox ~1km autour du point
  const delta = 0.01;
  const osmEmbedUrl = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng! - delta}%2C${lat! - delta}%2C${lng! + delta}%2C${lat! + delta}&layer=mapnik&marker=${lat}%2C${lng}`
    : null;

  return (
    <View style={styles.container}>
      {hasCoords && WebView ? (
        <View style={styles.mapWrapper}>
          <WebView source={{uri: osmEmbedUrl!}} style={styles.map} />
        </View>
      ) : (
        <View style={styles.mapFallback}>
          <IconWrapper name="location-outline" size={32} color={Colors.textLight} />
          <Text style={styles.mapFallbackText}>
            {hasCoords ? 'Carte indisponible sur cette plateforme' : "Carte non disponible"}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.directionsButton} onPress={() => Linking.openURL(directionsUrl)}>
        <IconWrapper name="navigate-outline" size={18} color={Colors.white} />
        <Text style={styles.directionsButtonText}>Itinéraire</Text>
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
    fontSize: 14,
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
