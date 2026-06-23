import React, {useCallback, useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import IconWrapper from '../components/IconWrapper';
import {Colors} from '../utils/colors';
import {secondaryFont} from '../utils/fonts';
import {useSearch} from '../contexts/SearchContext';
import SearchBar, {type SearchSuggestion} from '../components/home/SearchBar';
import DishCard from '../components/home/DishCard';
import RestaurantCard from '../components/home/RestaurantCard';
import SectionHeader from '../components/home/SectionHeader';
import * as restaurantsApi from '../services/restaurants';
import * as dishesApi from '../services/dishes';

const SearchResultsScreen = ({navigation}: any) => {
  const {searchQuery, searchResults, setSearchResults, setSearchQuery, isSearching, setIsSearching} = useSearch();
  const [displayResults, setDisplayResults] = useState<{dishes: any[]; restaurants: any[]}>(() => ({
    dishes: [...searchResults.dishes],
    restaurants: [...searchResults.restaurants],
  }));
  const [refreshing, setRefreshing] = useState(false);
  const [liveSuggestions, setLiveSuggestions] = useState<SearchSuggestion[]>([]);
  const lastQueryRef = useRef(searchQuery);
  const hasRunInitialSearch = useRef(false);

  useEffect(() => {
    if (!isSearching) {
      setDisplayResults({
        dishes: [...searchResults.dishes],
        restaurants: [...searchResults.restaurants],
      });
      lastQueryRef.current = searchQuery;
    }
  }, [searchResults.dishes, searchResults.restaurants, searchQuery, isSearching]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setLiveSuggestions([]);
      return;
    }

    const dishSuggestions: SearchSuggestion[] = (displayResults.dishes || []).slice(0, 4).map(d => ({
      id: d.id,
      title: d.name,
      subtitle: d.restaurantName || undefined,
      type: 'dish',
      restaurantId: d.restaurantId,
    }));

    const restaurantSuggestions: SearchSuggestion[] = (displayResults.restaurants || [])
      .slice(0, 4)
      .map(r => ({
        id: r.id,
        title: r.name,
        subtitle: r.cuisine || undefined,
        type: 'restaurant',
      }));

    setLiveSuggestions([...dishSuggestions, ...restaurantSuggestions].slice(0, 7));
  }, [displayResults.dishes, displayResults.restaurants, searchQuery]);

  const runSearch = useCallback(
    async (query: string, isRefresh = false) => {
      if (query.length > 0) {
        setSearchQuery(query);
        if (!isRefresh) setIsSearching(true);
        try {
          const [dishesRes, restaurantsRes] = await Promise.all([
            dishesApi.searchDishes(query),
            restaurantsApi.searchRestaurants(query),
          ]);
          const next = {dishes: dishesRes, restaurants: restaurantsRes};
          setDisplayResults(next);
          setSearchResults(next);
        } catch (e) {
          const empty = {dishes: [], restaurants: []};
          setDisplayResults(empty);
          setSearchResults(empty);
        } finally {
          setIsSearching(false);
          setRefreshing(false);
        }
      } else {
        setSearchQuery('');
        const empty = {dishes: [], restaurants: []};
        setDisplayResults(empty);
        setSearchResults(empty);
      }
    },
    [setSearchResults, setSearchQuery, setIsSearching],
  );

  const handleSearch = useCallback(
    (query: string) => {
      runSearch(query, false);
    },
    [runSearch],
  );

  const onRefresh = useCallback(() => {
    const q = lastQueryRef.current || searchQuery;
    if (q.length > 0) {
      setRefreshing(true);
      runSearch(q, true);
    } else {
      setRefreshing(false);
    }
  }, [searchQuery, runSearch]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length > 0 && !hasRunInitialSearch.current) {
      hasRunInitialSearch.current = true;
      runSearch(q, false);
    }
  }, [searchQuery, runSearch]);

  const hasResults =
    displayResults.dishes.length > 0 || displayResults.restaurants.length > 0;
  const showEmpty = !isSearching && !hasResults;
  const showResults = !isSearching && hasResults;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SearchBar
        placeholder="Rechercher un plat ou restaurant..."
        onSearch={handleSearch}
        onLiveQueryChange={() => {}}
        suggestions={liveSuggestions}
        onSuggestionPress={(item) => {
          if (item.type === 'dish') {
            navigation.navigate('DishDetails', {
              dishId: item.id,
              restaurantId: item.restaurantId,
            });
            return;
          }
          navigation.navigate('RestaurantDetails', {
            restaurantId: item.id,
          });
        }}
        onPress={() => {}}
        autoFocus
        liveSearch
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={showEmpty ? styles.contentEmpty : undefined}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }>
        {showEmpty && searchQuery.length > 0 && (
          <View style={styles.emptyContainer}>
            <IconWrapper name="search-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyText}>
              Aucun résultat pour "{searchQuery}"
            </Text>
            <Text style={styles.emptySubtext}>
              Essayez avec d'autres mots-clés
            </Text>
          </View>
        )}
        {showEmpty && searchQuery.length === 0 && (
          <View style={styles.emptyContainer}>
            <IconWrapper name="search-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyText}>Recherchez un plat ou restaurant</Text>
          </View>
        )}
        {showResults && (
          <>
            {displayResults.dishes.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title={`Plats (${displayResults.dishes.length})`} />
                {displayResults.dishes.map(dish => (
                  <DishCard
                    key={dish.id}
                    {...dish}
                    onPress={() =>
                      navigation.navigate('DishDetails', {
                        dishId: dish.id,
                        restaurantId: (dish as any).restaurantId,
                      })
                    }
                    onFavoritePress={() => {}}
                    onAddPress={() => {}}
                  />
                ))}
              </View>
            )}
            {displayResults.restaurants.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title={`Restaurants (${displayResults.restaurants.length})`} />
                {displayResults.restaurants.map(restaurant => (
                  <RestaurantCard
                    key={restaurant.id}
                    {...restaurant}
                    onPress={() =>
                      navigation.navigate('RestaurantDetails', {
                        restaurantId: restaurant.id,
                      })
                    }
                  />
                ))}
              </View>
            )}
          </>
        )}
        {isSearching && (
          <View style={styles.loadingInlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Recherche en cours...</Text>
          </View>
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
  content: {
    flex: 1,
    padding: 16,
  },
  contentEmpty: {
    flexGrow: 1,
  },
  loadingInlay: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.text,
    marginTop: 16,
    fontWeight: '600',
    fontFamily: secondaryFont,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
    fontFamily: secondaryFont,
  },
  section: {
    marginBottom: 24,
  },
});

export default SearchResultsScreen;

