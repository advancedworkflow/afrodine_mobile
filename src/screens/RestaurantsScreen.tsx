import React, {useState, useEffect, useCallback, useRef} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl} from 'react-native';
import TopBar from '../components/TopBar';
import FilterModal, {type FilterOptions, type SelectedFilters} from '../components/FilterModal';
import {Colors} from '../utils/colors';
import RestaurantCard from '../components/home/RestaurantCard';
import SearchBar from '../components/home/SearchBar';
import {useSearch} from '../contexts/SearchContext';
import * as restaurantsApi from '../services/restaurants';
import {formatAxiosError} from '../utils/formatApiError';

const defaultFilterOptions: FilterOptions = {
  cities: [],
  cuisine_types: [],
  diet_types: [],
  price_ranges: [],
  delivery_ranges: [],
  rating_options: [],
};

const RestaurantsScreen = ({navigation, route}: any) => {
  const {setSearchQuery, setSearchResults, setIsSearching} = useSearch();
  const initialCategory = route.params?.categoryName ?? route.params?.category ?? null;
  const initialFilters = route.params?.initialFilters as SelectedFilters | undefined;
  const [restaurants, setRestaurants] = useState<restaurantsApi.RestaurantForList[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(defaultFilterOptions);
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>(initialFilters ?? {});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const lastLoadedFiltersKeyRef = useRef<string>('');
  const restaurantSearchCacheRef = useRef<Map<string, restaurantsApi.RestaurantForList[]>>(new Map());

  useEffect(() => {
    if (initialFilters != null && Object.keys(initialFilters).length > 0) {
      setSelectedFilters(initialFilters);
    } else if (initialCategory != null) {
      setSelectedFilters(prev => ({...prev, cuisine_type: initialCategory}));
    }
  }, [initialCategory, initialFilters]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const options = await restaurantsApi.getFilterOptions();
        if (!cancelled) setFilterOptions(options);
      } catch (_) {
        if (!cancelled) setFilterOptions(defaultFilterOptions);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadRestaurants = useCallback(
    async (isRefresh = false, filters?: SelectedFilters, getIsCancelled?: () => boolean) => {
      const f = filters ?? selectedFilters;
      const filtersKey = JSON.stringify(f || {});
      if (!isRefresh && filtersKey === lastLoadedFiltersKeyRef.current && restaurants.length > 0) {
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const list = await restaurantsApi.getRestaurants({
          limit: 50,
          city: f.city,
          cuisine_type: f.cuisine_type,
          min_rating: f.min_rating,
          max_delivery_fee: f.max_delivery_fee,
        });
        if (getIsCancelled?.()) return;
        lastLoadedFiltersKeyRef.current = filtersKey;
        setRestaurants(list);
      } catch (e: any) {
        if (getIsCancelled?.()) return;
        setError(formatAxiosError(e, 'Erreur de chargement'));
        setRestaurants([]);
      } finally {
        if (!getIsCancelled?.()) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [selectedFilters, restaurants.length],
  );

  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    const initialFiltersToUse =
      initialFilters != null && Object.keys(initialFilters).length > 0
        ? initialFilters
        : initialCategory != null
          ? {cuisine_type: initialCategory}
          : selectedFilters;
    let cancelled = false;
    loadRestaurants(false, initialFiltersToUse, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [initialCategory, initialFilters, loadRestaurants]);

  const handleSearch = async (query: string) => {
    const q = query.trim();
    if (q.length > 0) {
      setSearchQuery(q);
      const normalizedQuery = q.toLowerCase();
      const cached = restaurantSearchCacheRef.current.get(normalizedQuery);
      if (cached) {
        setRestaurants(cached);
        setSearchResults({dishes: [], restaurants: cached});
        if (q.length > 2) {
          navigation.navigate('SearchResults');
        }
        return;
      }
      setIsSearching(true);
      try {
        const list = await restaurantsApi.searchRestaurants(q);
        restaurantSearchCacheRef.current.set(normalizedQuery, list);
        if (restaurantSearchCacheRef.current.size > 20) {
          const firstKey = restaurantSearchCacheRef.current.keys().next().value;
          if (firstKey) restaurantSearchCacheRef.current.delete(firstKey);
        }
        setRestaurants(list);
        setSearchResults({dishes: [], restaurants: list});
        if (q.length > 2) {
          navigation.navigate('SearchResults');
        }
      } catch (e) {
        setSearchResults({dishes: [], restaurants: []});
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchQuery('');
      loadRestaurants(false, selectedFilters);
    }
  };

  const onFilterChange = useCallback((partial: Partial<SelectedFilters>) => {
    setSelectedFilters(prev => ({...prev, ...partial}));
  }, []);

  const onApplyFilters = useCallback(() => {
    setFilterModalVisible(false);
    loadRestaurants(false, selectedFilters);
  }, [selectedFilters, loadRestaurants]);

  const onResetFilters = useCallback(() => {
    setSelectedFilters({});
  }, []);

  return (
    <View style={styles.container}>
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={onApplyFilters}
        onReset={onResetFilters}
        filterOptions={filterOptions}
        selectedFilters={selectedFilters}
        onFilterChange={onFilterChange}
      />
      <TopBar navigation={navigation} title="Restaurants" />
      <SearchBar
        placeholder="Rechercher un restaurant..."
        onSearch={handleSearch}
        onPress={() => navigation.navigate('SearchResults')}
        onFilterPress={() => setFilterModalVisible(true)}
      />
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadRestaurants(true, selectedFilters)}
            colors={[Colors.primary]}
          />
        }
        keyboardShouldPersistTaps="handled">
        <View style={styles.restaurantsList}>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorWrap}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => loadRestaurants()}>
                <Text style={styles.retryText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : restaurants.length === 0 ? (
            <Text style={styles.emptyText}>Aucun restaurant</Text>
          ) : (
            restaurants.map(restaurant => (
              <RestaurantCard
                key={restaurant.id}
                {...restaurant}
                onPress={() => navigation.navigate('RestaurantDetails', {restaurantId: restaurant.id})}
              />
            ))
          )}
        </View>
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
  },
  restaurantsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  loadingWrap: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textLight,
  },
  errorWrap: {
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  retryText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
});

export default RestaurantsScreen;
