import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import {alert} from '../utils/alert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IconWrapper from '../components/IconWrapper';
import {useAuth} from '../contexts/AuthContext';
import {Colors, Radius} from '../utils/colors';
import {fontButton, fontDisplay, fontDisplayMedium, fontHeading, fontUI, secondaryFont} from '../utils/fonts';
import LanguageSwitcher from '../components/LanguageSwitcher';
import {getClientProfile, type ClientProfileRead} from '../services/clientProfile';
import {getMyOrders} from '../services/orders';
import {getAbsoluteImageUrl} from '../utils/api';

const ProfileScreen = ({navigation}: any) => {
  const {user, isAuthenticated, logout, isRestaurant} = useAuth();
  const [clientProfile, setClientProfile] = useState<ClientProfileRead | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [orderCount, setOrderCount] = useState<number | null>(null);

  const photoStorageKey = user?.id ? `profile_photo_${user.id}` : 'profile_photo_me';

  const profileImageSrc = (() => {
    const candidate =
      profilePhotoUrl ||
      (clientProfile as any)?.photo_url ||
      (clientProfile as any)?.image_url ||
      (clientProfile as any)?.avatar_url ||
      (clientProfile as any)?.banner_image_url ||
      '';
    const absolute = getAbsoluteImageUrl(candidate);
    return absolute || candidate || null;
  })();

  const loadClientProfile = useCallback(async (isRefresh = false) => {
    if (isRestaurant) return;
    if (isRefresh) setRefreshing(true);
    else setLoadingProfile(true);
    try {
      const data = await getClientProfile();
      setClientProfile(data ?? null);
    } finally {
      setLoadingProfile(false);
      setRefreshing(false);
    }
  }, [isRestaurant]);

  useEffect(() => {
    if (isAuthenticated && !isRestaurant) {
      loadClientProfile();
    }
  }, [isAuthenticated, isRestaurant, loadClientProfile]);

  useEffect(() => {
    if (!isAuthenticated || isRestaurant) {
      setOrderCount(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const orders = await getMyOrders();
        if (!cancelled) setOrderCount(orders.length);
      } catch {
        if (!cancelled) setOrderCount(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isRestaurant]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(photoStorageKey);
        if (!cancelled && stored) {
          setProfilePhotoUrl(stored);
        }
      } catch {
        // ignore storage errors
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [photoStorageKey]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const doc = (globalThis as any).document;
    if (!doc?.createElement) return;
    const input = doc.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    input.onchange = async (e: any) => {
      const target = e?.target;
      const file: File | undefined = target?.files?.[0];
      if (!file || !file.type?.startsWith('image/')) return;
      setUploadingPhoto(true);
      try {
        const toDataUrl = (blob: Blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('read_error'));
            reader.readAsDataURL(blob);
          });

        // Compression légère avant stockage pour éviter des payloads énormes.
        let dataUrl = '';
        try {
          const objectUrl = URL.createObjectURL(file);
          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new window.Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = objectUrl;
          });
          const maxDim = 800;
          const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
          const width = Math.max(1, Math.round(img.width * ratio));
          const height = Math.max(1, Math.round(img.height * ratio));
          const canvas = doc.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('no_ctx');
          ctx.drawImage(img, 0, 0, width, height);
          dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          URL.revokeObjectURL(objectUrl);
        } catch {
          dataUrl = await toDataUrl(file);
        }

        if (!dataUrl) throw new Error('empty_image');
        await AsyncStorage.setItem(photoStorageKey, dataUrl);
        setProfilePhotoUrl(dataUrl);
      } catch {
        alert('Erreur', 'Impossible de charger l’image sélectionnée.');
      } finally {
        setUploadingPhoto(false);
        if (target) target.value = '';
      }
    };
    doc.body.appendChild(input);
    (globalThis as any).__profilePhotoInput = input;
    return () => {
      try {
        doc.body.removeChild(input);
      } catch (_) {}
      (globalThis as any).__profilePhotoInput = null;
    };
  }, [photoStorageKey]);

  useEffect(() => {
    const unsubscribe = navigation.addListener?.('focus', () => {
      if (isAuthenticated && !isRestaurant) loadClientProfile();
    });
    return () => unsubscribe?.();
  }, [navigation, isAuthenticated, isRestaurant, loadClientProfile]);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const browserWindow = (globalThis as {window?: {confirm: (message?: string) => boolean}}).window;
      const ok = browserWindow
        ? browserWindow.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')
        : true;
      if (!ok) return;
      logout().catch(() => {
        alert('Erreur', 'Impossible de se déconnecter.');
      });
      return;
    }

    alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // L'écran Login s'affiche automatiquement quand user devient null
            } catch (e) {
              alert('Erreur', 'Impossible de se déconnecter.');
            }
          },
        },
      ],
    );
  };

  const handleOpenUpload = () => {
    if (Platform.OS === 'web') {
      const input = (globalThis as any).__profilePhotoInput as HTMLInputElement | null;
      input?.click();
      return;
    }
    alert(
      'Sélection image',
      'La sélection de fichier locale nécessite une librairie native. Je peux l’ajouter ensuite si vous voulez.',
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.unauthorizedContainer}>
          <View style={styles.iconContainer}>
            <IconWrapper name="lock-closed-outline" size={56} color={Colors.textLight} />
          </View>
          <Text style={styles.unauthorizedText}>
            Vous devez être connecté pour accéder à votre profil
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const roleLabel = isRestaurant
    ? 'Cuisinier'
    : orderCount != null
      ? `Cliente · ${orderCount} commande${orderCount > 1 ? 's' : ''}`
      : 'Cliente';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          !isRestaurant ? (
            <RefreshControl refreshing={refreshing} onRefresh={() => loadClientProfile(true)} colors={[Colors.primary]} />
          ) : undefined
        }>
        <Text style={styles.pageTitle}>Mon profil</Text>

        <View style={styles.profileCard}>
          {profileImageSrc ? (
            <Image source={{uri: profileImageSrc}} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <View style={styles.profileCardInfo}>
            <Text style={styles.name} numberOfLines={1}>{user?.name}</Text>
            <Text style={styles.email} numberOfLines={1}>{user?.email}</Text>
            <Text style={styles.role}>
              {uploadingPhoto ? 'Chargement de la photo…' : roleLabel}
            </Text>
          </View>
          <TouchableOpacity onPress={handleOpenUpload}>
            <Text style={styles.editLink}>Modifier</Text>
          </TouchableOpacity>
        </View>

        {!isRestaurant && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Commande</Text>
            <View style={styles.rowGroup}>
              <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.7}>
                <View style={[styles.rowIcon, {backgroundColor: Colors.category.orange.bg}]}>
                  <IconWrapper name="location-outline" size={17} color={Colors.category.orange.icon} />
                </View>
                <Text style={styles.rowLabel}>Mes adresses</Text>
                <Text style={styles.rowValue} numberOfLines={1}>
                  {loadingProfile ? '…' : clientProfile?.address ? '1 enregistrée' : 'Aucune'} ›
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Commandes</Text>
          <View style={styles.rowGroup}>
            <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('OrderHistory')} activeOpacity={0.7}>
              <View style={[styles.rowIcon, {backgroundColor: Colors.category.green.bg}]}>
                <IconWrapper name="receipt-outline" size={17} color={Colors.category.green.icon} />
              </View>
              <Text style={styles.rowLabel}>Mes commandes</Text>
              <IconWrapper name="chevron-forward-outline" size={18} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.rowDivider} />
            <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('OrderStats')} activeOpacity={0.7}>
              <View style={[styles.rowIcon, {backgroundColor: Colors.category.blue.bg}]}>
                <IconWrapper name="stats-chart-outline" size={17} color={Colors.category.blue.icon} />
              </View>
              <Text style={styles.rowLabel}>Stats commandes</Text>
              <IconWrapper name="chevron-forward-outline" size={18} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.rowDivider} />
            <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Favorites')} activeOpacity={0.7}>
              <View style={[styles.rowIcon, {backgroundColor: Colors.category.pink.bg}]}>
                <IconWrapper name="heart-outline" size={17} color={Colors.category.pink.icon} />
              </View>
              <Text style={styles.rowLabel}>Favoris</Text>
              <IconWrapper name="chevron-forward-outline" size={18} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.rowDivider} />
            <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('GroceryShops')} activeOpacity={0.7}>
              <View style={[styles.rowIcon, {backgroundColor: Colors.category.yellow.bg}]}>
                <IconWrapper name="basket-outline" size={17} color={Colors.category.yellow.icon} />
              </View>
              <Text style={styles.rowLabel}>Épicerie</Text>
              <IconWrapper name="chevron-forward-outline" size={18} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Réglages</Text>
          <View style={styles.rowGroup}>
            <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Settings')} activeOpacity={0.7}>
              <View style={[styles.rowIcon, {backgroundColor: Colors.category.purple.bg}]}>
                <IconWrapper name="settings-outline" size={17} color={Colors.category.purple.icon} />
              </View>
              <Text style={styles.rowLabel}>Paramètres</Text>
              <IconWrapper name="chevron-forward-outline" size={18} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.rowDivider} />
            <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Notifications')} activeOpacity={0.7}>
              <View style={[styles.rowIcon, {backgroundColor: Colors.category.red.bg}]}>
                <IconWrapper name="notifications-outline" size={17} color={Colors.category.red.icon} />
              </View>
              <Text style={styles.rowLabel}>Notifications</Text>
              <IconWrapper name="chevron-forward-outline" size={18} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.rowDivider} />
            <View style={styles.row}>
              <View style={[styles.rowIcon, {backgroundColor: Colors.category.darkGreenWhite.bg}]}>
                <IconWrapper name="language-outline" size={17} color={Colors.darkGreen} />
              </View>
              <Text style={styles.rowLabel}>Langue</Text>
              <LanguageSwitcher />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 22,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: fontDisplay,
    color: Colors.text,
    marginBottom: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 20,
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: Radius.pill,
    backgroundColor: Colors.category.orange.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 66,
    height: 66,
    borderRadius: Radius.pill,
  },
  avatarText: {
    fontSize: 26,
    fontFamily: fontDisplay,
    color: Colors.terracotta,
  },
  profileCardInfo: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  name: {
    fontSize: 19,
    fontFamily: fontDisplayMedium,
    color: Colors.text,
  },
  email: {
    fontSize: 12.5,
    fontFamily: fontUI,
    color: Colors.textLight,
  },
  role: {
    fontSize: 12,
    fontFamily: fontHeading,
    color: Colors.darkGreen,
  },
  editLink: {
    fontSize: 13,
    fontFamily: fontHeading,
    color: Colors.terracotta,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: fontHeading,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: 'rgba(5,16,4,0.58)',
    marginBottom: 8,
  },
  rowGroup: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(5,16,4,0.06)',
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 58,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: fontUI,
    color: Colors.text,
  },
  rowValue: {
    fontSize: 13,
    fontFamily: fontUI,
    color: 'rgba(5,16,4,0.56)',
  },
  rowDivider: {
    height: 1,
    marginLeft: 46,
    backgroundColor: 'rgba(5,16,4,0.08)',
  },
  logoutRow: {
    minHeight: 48,
    justifyContent: 'center',
    marginTop: 4,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: fontButton,
    color: Colors.terracotta,
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 110,
    height: 110,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  unauthorizedText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    fontFamily: secondaryFont,
  },
  loginButton: {
    backgroundColor: Colors.terracotta,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: Radius.pill,
  },
  loginButtonText: {
    color: Colors.namkeWhite,
    fontSize: 16,
    fontFamily: fontButton,
  },
});

export default ProfileScreen;
