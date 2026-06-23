import React, {createContext, useState, useContext, useCallback, useEffect, ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {RestaurantForList} from '../services/restaurants';
import * as favoritesApi from '../services/favorites';

const FAVORITES_KEY = '@afrodine_favorites';

interface FavoritesContextType {
  favorites: RestaurantForList[];
  loading: boolean;
  addFavorite: (restaurant: RestaurantForList) => Promise<void>;
  removeFavorite: (restaurantId: string) => Promise<void>;
  isFavorite: (restaurantId: string) => boolean;
  toggleFavorite: (restaurant: RestaurantForList) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [favorites, setFavorites] = useState<RestaurantForList[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadFromApi = useCallback(async () => {
    try {
      const list = await favoritesApi.getFavorites();
      setFavorites(list);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
    } catch (e: any) {
      if (e.response?.status === 401 || e.response?.status === 403) {
        try {
          const raw = await AsyncStorage.getItem(FAVORITES_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            setFavorites(Array.isArray(parsed) ? parsed : []);
          }
        } catch (_) {}
      }
    }
  }, []);

  const refreshFavorites = useCallback(async () => {
    setLoading(true);
    try {
      await loadFromApi();
    } finally {
      setLoading(false);
    }
  }, [loadFromApi]);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        try {
          const raw = await AsyncStorage.getItem(FAVORITES_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            setFavorites(Array.isArray(parsed) ? parsed : []);
          }
        } catch (_) {}
        setLoaded(true);
        return;
      }
      try {
        await loadFromApi();
      } catch (_) {
        try {
          const raw = await AsyncStorage.getItem(FAVORITES_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            setFavorites(Array.isArray(parsed) ? parsed : []);
          }
        } catch (_) {}
      }
      setLoaded(true);
    })();
  }, [loadFromApi]);

  const addFavorite = useCallback(async (restaurant: RestaurantForList) => {
    try {
      const already = await favoritesApi.checkRestaurantFavorite(restaurant.id);
      if (already) return;
      await favoritesApi.toggleRestaurantFavorite(restaurant.id);
      await loadFromApi();
    } catch (e: any) {
      if (e.response?.status === 401 || e.response?.status === 403) {
        setFavorites(prev => {
          if (prev.some(r => r.id === restaurant.id)) return prev;
          const next = [...prev, restaurant];
          AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next)).catch(() => {});
          return next;
        });
      } else {
        await loadFromApi();
      }
    }
  }, [loadFromApi]);

  const removeFavorite = useCallback(async (restaurantId: string) => {
    try {
      const isFav = await favoritesApi.checkRestaurantFavorite(restaurantId);
      if (!isFav) {
        await loadFromApi();
        return;
      }
      await favoritesApi.toggleRestaurantFavorite(restaurantId);
      await loadFromApi();
    } catch (e: any) {
      if (e.response?.status === 401 || e.response?.status === 403) {
        setFavorites(prev => {
          const next = prev.filter(r => r.id !== restaurantId);
          AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next)).catch(() => {});
          return next;
        });
      } else {
        await loadFromApi();
      }
    }
  }, [loadFromApi]);

  const isFavorite = useCallback(
    (restaurantId: string) => favorites.some(r => r.id === restaurantId),
    [favorites],
  );

  const toggleFavorite = useCallback(
    async (restaurant: RestaurantForList) => {
      const exists = favorites.some(r => r.id === restaurant.id);
      if (exists) {
        await removeFavorite(restaurant.id);
      } else {
        await addFavorite(restaurant);
      }
    },
    [favorites, addFavorite, removeFavorite],
  );

  const value: FavoritesContextType = {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    refreshFavorites,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export function useFavorites(): FavoritesContextType {
  const ctx = useContext(FavoritesContext);
  if (ctx === undefined) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return ctx;
}
