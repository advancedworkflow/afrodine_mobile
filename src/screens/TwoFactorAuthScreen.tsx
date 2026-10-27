import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {alert} from '../utils/alert';
import IconWrapper from '../components/IconWrapper';
import {useTranslation} from 'react-i18next';
import {Colors, Radius} from '../utils/colors';
import {fontDisplayMedium, fontHeading, fontUI} from '../utils/fonts';
import {
  getTwoFactorStatus,
  enableTwoFactor,
  disableTwoFactor,
  type Enable2FAResult,
} from '../services/twoFactorAuth';

const TwoFactorAuthScreen = ({route}: any) => {
  const {t} = useTranslation();
  const enrollmentFromParams: Enable2FAResult | undefined = route?.params?.enrollment;
  const [loading, setLoading] = useState(!enrollmentFromParams);
  const [enabled, setEnabled] = useState(!!enrollmentFromParams);
  const [showPasswordForm, setShowPasswordForm] = useState<'enable' | 'disable' | null>(null);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [enrollment, setEnrollment] = useState<Enable2FAResult | null>(enrollmentFromParams ?? null);

  useEffect(() => {
    // Si on arrive avec un enrollment (juste après activation depuis Paramètres),
    // pas besoin de re-fetcher le statut : on affiche directement la clé/les codes.
    if (enrollmentFromParams) return;
    (async () => {
      try {
        const status = await getTwoFactorStatus();
        setEnabled(status.enabled);
      } catch {
        setEnabled(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const closePasswordForm = () => {
    setShowPasswordForm(null);
    setPassword('');
  };

  const handleEnable = async () => {
    if (!password.trim()) return;
    setSubmitting(true);
    try {
      const result = await enableTwoFactor(password.trim());
      setEnrollment(result);
      setEnabled(true);
      closePasswordForm();
    } catch (e: any) {
      alert(t('twoFactorAuth.errorTitle'), e?.response?.data?.detail || t('twoFactorAuth.wrongPasswordOrServerError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable = async () => {
    if (!password.trim()) return;
    setSubmitting(true);
    try {
      await disableTwoFactor(password.trim());
      setEnabled(false);
      setEnrollment(null);
      closePasswordForm();
    } catch (e: any) {
      alert(t('twoFactorAuth.errorTitle'), e?.response?.data?.detail || t('twoFactorAuth.wrongPasswordOrServerError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.darkGreen} />
      </View>
    );
  }

  // Écran de récapitulatif affiché juste après activation : secret + codes de secours,
  // à noter une seule fois (le secret ne sera plus jamais renvoyé par l'API ensuite).
  if (enrollment) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.successIcon}>
          <IconWrapper name="shield-checkmark-outline" size={32} color={Colors.darkGreen} />
        </View>
        <Text style={styles.title}>{t('twoFactorAuth.activatedTitle')}</Text>
        <Text style={styles.paragraph}>
          {t('twoFactorAuth.activatedParagraph')}
        </Text>

        <View style={styles.codeBlock}>
          <Text style={styles.codeLabel}>{t('twoFactorAuth.secretKey')}</Text>
          <Text selectable style={styles.codeValue}>{enrollment.secret}</Text>
        </View>

        <View style={styles.codeBlock}>
          <Text style={styles.codeLabel}>{t('twoFactorAuth.totpUri')}</Text>
          <Text selectable style={styles.codeValueSmall}>{enrollment.totp_uri}</Text>
        </View>

        <View style={styles.codeBlock}>
          <Text style={styles.codeLabel}>{t('twoFactorAuth.backupCodes')}</Text>
          {enrollment.backup_codes.map(code => (
            <Text key={code} selectable style={styles.backupCode}>{code}</Text>
          ))}
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => setEnrollment(null)} activeOpacity={0.9}>
          <Text style={styles.primaryButtonText}>{t('twoFactorAuth.codesNoted')}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.successIcon, !enabled && styles.iconDisabled]}>
        <IconWrapper
          name={enabled ? 'shield-checkmark-outline' : 'shield-outline'}
          size={32}
          color={enabled ? Colors.darkGreen : Colors.textLight}
        />
      </View>
      <Text style={styles.title}>{t('twoFactorAuth.title')}</Text>
      <Text style={styles.paragraph}>
        {enabled
          ? t('twoFactorAuth.enabledParagraph')
          : t('twoFactorAuth.disabledParagraph')}
      </Text>

      {showPasswordForm ? (
        <View style={styles.passwordForm}>
          <Text style={styles.passwordLabel}>{t('twoFactorAuth.confirmPassword')}</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder={t('twoFactorAuth.passwordPlaceholder')}
            placeholderTextColor={Colors.textLight}
            style={styles.passwordInput}
            autoFocus
          />
          <View style={styles.passwordActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={closePasswordForm} disabled={submitting}>
              <Text style={styles.secondaryButtonText}>{t('twoFactorAuth.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, styles.flexButton, submitting && styles.buttonDisabled]}
              onPress={showPasswordForm === 'enable' ? handleEnable : handleDisable}
              disabled={submitting || !password.trim()}>
              {submitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {showPasswordForm === 'enable' ? t('twoFactorAuth.enable') : t('twoFactorAuth.disable')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={enabled ? styles.dangerButton : styles.primaryButton}
          onPress={() => setShowPasswordForm(enabled ? 'disable' : 'enable')}
          activeOpacity={0.9}>
          <Text style={enabled ? styles.dangerButtonText : styles.primaryButtonText}>
            {enabled ? t('twoFactorAuth.disableCta') : t('twoFactorAuth.enableCta')}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 22,
    paddingBottom: 40,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.category.green.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconDisabled: {
    backgroundColor: Colors.surface,
  },
  title: {
    fontSize: 21,
    fontFamily: fontDisplayMedium,
    color: Colors.text,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15.5,
    fontFamily: fontUI,
    color: Colors.textLight,
    lineHeight: 22,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: Colors.darkGreen,
    borderRadius: Radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: fontHeading,
    color: Colors.white,
  },
  dangerButton: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonText: {
    fontSize: 16,
    fontFamily: fontHeading,
    color: '#ef4444',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  passwordForm: {
    gap: 12,
  },
  passwordLabel: {
    fontSize: 14,
    fontFamily: fontHeading,
    color: Colors.text,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: fontUI,
    color: Colors.text,
  },
  passwordActions: {
    flexDirection: 'row',
    gap: 10,
  },
  flexButton: {
    flex: 1,
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: fontUI,
    color: Colors.textLight,
  },
  codeBlock: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 16,
    gap: 6,
  },
  codeLabel: {
    fontSize: 12.5,
    fontFamily: fontHeading,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.textLight,
  },
  codeValue: {
    fontSize: 19,
    fontFamily: fontHeading,
    color: Colors.text,
    letterSpacing: 1,
  },
  codeValueSmall: {
    fontSize: 13,
    fontFamily: fontUI,
    color: Colors.text,
  },
  backupCode: {
    fontSize: 16,
    fontFamily: fontHeading,
    color: Colors.text,
    letterSpacing: 1,
    marginTop: 2,
  },
});

export default TwoFactorAuthScreen;
