import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import IconWrapper from '../components/IconWrapper';
import RestaurantCard from '../components/home/RestaurantCard';
import {Colors} from '../utils/colors';
import {secondaryFont} from '../utils/fonts';
import {useFavorites} from '../contexts/FavoritesContext';

const FavoritesScreen = ({navigation}: any) => {
  const {favorites, removeFavorite, loading, refreshFavorites} = useFavorites();
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshFavorites();
    setRefreshing(false);
  }, [refreshFavorites]);

  return (
    <View style={styles.container}>
      {loading && favorites.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconWrapper name="heart-outline" size={80} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>Aucun favori</Text>
          <Text style={styles.emptyText}>
            Ajoutez des restaurants à vos favoris depuis leur fiche pour les retrouver ici.
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Restaurants')}>
            <Text style={styles.browseButtonText}>Parcourir les restaurants</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }>
          {favorites.map(restaurant => (
            <View key={restaurant.id} style={styles.cardWrapper}>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFavorite(restaurant.id)}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <IconWrapper name="heart" size={24} color={Colors.error} />
              </TouchableOpacity>
              <RestaurantCard
                id={restaurant.id}
                name={restaurant.name}
                cuisine={restaurant.cuisine}
                priceRange={restaurant.priceRange}
                rating={restaurant.rating}
                deliveryTime={restaurant.deliveryTime}
                deliveryFee={restaurant.deliveryFee}
                imageUrl={restaurant.imageUrl}
                restaurantImageUrl={restaurant.restaurantImageUrl}
                onPress={() =>
                  navigation.navigate('RestaurantDetails', {
                    restaurantId: restaurant.id,
                    restaurantName: restaurant.name,
                  })
                }
              />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    paddingBottom: 24,
  },
  cardWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 24,
    marginBottom: 8,
    fontFamily: secondaryFont,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    fontFamily: secondaryFont,
  },
  browseButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  browseButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: secondaryFont,
  },
});

export default FavoritesScreen;
