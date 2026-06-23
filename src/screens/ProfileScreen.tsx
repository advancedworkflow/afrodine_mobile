import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IconWrapper from '../components/IconWrapper';
import {useAuth} from '../contexts/AuthContext';
import {Colors} from '../utils/colors';
import {secondaryFont} from '../utils/fonts';
import TopBar from '../components/TopBar';
import {getClientProfile, type ClientProfileRead} from '../services/clientProfile';
import {getAbsoluteImageUrl} from '../utils/api';

const ProfileScreen = ({navigation}: any) => {
  const {user, isAuthenticated, logout, isRestaurant} = useAuth();
  const [clientProfile, setClientProfile] = useState<ClientProfileRead | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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
            const image = new Image();
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
        Alert.alert('Erreur', 'Impossible de charger l’image sélectionnée.');
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
        Alert.alert('Erreur', 'Impossible de se déconnecter.');
      });
      return;
    }

    Alert.alert(
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
              Alert.alert('Erreur', 'Impossible de se déconnecter.');
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
    Alert.alert(
      'Sélection image',
      'La sélection de fichier locale nécessite une librairie native. Je peux l’ajouter ensuite si vous voulez.',
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <TopBar navigation={navigation} title="Profil" />
        <View style={styles.unauthorizedContainer}>
          <View style={styles.iconContainer}>
            <IconWrapper name="lock-closed-outline" size={64} color={Colors.textLight} />
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

  return (
    <View style={styles.container}>
      <TopBar
        navigation={navigation}
        title="Profil"
      />
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          !isRestaurant ? (
            <RefreshControl refreshing={refreshing} onRefresh={() => loadClientProfile(true)} colors={[Colors.primary]} />
          ) : undefined
        }>
        <View style={styles.profileHeader}>
          {profileImageSrc ? (
            <Image source={{uri: profileImageSrc}} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.uploadPhotoButton} onPress={handleOpenUpload}>
            <IconWrapper
              name="cloud-upload-outline"
              size={18}
              color={Colors.white}
              style={styles.uploadPhotoIcon}
            />
            <Text style={styles.uploadPhotoText}>
              {uploadingPhoto ? 'Chargement...' : 'Upload photo'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {!isRestaurant && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profil & adresse</Text>
            <View style={styles.profileCard}>
              {loadingProfile ? (
                <View style={styles.profileLoading}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.profileLoadingText}>Chargement du profil…</Text>
                </View>
              ) : clientProfile ? (
                <>
                  <View style={styles.infoRow}>
                    <IconWrapper name="person-outline" size={20} color={Colors.primary} style={styles.infoIcon} />
                    <Text style={styles.infoLabel}>Nom</Text>
                    <Text style={styles.infoValue} numberOfLines={2}>
                      {[clientProfile.first_name, clientProfile.last_name].filter(Boolean).join(' ') || '—'}
                    </Text>
                  </View>
                  {clientProfile.phone ? (
                    <View style={styles.infoRow}>
                      <IconWrapper name="call-outline" size={20} color={Colors.primary} style={styles.infoIcon} />
                      <Text style={styles.infoLabel}>Tél.</Text>
                      <Text style={styles.infoValue}>{clientProfile.phone}</Text>
                    </View>
                  ) : null}
                  <View style={styles.infoRow}>
                    <IconWrapper name="location-outline" size={20} color={Colors.primary} style={styles.infoIcon} />
                    <Text style={styles.infoLabel}>Adresse</Text>
                    <Text style={styles.infoValue} numberOfLines={4}>
                      {clientProfile.address?.trim() || 'Aucune adresse renseignée'}
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={styles.profileHint}>
                  Complétez votre profil et votre adresse de livraison pour un checkout plus rapide.
                </Text>
              )}
              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={() => navigation.navigate('EditProfile')}
                activeOpacity={0.85}>
                <IconWrapper name="create-outline" size={20} color={Colors.white} style={styles.editProfileIcon} />
                <Text style={styles.editProfileButtonText}>Modifier le profil et l’adresse</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mon compte</Text>
          <View style={styles.menu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('Settings')}>
              <View style={styles.menuItemLeft}>
                <IconWrapper name="settings-outline" size={24} color={Colors.primary} style={styles.menuItemIcon} />
                <Text style={styles.menuItemText}>Paramètres</Text>
              </View>
              <IconWrapper name="chevron-forward-outline" size={20} color={Colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('Notifications')}>
              <View style={styles.menuItemLeft}>
                <IconWrapper name="notifications-outline" size={24} color={Colors.primary} />
                <Text style={styles.menuItemText}>Notifications</Text>
              </View>
              <IconWrapper name="chevron-forward-outline" size={20} color={Colors.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Commandes</Text>
          <View style={styles.menu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('OrderHistory')}>
              <View style={styles.menuItemLeft}>
                <IconWrapper name="receipt-outline" size={24} color={Colors.primary} style={styles.menuItemIcon} />
                <Text style={styles.menuItemText}>Mes commandes</Text>
              </View>
              <IconWrapper name="chevron-forward-outline" size={20} color={Colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('OrderStats')}>
              <View style={styles.menuItemLeft}>
                <IconWrapper name="stats-chart-outline" size={24} color={Colors.primary} style={styles.menuItemIcon} />
                <Text style={styles.menuItemText}>Stats commandes</Text>
              </View>
              <IconWrapper name="chevron-forward-outline" size={20} color={Colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('Favorites')}>
              <View style={styles.menuItemLeft}>
                <IconWrapper name="heart-outline" size={24} color={Colors.primary} style={styles.menuItemIcon} />
                <Text style={styles.menuItemText}>Favoris</Text>
              </View>
              <IconWrapper name="chevron-forward-outline" size={20} color={Colors.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <IconWrapper name="log-out-outline" size={20} color={Colors.error} style={styles.logoutIcon} />
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </TouchableOpacity>
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
  profileHeader: {
    backgroundColor: Colors.white,
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: secondaryFont,
  },
  uploadPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  uploadPhotoIcon: {
    marginRight: 6,
  },
  uploadPhotoText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: secondaryFont,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
    fontFamily: secondaryFont,
  },
  email: {
    fontSize: 16,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  profileLoading: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  profileLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  profileHint: {
    fontSize: 15,
    color: Colors.textLight,
    fontFamily: secondaryFont,
    lineHeight: 22,
    marginBottom: 12,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 4,
  },
  editProfileIcon: {
    marginRight: 8,
  },
  editProfileButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: secondaryFont,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textLight,
    fontFamily: secondaryFont,
    width: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 12,
    paddingHorizontal: 16,
    fontFamily: secondaryFont,
  },
  menu: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
    fontFamily: secondaryFont,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.error,
    marginHorizontal: 16,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: secondaryFont,
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.gray[100],
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
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: secondaryFont,
  },
});

export default ProfileScreen;
