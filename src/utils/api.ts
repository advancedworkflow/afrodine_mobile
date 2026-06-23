import axios from 'axios';
import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL du backend : REACT_APP_API_URL (webpack/babel) — pas de slash final (évite //users/login → 404)
const DEFAULT_API_URL = 'http://127.0.0.1:8000';
const envApiUrl =
  typeof process !== 'undefined' && process.env?.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.trim().replace(/\/+$/, '')
    : '';

const isWebDev = __DEV__ && Platform.OS === 'web';

// Base URL de l'API en dev :
// - Web : backend direct
// - Android émulateur : 10.0.2.2 = localhost de la machine hôte
// - iOS simulateur : 127.0.0.1 / localhost
// - Appareil physique : définir REACT_APP_API_URL=http://<IP_LAN>:8000
const getDevBaseUrl = () => {
  if (envApiUrl) return envApiUrl;
  if (isWebDev) return DEFAULT_API_URL;
  return Platform.OS === 'android' ? `http://10.0.2.2:8000` : DEFAULT_API_URL;
};

const API_BASE_URL = (__DEV__ ? getDevBaseUrl() : 'https://api.afrodine.com').replace(
  /\/+$/,
  '',
);

if (__DEV__) {
  console.log('[API] Base URL:', API_BASE_URL, envApiUrl ? '(surchargée par REACT_APP_API_URL)' : '');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: __DEV__ ? 30000 : 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

function isPublicAuthPath(url: string | undefined): boolean {
  if (!url) return false;
  const path = url.split('?')[0];
  return (
    path.includes('/restaurants/public/') ||
    path.includes('/restaurants/filters/options') ||
    path.endsWith('/restaurants/') ||
    path.endsWith('/restaurants/nearby') ||
    path.endsWith('/restaurants/search') ||
    path.endsWith('/orders/guest') ||
    path.endsWith('/login') ||
    path.includes('/users/create') ||
    path.includes('/register') ||
    path.includes('/forgot-password') ||
    path.includes('/reset-password') ||
    path.includes('/auth/forgot-password') ||
    path.includes('/auth/reset-password')
  );
}

// Intercepteur : token sauf sur login / inscription (évite Bearer obsolète sur POST /users/login)
api.interceptors.request.use(
  async config => {
    if (isPublicAuthPath(config.url)) {
      delete config.headers.Authorization;
      return config;
    }
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Callbacks appelés sur 401 (session expirée / non authentifié) pour déconnecter l'UI
const on401Callbacks: Array<() => void> = [];
export function registerOn401(callback: () => void): () => void {
  on401Callbacks.push(callback);
  return () => {
    const i = on401Callbacks.indexOf(callback);
    if (i !== -1) on401Callbacks.splice(i, 1);
  };
}

// Intercepteur pour gérer les erreurs et logger les échecs
api.interceptors.response.use(
  response => response,
  async error => {
    const method = error.config?.method?.toUpperCase() ?? '?';
    const url = error.config?.url ?? error.config?.baseURL ?? '?';
    const fullUrl = error.config?.baseURL ? `${error.config.baseURL}${url}` : url;
    const status = error.response?.status;
    const statusText = error.response?.statusText;
    const data = error.response?.data;
    const isCanceled = error.code === 'ERR_CANCELED';

    const silentError = (error.config as any)?.silentError === true;

    if (isCanceled) {
      console.warn('[API] Requête annulée:', method, fullUrl);
    } else if (!silentError) {
      console.error('[API] Échec:', method, fullUrl, {
        status,
        statusText,
        message: error.message,
        ...(data && Object.keys(data).length > 0 ? { response: data } : {}),
      });
    }

    // Ne pas vider la session sur 401 des tentatives de connexion (sinon bruit + effets de bord)
    if (error.response?.status === 401 && !isPublicAuthPath(error.config?.url)) {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('user_data');
      on401Callbacks.forEach(cb => cb());
    }
    return Promise.reject(error);
  },
);

export default api;
export {API_BASE_URL};

/** Retourne une URL d'image absolue (pour éviter que les chemins relatifs ne chargent pas). */
export function getAbsoluteImageUrl(url: string | null | undefined): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = API_BASE_URL.replace(/\/$/, '');
  return trimmed.startsWith('/') ? `${base}${trimmed}` : `${base}/${trimmed}`;
}

/** Fallback auto: convertit une URL WebP en JPEG si possible. */
export function getJpegFallbackUrl(url: string | null | undefined): string | undefined {
  const absolute = getAbsoluteImageUrl(url);
  if (!absolute) return undefined;
  if (/\.webp(\?.*)?$/i.test(absolute)) {
    return absolute.replace(/\.webp(\?.*)?$/i, '.jpg$1');
  }
  return undefined;
}

export function getImageVariantUrl(
  url: string | null | undefined,
  variant: 'thumbnail' | 'small' | 'medium' | 'large' | 'original' = 'original',
  format: 'webp' | 'jpg' = 'webp',
): string | undefined {
  const absolute = getAbsoluteImageUrl(url);
  if (!absolute) return undefined;
  if (!/_original\.(webp|jpg|jpeg)(\?.*)?$/i.test(absolute)) return absolute;
  return absolute.replace(/_original\.(webp|jpg|jpeg)(\?.*)?$/i, `_${variant}.${format}$2`);
}