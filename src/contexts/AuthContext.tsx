import React, {createContext, useState, useEffect, useContext} from 'react';
import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {GoogleSignin as GoogleSigninType} from '@react-native-google-signin/google-signin';
import api, {registerOn401} from '../utils/api';
import {formatAxiosError} from '../utils/formatApiError';
import {GOOGLE_WEB_CLIENT_ID} from '../config/googleSignIn';
import notificationService from '../services/notificationService';

// @react-native-google-signin/google-signin n'a pas de variante web — chargé uniquement
// sur Android/iOS (le build web de cette app utilise react-native-web).
const GoogleSignin: typeof GoogleSigninType | null =
  Platform.OS !== 'web' ? require('@react-native-google-signin/google-signin').GoogleSignin : null;

if (GoogleSignin) {
  GoogleSignin.configure({webClientId: GOOGLE_WEB_CLIENT_ID});
}

interface User {
  id: number;
  email: string;
  name?: string;
  profile_type?: 'client' | 'restaurant';
  is_restaurant?: boolean;
  restaurant_id?: number;
}

export type SignupType = 'client' | 'restaurant';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  signupClient: (email: string, password: string, first_name: string, last_name: string, phone?: string, address?: string) => Promise<void>;
  signupRestaurant: (email: string, password: string, name: string, address: string, phone: string, city: string, description?: string, cuisine_type?: string) => Promise<void>;
  logout: () => Promise<void>;
  isRestaurant: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Profil restaurateur → modèle User minimal pour l’app */
function mapRestaurantMeToUser(r: Record<string, unknown>): User {
  return {
    id: (typeof r.user_id === 'number' ? r.user_id : r.id) as number,
    email: String(r.email ?? ''),
    name: typeof r.name === 'string' ? r.name : undefined,
    profile_type: 'restaurant',
    is_restaurant: true,
    restaurant_id: typeof r.id === 'number' ? r.id : undefined,
  };
}

/**
 * Connexion alignée sur l’API FastAPI :
 * - Clients : POST /users/login (OAuth2 form : username, password)
 * - Restaurateurs : POST /restaurants/login (JSON email, password) si le premier renvoie 401
 * Les routes /auth/token et /token n’existent pas sur ce backend.
 */
async function loginWithPassword(
  email: string,
  password: string,
): Promise<{access_token: string; token_type?: string; account: 'user' | 'restaurant'}> {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  try {
    const response = await api.post('/users/login', formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return {...response.data, account: 'user' as const};
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 401) {
      const r2 = await api.post('/restaurants/login', {email, password});
      return {...r2.data, account: 'restaurant' as const};
    }
    throw err;
  }
}

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  // Déconnecter l'UI quand l'API renvoie 401 (token expiré ou invalide)
  useEffect(() => {
    const unregister = registerOn401(() => setUser(null));
    return unregister;
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const userData = await AsyncStorage.getItem('user_data');

      if (!token || !userData) {
        setIsLoading(false);
        return;
      }

      try {
        const {data} = await api.get('/users/me');
        setUser(data as User);
        await AsyncStorage.setItem('user_data', JSON.stringify(data));
      } catch (userMeErr: any) {
        const st = userMeErr?.response?.status;
        if (st === 401 || st === 403) {
          try {
            const {data} = await api.get('/restaurants/me');
            const mapped = mapRestaurantMeToUser(data as Record<string, unknown>);
            setUser(mapped);
            await AsyncStorage.setItem('user_data', JSON.stringify(mapped));
          } catch {
            await AsyncStorage.removeItem('access_token');
            await AsyncStorage.removeItem('user_data');
            setUser(null);
          }
        } else {
          await AsyncStorage.removeItem('access_token');
          await AsyncStorage.removeItem('user_data');
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login with:', { email, passwordLength: password.length });
      const loginData = await loginWithPassword(email, password);
      const {access_token, account} = loginData;

      if (!access_token) {
        throw new Error('Token non reçu dans la réponse');
      }

      await AsyncStorage.setItem('access_token', access_token);

      let userData: User;
      if (account === 'restaurant') {
        const {data} = await api.get('/restaurants/me');
        userData = mapRestaurantMeToUser(data as Record<string, unknown>);
      } else {
        const {data} = await api.get('/users/me');
        userData = data as User;
      }

      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      setUser(userData);
      notificationService.registerDeviceToken().catch(() => {});
    } catch (error: any) {
      console.error('Login error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      throw new Error(
        formatAxiosError(error, 'Erreur lors de la connexion'),
      );
    }
  };

  /**
   * Connexion via Google (client ET restaurateur — même endpoint backend que
   * loginWithPassword, le profil est résolu ensuite comme pour un login classique).
   */
  const loginWithGoogle = async () => {
    if (!GoogleSignin) {
      throw new Error('La connexion Google n\'est pas disponible sur cette plateforme');
    }
    try {
      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
      const result = await GoogleSignin.signIn();
      const idToken =
        (result as any)?.data?.idToken ?? (result as any)?.idToken;
      if (!idToken) {
        throw new Error('Aucun token Google reçu');
      }

      const {data} = await api.post('/users/login/google', {id_token: idToken});
      const {access_token} = data;
      if (!access_token) {
        throw new Error('Token non reçu dans la réponse');
      }

      await AsyncStorage.setItem('access_token', access_token);

      let userData: User;
      try {
        const {data: me} = await api.get('/users/me');
        userData = me as User;
      } catch (err: any) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          const {data: me} = await api.get('/restaurants/me');
          userData = mapRestaurantMeToUser(me as Record<string, unknown>);
        } else {
          throw err;
        }
      }

      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      setUser(userData);
      notificationService.registerDeviceToken().catch(() => {});
    } catch (error: any) {
      throw new Error(
        formatAxiosError(error, 'Erreur lors de la connexion avec Google'),
      );
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        name,
      });
      const {access_token, user: userData} = response.data;

      await AsyncStorage.setItem('access_token', access_token);
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));

      setUser(userData);
    } catch (error: any) {
      throw new Error(
        formatAxiosError(error, 'Erreur lors de l\'inscription'),
      );
    }
  };

  const signupClient = async (
    email: string,
    password: string,
    first_name: string,
    last_name: string,
    phone?: string,
    address?: string,
  ) => {
    try {
      await api.post('/users/create/client', {
        email,
        password,
        profile_type: 'client',
        first_name,
        last_name,
        phone: phone || null,
        address: address || null,
      });
      await login(email, password);
    } catch (error: any) {
      throw new Error(
        formatAxiosError(error, 'Erreur lors de l\'inscription client'),
      );
    }
  };

  const signupRestaurant = async (
    email: string,
    password: string,
    name: string,
    address: string,
    phone: string,
    city: string,
    description?: string,
    cuisine_type?: string,
  ) => {
    try {
      await api.post('/users/create/restaurant', {
        email,
        password,
        profile_type: 'restaurant',
        name,
        address,
        phone,
        city,
        description: description || null,
        cuisine_type: cuisine_type || null,
      });
      await login(email, password);
    } catch (error: any) {
      throw new Error(
        formatAxiosError(error, 'Erreur lors de l\'inscription restaurateur'),
      );
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('user_data');
    } catch (e) {
      console.warn('Logout: erreur lors de la suppression du stockage', e);
    }
    setUser(null);
  };

  const isRestaurant =
    user?.profile_type === 'restaurant' ||
    user?.is_restaurant === true ||
    !!user?.restaurant_id;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        signup,
        signupClient,
        signupRestaurant,
        logout,
        isRestaurant,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

