import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import DishCard from '../components/home/DishCard';
import SearchBar from '../components/home/SearchBar';
import {Colors} from '../utils/colors';
import {useSearch} from '../contexts/SearchContext';
import * as dishesApi from '../services/dishes';
import * as restaurantsApi from '../services/restaurants';
import {formatAxiosError} from '../utils/formatApiError';

const SUGGESTED_LIMIT = 15;

const PopularDishesScreen = ({navigation}: any) => {
  const {setSearchResults, setIsSearching} = useSearch();
  const [dishes, setDishes] = useState<dishesApi.DishForList[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDishes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const list = await dishesApi.getDishes({limit: SUGGESTED_LIMIT});
      setDishes(list);
    } catch (e: any) {
      setError(formatAxiosError(e, 'Erreur de chargement'));
      setDishes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDishes();
  }, [loadDishes]);

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SearchBar
        placeholder="Rechercher un plat ou restaurant..."
        onSearch={async query => {
          if (query.length > 0) {
            setIsSearching(true);
            try {
              const [dishesRes, restaurantsRes] = await Promise.all([
                dishesApi.searchDishes(query),
                restaurantsApi.searchRestaurants(query),
              ]);
              setSearchResults({dishes: dishesRes, restaurants: restaurantsRes});
              navigation.navigate('SearchResults');
            } catch (e) {
              setSearchResults({dishes: [], restaurants: []});
            } finally {
              setIsSearching(false);
            }
          }
        }}
        onPress={() => navigation.navigate('SearchResults')}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDishes(true)}
            colors={[Colors.primary]}
          />
        }>
      {error ? (
        <View style={styles.errorBlock}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : dishes.length === 0 ? (
        <Text style={styles.emptyText}>Aucun plat en suggestion pour le moment</Text>
      ) : (
        dishes.map(dish => (
          <DishCard
            key={dish.id}
            {...dish}
            onPress={() =>
              navigation.navigate('DishDetails', {
                dishId: dish.id,
                restaurantId: dish.restaurantId,
              })
            }
            onFavoritePress={() => {}}
            onAddPress={() => {}}
          />
        ))
      )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textLight,
  },
  errorBlock: {
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 24,
  },
});

export default PopularDishesScreen;
