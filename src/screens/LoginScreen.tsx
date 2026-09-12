import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import IconWrapper from '../components/IconWrapper';
import {useAuth} from '../contexts/AuthContext';
import {alert} from '../utils/alert';
import {Colors, Radius} from '../utils/colors';
import {fontButton, fontDisplay, fontHeading, fontUI} from '../utils/fonts';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

const LoginScreen = () => {
  const {t} = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const {login, loginWithGoogle} = useAuth();
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!email || !password) {
      alert(t('login.errorTitle'), t('login.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // Navigation handled by AppNavigator based on auth state
    } catch (error: any) {
      alert(t('login.loginErrorTitle'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      // Navigation handled by AppNavigator based on auth state
    } catch (error: any) {
      alert(t('login.loginErrorTitle'), error.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image source={require('../assets/namke-logo-header.png')} style={styles.brandLogo} resizeMode="contain" />
          <Text style={styles.eyebrow}>{t('login.eyebrow')}</Text>
          <Text style={styles.title}>{t('login.title')}</Text>
          <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <IconWrapper
              name="mail-outline"
              size={20}
              color={Colors.textLight}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder={t('login.emailPlaceholder')}
              placeholderTextColor={Colors.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <IconWrapper
              name="lock-closed-outline"
              size={20}
              color={Colors.textLight}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder={t('login.passwordPlaceholder')}
              placeholderTextColor={Colors.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}>
            <Text style={styles.buttonText}>
              {loading ? t('login.connecting') : t('login.submit')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
            onPress={handleGoogleLogin}
            disabled={googleLoading}>
            <IconWrapper name="logo-google" size={20} color={Colors.text} style={styles.googleIcon} />
            <Text style={styles.googleButtonText}>
              {googleLoading ? t('login.connecting') : t('login.continueWithGoogle')}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('login.noAccount')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup' as never)}>
              <Text style={styles.footerLink}>{t('login.signup')}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => navigation.navigate('MainTabs' as never)}>
            <Text style={styles.guestButtonText}>
              {t('login.continueAsGuest')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  header: {
    marginBottom: 28,
  },
  brandLogo: {
    width: 140,
    height: 46,
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 12.5,
    fontFamily: fontHeading,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.terracotta,
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    fontFamily: fontDisplay,
    color: Colors.text,
    lineHeight: 38,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fontUI,
    color: Colors.textLight,
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    marginBottom: 16,
    paddingHorizontal: 20,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: fontUI,
    color: Colors.text,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16.5,
    fontFamily: fontButton,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: fontButton,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  footerText: {
    color: Colors.textLight,
    fontSize: 14,
    fontFamily: fontUI,
  },
  footerLink: {
    color: Colors.primary,
    fontFamily: fontHeading,
    fontSize: 14,
  },
  guestButton: {
    padding: 12,
    alignItems: 'center',
  },
  guestButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontFamily: fontHeading,
  },
});

export default LoginScreen;
