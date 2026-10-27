import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, StatusBar} from 'react-native';
import {useTranslation} from 'react-i18next';
import IconWrapper from '../components/IconWrapper';
import {alert} from '../utils/alert';
import {Colors, Radius} from '../utils/colors';
import {fontButton, fontDisplay, fontUI} from '../utils/fonts';
import {formatAxiosError} from '../utils/formatApiError';
import {requestPasswordReset} from '../services/passwordReset';

const ForgotPasswordScreen = ({navigation, route}: any) => {
  const {t} = useTranslation();
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const value = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      alert(t('forgotPassword.errorTitle'), t('forgotPassword.invalidEmail'));
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(value);
      setSent(true);
    } catch (e) {
      alert(t('forgotPassword.errorTitle'), formatAxiosError(e, t('forgotPassword.sendFailed')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <IconWrapper name="arrow-back-outline" size={22} color={Colors.darkGreen} />
        </TouchableOpacity>

        {sent ? (
          <View>
            <View style={styles.sentIcon}>
              <IconWrapper name="mail-open-outline" size={40} color={Colors.white} />
            </View>
            <Text style={styles.title}>{t('forgotPassword.sentTitle')}</Text>
            <Text style={styles.subtitle}>{t('forgotPassword.sentMessage', {email: email.trim()})}</Text>
            <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
              <Text style={styles.buttonText}>{t('forgotPassword.backToLogin')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.title}>{t('forgotPassword.title')}</Text>
            <Text style={styles.subtitle}>{t('forgotPassword.subtitle')}</Text>
            <View style={styles.inputContainer}>
              <IconWrapper name="mail-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('login.emailPlaceholder')}
                placeholderTextColor={Colors.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
            </View>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}>
              <Text style={styles.buttonText}>
                {loading ? t('forgotPassword.sending') : t('forgotPassword.submit')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
    padding: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  sentIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.darkGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 34,
    fontFamily: fontDisplay,
    color: Colors.text,
    lineHeight: 38,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    fontFamily: fontUI,
    color: Colors.textLight,
    lineHeight: 24,
    marginBottom: 28,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
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
    fontSize: 17,
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
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 17.5,
    fontFamily: fontButton,
  },
});

export default ForgotPasswordScreen;
