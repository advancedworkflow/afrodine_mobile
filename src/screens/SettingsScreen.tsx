import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {alert} from '../utils/alert';
import IconWrapper from '../components/IconWrapper';
import CustomToggle from '../components/CustomToggle';
import {useAuth} from '../contexts/AuthContext';
import {useTranslation} from 'react-i18next';
import {Colors, Radius} from '../utils/colors';
import {fontButton, fontHeading, fontUI} from '../utils/fonts';
import {getTwoFactorStatus, enableTwoFactor, disableTwoFactor} from '../services/twoFactorAuth';

const DIETARY_PREFS_KEY = '@afrodine_dietary_preferences';
const DIETARY_OPTION_KEYS = ['vegetarian', 'vegan', 'halal', 'no_peanut', 'gluten_free'];

const SettingsScreen = ({navigation}: any) => {
  const {t} = useTranslation();
  const {user, logout, isRestaurant} = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean | null>(null);
  const [show2FAPasswordForm, setShow2FAPasswordForm] = useState(false);
  const [twoFactorPassword, setTwoFactorPassword] = useState('');
  const [submitting2FA, setSubmitting2FA] = useState(false);
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);

  useEffect(() => {
    if (isRestaurant) return;
    getTwoFactorStatus()
      .then(s => setTwoFactorEnabled(s.enabled))
      .catch(() => setTwoFactorEnabled(null));
  }, [isRestaurant]);

  useEffect(() => {
    const unsubscribe = navigation.addListener?.('focus', () => {
      if (!isRestaurant) {
        getTwoFactorStatus().then(s => setTwoFactorEnabled(s.enabled)).catch(() => {});
      }
    });
    return () => unsubscribe?.();
  }, [navigation, isRestaurant]);

  useEffect(() => {
    AsyncStorage.getItem(DIETARY_PREFS_KEY)
      .then(raw => {
        if (raw) setDietaryPrefs(JSON.parse(raw));
      })
      .catch(() => {});
  }, []);

  const handleToggle2FA = () => {
    // Le backend exige le mot de passe pour activer/désactiver — on affiche le champ
    // inline plutôt que de basculer immédiatement le toggle.
    setShow2FAPasswordForm(true);
  };

  const cancel2FAForm = () => {
    setShow2FAPasswordForm(false);
    setTwoFactorPassword('');
  };

  const confirm2FAChange = async () => {
    if (!twoFactorPassword.trim()) return;
    setSubmitting2FA(true);
    try {
      if (twoFactorEnabled) {
        await disableTwoFactor(twoFactorPassword.trim());
        setTwoFactorEnabled(false);
        cancel2FAForm();
      } else {
        const result = await enableTwoFactor(twoFactorPassword.trim());
        setTwoFactorEnabled(true);
        cancel2FAForm();
        navigation.navigate('TwoFactorAuth', {enrollment: result});
      }
    } catch (e: any) {
      alert(t('settings.errorTitle'), e?.response?.data?.detail || t('settings.wrongPasswordOrServerError'));
    } finally {
      setSubmitting2FA(false);
    }
  };

  const toggleDietaryPref = (key: string) => {
    setDietaryPrefs(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      AsyncStorage.setItem(DIETARY_PREFS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const browserWindow = (globalThis as {window?: {confirm: (message?: string) => boolean}}).window;
      const ok = browserWindow
        ? browserWindow.confirm(t('settings.logoutConfirmMessage'))
        : true;
      if (!ok) return;
      logout().catch(() => {
        alert(t('settings.errorTitle'), t('settings.logoutFailed'));
      });
      return;
    }

    alert(
      t('settings.logoutTitle'),
      t('settings.logoutConfirmMessage'),
      [
        {text: t('settings.cancel'), style: 'cancel'},
        {
          text: t('settings.logoutTitle'),
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // L'écran Login s'affiche automatiquement : le navigator affiche la branche "non authentifié" quand user devient null
            } catch (e) {
              alert(t('settings.errorTitle'), t('settings.logoutFailed'));
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
        <View style={styles.settingItem}>
          <IconWrapper name="person-outline" size={24} color={Colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>{t('settings.name')}</Text>
            <Text style={styles.settingValue}>{user?.name || t('settings.notSet')}</Text>
          </View>
        </View>
        <View style={styles.settingItem}>
          <IconWrapper name="mail-outline" size={24} color={Colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>{t('settings.email')}</Text>
            <Text style={styles.settingValue}>{user?.email || t('settings.notSet')}</Text>
          </View>
        </View>
        {isRestaurant && (
          <>
            <View style={styles.settingItem}>
              <IconWrapper name="restaurant-outline" size={24} color={Colors.primary} />
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>{t('settings.accountType')}</Text>
                <Text style={styles.settingValue}>{t('settings.restaurantOwner')}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('RestaurantProfile')}>
              <IconWrapper name="business-outline" size={24} color={Colors.primary} />
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>{t('settings.restaurantProfile')}</Text>
              </View>
              <IconWrapper name="chevron-forward" size={20} color={Colors.textLight} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {!isRestaurant && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.security')}</Text>
          <View style={styles.settingItem}>
            <IconWrapper
              name={twoFactorEnabled ? 'shield-checkmark-outline' : 'shield-outline'}
              size={24}
              color={Colors.primary}
            />
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{t('settings.twoFactorAuth')}</Text>
              <Text style={styles.settingValue}>
                {twoFactorEnabled == null ? '…' : twoFactorEnabled ? t('settings.enabled') : t('settings.disabled')}
              </Text>
            </View>
            <CustomToggle
              value={!!twoFactorEnabled}
              onValueChange={handleToggle2FA}
              disabled={twoFactorEnabled == null}
            />
          </View>
          {show2FAPasswordForm && (
            <View style={styles.inlineForm}>
              <Text style={styles.inlineFormLabel}>
                {twoFactorEnabled ? t('settings.confirmPasswordToDisable') : t('settings.confirmPasswordToEnable')}
              </Text>
              <TextInput
                value={twoFactorPassword}
                onChangeText={setTwoFactorPassword}
                secureTextEntry
                placeholder={t('settings.passwordPlaceholder')}
                placeholderTextColor={Colors.textLight}
                style={styles.inlineInput}
                autoFocus
              />
              <View style={styles.inlineFormActions}>
                <TouchableOpacity onPress={cancel2FAForm} disabled={submitting2FA} style={styles.inlineCancelButton}>
                  <Text style={styles.inlineCancelText}>{t('settings.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirm2FAChange}
                  disabled={submitting2FA || !twoFactorPassword.trim()}
                  style={[styles.inlineConfirmButton, (submitting2FA || !twoFactorPassword.trim()) && styles.inlineConfirmDisabled]}>
                  {submitting2FA ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <Text style={styles.inlineConfirmText}>{t('settings.confirm')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {!isRestaurant && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.dietaryPreferences')}</Text>
          {DIETARY_OPTION_KEYS.map(key => (
            <View key={key} style={styles.settingItem}>
              <IconWrapper name="restaurant-outline" size={24} color={Colors.primary} />
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>{t(`settings.dietary.${key}`)}</Text>
              </View>
              <CustomToggle
                value={dietaryPrefs.includes(key)}
                onValueChange={() => toggleDietaryPref(key)}
              />
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
        <View style={styles.settingItem}>
          <IconWrapper name="notifications-outline" size={24} color={Colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>{t('settings.enableNotifications')}</Text>
          </View>
          <CustomToggle value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
        </View>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('Notifications')}>
          <IconWrapper name="notifications-outline" size={24} color={Colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>{t('settings.viewNotifications')}</Text>
          </View>
          <IconWrapper name="chevron-forward" size={20} color={Colors.textLight} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.other')}</Text>
        <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('Help')}>
          <IconWrapper name="help-circle-outline" size={24} color={Colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>{t('settings.help')}</Text>
          </View>
          <IconWrapper name="chevron-forward" size={20} color={Colors.textLight} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('Terms')}>
          <IconWrapper name="document-text-outline" size={24} color={Colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>{t('settings.terms')}</Text>
          </View>
          <IconWrapper name="chevron-forward" size={20} color={Colors.textLight} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <IconWrapper name="log-out-outline" size={20} color={Colors.error} style={styles.logoutIcon} />
        <Text style={styles.logoutText}>{t('settings.logout')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  section: {
    backgroundColor: Colors.white,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: Radius.lg,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    color: Colors.textLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: fontHeading,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: fontUI,
    color: Colors.text,
  },
  settingValue: {
    fontSize: 13,
    fontFamily: fontUI,
    color: Colors.textLight,
    marginTop: 2,
  },
  inlineForm: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
  },
  inlineFormLabel: {
    fontSize: 13,
    fontFamily: fontUI,
    color: Colors.textLight,
    lineHeight: 18,
  },
  inlineInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: fontUI,
    color: Colors.text,
  },
  inlineFormActions: {
    flexDirection: 'row',
    gap: 10,
  },
  inlineCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineCancelText: {
    fontSize: 14,
    fontFamily: fontUI,
    color: Colors.textLight,
  },
  inlineConfirmButton: {
    flex: 1,
    backgroundColor: Colors.darkGreen,
    borderRadius: Radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineConfirmDisabled: {
    opacity: 0.6,
  },
  inlineConfirmText: {
    fontSize: 14,
    fontFamily: fontHeading,
    color: Colors.white,
  },
  logoutButton: {
    flexDirection: 'row',
    margin: 16,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: Colors.error,
    fontSize: 16,
    fontFamily: fontButton,
  },
});

export default SettingsScreen;

