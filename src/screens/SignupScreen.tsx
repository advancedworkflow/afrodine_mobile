import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import {alert} from '../utils/alert';
import IconWrapper from '../components/IconWrapper';
import CustomIcon from '../components/CustomIcon';
import {useAuth} from '../contexts/AuthContext';
import {Colors, Radius, Shadows} from '../utils/colors';
import {fontButton, fontDisplay, fontHeading, fontUI} from '../utils/fonts';
import {useNavigation} from '@react-navigation/native';
import type {SignupType} from '../contexts/AuthContext';
import {getReferenceCountries, GeoCountry} from '../services/reference';

type Step = 'type' | 'form';

const strengthScore = (pw: string) => (pw.length >= 12 ? 3 : pw.length >= 8 ? 2 : pw.length > 0 ? 1 : 0);
const strengthColor = (score: number) =>
  score === 1 ? Colors.terracotta : score === 2 ? Colors.mustard : Colors.olive;
const strengthLabels = ['À compléter', 'Trop court', 'Correct', 'Solide'];

const SignupScreen = () => {
  const [step, setStep] = useState<Step>('type');
  const [accountType, setAccountType] = useState<SignupType>('client');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [countryList, setCountryList] = useState<GeoCountry[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<GeoCountry | null>(null);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const [loading, setLoading] = useState(false);
  const {signupClient, signupRestaurant} = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const countries = await getReferenceCountries();
        if (cancelled) return;
        setCountryList(countries);
        if (countries.length > 0) setSelectedCountry(countries[0]);
      } catch (e) {
        console.error('Erreur chargement pays:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const buildFullPhone = (rawPhone: string) => {
    const trimmed = rawPhone.trim();
    if (!trimmed) return trimmed;
    if (trimmed.startsWith('+')) return trimmed;
    const dial = selectedCountry?.dial_code || '+33';
    return `${dial}${trimmed.replace(/^0+/, '')}`;
  };

  const goToForm = () => setStep('form');
  const goBackToType = () => setStep('type');

  const handleSignupClient = async () => {
    if (!firstName.trim() || !lastName.trim() || !email || !password) {
      alert('Erreur', 'Veuillez remplir les champs obligatoires (prénom, nom, email, mot de passe).');
      return;
    }
    if (password.length < 6) {
      alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (!acceptedTerms) {
      alert('Erreur', 'Veuillez accepter les conditions d\'utilisation.');
      return;
    }
    setLoading(true);
    try {
      const fullPhone = phone.trim() ? buildFullPhone(phone) : undefined;
      await signupClient(email, password, firstName.trim(), lastName.trim(), fullPhone, address.trim() || undefined);
    } catch (error: any) {
      alert('Erreur d\'inscription', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupRestaurant = async () => {
    if (!name.trim() || !address.trim() || !phone.trim() || !city.trim() || !email || !password) {
      alert('Erreur', 'Veuillez remplir les champs obligatoires (nom, adresse, téléphone, ville, email, mot de passe).');
      return;
    }
    if (password.length < 6) {
      alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (!acceptedTerms) {
      alert('Erreur', 'Veuillez accepter les conditions d\'utilisation.');
      return;
    }
    setLoading(true);
    try {
      await signupRestaurant(
        email,
        password,
        name.trim(),
        address.trim(),
        buildFullPhone(phone),
        city.trim(),
        description.trim() || undefined,
        cuisineType.trim() || undefined,
      );
    } catch (error: any) {
      alert('Erreur d\'inscription', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => (accountType === 'client' ? handleSignupClient() : handleSignupRestaurant());

  const score = strengthScore(password);
  const isRestaurant = accountType === 'restaurant';

  const renderProgressHeader = () => (
    <View style={styles.progressRow}>
      <TouchableOpacity
        onPress={step === 'form' ? goBackToType : () => navigation.goBack()}
        style={styles.backButton}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <IconWrapper name="arrow-back-outline" size={20} color={Colors.darkGreen} />
      </TouchableOpacity>
      {step === 'form' && (
        <>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {width: '66%'}]} />
          </View>
          <Text style={styles.progressLabel}>2/3</Text>
        </>
      )}
    </View>
  );

  const renderTypeStep = () => (
    <View style={styles.stepBlock}>
      <Text style={styles.eyebrow}>Inscription</Text>
      <Text style={styles.title}>Vous venez pour manger ou pour cuisiner ?</Text>
      <Text style={styles.subtitle}>Vous pourrez basculer plus tard depuis vos réglages.</Text>

      <View style={styles.roleCards}>
        <TouchableOpacity
          style={[styles.roleCard, accountType === 'client' && styles.roleCardActive]}
          onPress={() => setAccountType('client')}
          activeOpacity={0.85}>
          <View style={[styles.roleIcon, {backgroundColor: Colors.terracotta}]}>
            <CustomIcon name="catering" fallbackName="restaurant-outline" size={24} color={Colors.namkeWhite} />
          </View>
          <View style={styles.roleLabels}>
            <Text style={styles.roleTitle}>Je commande</Text>
            <Text style={styles.roleHint}>Parcourir les marmites du quartier, commander, faire livrer.</Text>
          </View>
          {accountType === 'client' && (
            <View style={styles.roleMark}>
              <IconWrapper name="checkmark" size={14} color={Colors.white} />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleCard, accountType === 'restaurant' && styles.roleCardActive]}
          onPress={() => setAccountType('restaurant')}
          activeOpacity={0.85}>
          <View style={[styles.roleIcon, {backgroundColor: Colors.surface}]}>
            <CustomIcon name="cook" fallbackName="briefcase-outline" size={24} color={Colors.darkGreen} />
          </View>
          <View style={styles.roleLabels}>
            <Text style={styles.roleTitle}>Je cuisine</Text>
            <Text style={styles.roleHint}>Ouvrir ma boutique, publier mes plats du jour, suivre mes versements.</Text>
          </View>
          {accountType === 'restaurant' && (
            <View style={styles.roleMark}>
              <IconWrapper name="checkmark" size={14} color={Colors.white} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <View style={styles.infoBadge}>
          <Text style={styles.infoBadgeText}>i</Text>
        </View>
        <Text style={styles.infoText}>
          {isRestaurant
            ? 'Devenir cuisinier demande un certificat d\'hygiène — on vous accompagne.'
            : 'Vous pourrez devenir cuisinier plus tard, sans recréer de compte.'}
        </Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={goToForm} activeOpacity={0.85}>
        <Text style={styles.primaryButtonText}>Continuer</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFormStep = () => (
    <View style={styles.stepBlock}>
      <Text style={styles.eyebrow}>Inscription</Text>
      <Text style={styles.title}>{isRestaurant ? 'Ouvrez votre boutique' : 'Créer votre compte'}</Text>
      <Text style={styles.subtitle}>
        {isRestaurant
          ? 'On vous demandera le certificat d\'hygiène à l\'étape suivante.'
          : 'Vos préférences alimentaires seront notées juste après.'}
      </Text>

      <View style={styles.form}>
        {isRestaurant ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Nom du restaurant</Text>
            <View style={styles.inputPill}>
              <TextInput style={styles.input} placeholder="Chez Mariam" placeholderTextColor={Colors.textLight} value={name} onChangeText={setName} autoCapitalize="words" />
            </View>
          </View>
        ) : (
          <View style={styles.nameRow}>
            <View style={[styles.fieldGroup, styles.nameField]}>
              <Text style={styles.fieldLabel}>Prénom</Text>
              <View style={styles.inputPill}>
                <TextInput style={styles.input} placeholder="Awa" placeholderTextColor={Colors.textLight} value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
              </View>
            </View>
            <View style={[styles.fieldGroup, styles.nameField]}>
              <Text style={styles.fieldLabel}>Nom</Text>
              <View style={styles.inputPill}>
                <TextInput style={styles.input} placeholder="Diallo" placeholderTextColor={Colors.textLight} value={lastName} onChangeText={setLastName} autoCapitalize="words" />
              </View>
            </View>
          </View>
        )}

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>E-mail</Text>
          <View style={styles.inputPill}>
            <TextInput style={styles.input} placeholder="vous@exemple.com" placeholderTextColor={Colors.textLight} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Mot de passe</Text>
          <View style={styles.inputPillRow}>
            <TextInput
              style={styles.input}
              placeholder="8 caractères minimum"
              placeholderTextColor={Colors.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.pwToggle}>
              <Text style={styles.pwToggleText}>{showPassword ? 'Masquer' : 'Afficher'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.strengthRow}>
            {[1, 2, 3].map(i => (
              <View key={i} style={[styles.strengthBar, {backgroundColor: score >= i ? strengthColor(score) : Colors.border}]} />
            ))}
            <Text style={styles.strengthLabel}>{strengthLabels[score]}</Text>
          </View>
        </View>

        {isRestaurant ? (
          <>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Adresse</Text>
              <View style={styles.inputPill}>
                <TextInput style={styles.input} placeholder="Adresse complète" placeholderTextColor={Colors.textLight} value={address} onChangeText={setAddress} autoCapitalize="words" />
              </View>
            </View>
            <View style={styles.phoneRow}>
              <TouchableOpacity style={styles.countryCodeButton} onPress={() => setShowCountryPicker(true)}>
                <Text style={styles.countryCodeText}>{selectedCountry?.dial_code || '+33'}</Text>
                <IconWrapper name="chevron-down-outline" size={16} color={Colors.textLight} />
              </TouchableOpacity>
              <View style={[styles.inputPill, styles.phoneInputPill]}>
                <TextInput style={styles.input} placeholder="Téléphone" placeholderTextColor={Colors.textLight} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Ville</Text>
              <View style={styles.inputPill}>
                <TextInput style={styles.input} placeholder="Berlin" placeholderTextColor={Colors.textLight} value={city} onChangeText={setCity} autoCapitalize="words" />
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Type de cuisine (optionnel)</Text>
              <View style={styles.inputPill}>
                <TextInput style={styles.input} placeholder="Camerounaise, sénégalaise…" placeholderTextColor={Colors.textLight} value={cuisineType} onChangeText={setCuisineType} autoCapitalize="words" />
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Description (optionnel)</Text>
              <View style={[styles.inputPill, styles.textAreaPill]}>
                <TextInput style={[styles.input, styles.textArea]} placeholder="Présentez votre établissement…" placeholderTextColor={Colors.textLight} value={description} onChangeText={setDescription} multiline numberOfLines={3} />
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Quartier</Text>
              <View style={styles.inputPill}>
                <TextInput style={styles.input} placeholder="Neukölln" placeholderTextColor={Colors.textLight} value={address} onChangeText={setAddress} autoCapitalize="words" />
              </View>
            </View>
            <View style={styles.phoneRow}>
              <TouchableOpacity style={styles.countryCodeButton} onPress={() => setShowCountryPicker(true)}>
                <Text style={styles.countryCodeText}>{selectedCountry?.dial_code || '+33'}</Text>
                <IconWrapper name="chevron-down-outline" size={16} color={Colors.textLight} />
              </TouchableOpacity>
              <View style={[styles.inputPill, styles.phoneInputPill]}>
                <TextInput style={styles.input} placeholder="Téléphone (optionnel)" placeholderTextColor={Colors.textLight} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              </View>
            </View>
          </>
        )}

        <TouchableOpacity style={styles.termsRow} onPress={() => setAcceptedTerms(!acceptedTerms)} activeOpacity={0.8}>
          <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
            {acceptedTerms && <IconWrapper name="checkmark" size={14} color={Colors.namkeBlack} />}
          </View>
          <Text style={styles.termsText}>J'accepte les conditions d'utilisation et la politique de confidentialité de namke.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>{loading ? 'Création…' : 'Créer mon compte'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCountryPickerModal = () => (
    <Modal visible={showCountryPicker} transparent animationType="fade" onRequestClose={() => setShowCountryPicker(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.countryModalBox}>
          <Text style={styles.modalTitle}>Choisissez votre pays</Text>
          <FlatList
            data={countryList}
            keyExtractor={item => String(item.id)}
            style={styles.countryList}
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.countryRow}
                onPress={() => {
                  setSelectedCountry(item);
                  setShowCountryPicker(false);
                }}>
                <Text style={styles.countryRowName}>{item.name}</Text>
                <Text style={styles.countryRowDial}>{item.dial_code}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity onPress={() => setShowCountryPicker(false)} style={styles.modalCancel}>
            <Text style={styles.modalCancelText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      {renderCountryPickerModal()}
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {renderProgressHeader()}
        {step === 'type' ? renderTypeStep() : renderFormStep()}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Déjà inscrit·e ? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.footerLink}>Se connecter</Text>
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
    padding: 24,
    paddingBottom: 40,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.olive,
  },
  progressLabel: {
    fontSize: 13,
    fontFamily: fontHeading,
    color: Colors.textLight,
  },
  stepBlock: {
    gap: 10,
  },
  eyebrow: {
    fontSize: 12.5,
    fontFamily: fontHeading,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.terracotta,
  },
  title: {
    fontSize: 30,
    fontFamily: fontDisplay,
    color: Colors.text,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fontUI,
    color: Colors.textLight,
    lineHeight: 21,
    marginBottom: 8,
  },
  roleCards: {
    gap: 14,
    marginTop: 4,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderRadius: Radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleCardActive: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.terracotta,
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleLabels: {
    flex: 1,
    gap: 4,
  },
  roleTitle: {
    fontSize: 20,
    fontFamily: fontDisplay,
    color: Colors.text,
  },
  roleHint: {
    fontSize: 13,
    fontFamily: fontUI,
    color: Colors.textLight,
    lineHeight: 18,
  },
  roleMark: {
    width: 22,
    height: 22,
    borderRadius: Radius.pill,
    backgroundColor: Colors.terracotta,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 16,
    marginTop: 8,
  },
  infoBadge: {
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    backgroundColor: Colors.mustard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBadgeText: {
    fontSize: 13,
    fontFamily: fontButton,
    color: Colors.namkeBlack,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontUI,
    color: Colors.text,
    lineHeight: 18,
  },
  form: {
    marginTop: 6,
    gap: 14,
  },
  fieldGroup: {
    gap: 7,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: fontHeading,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Colors.textLight,
  },
  inputPill: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: 20,
    minHeight: 54,
    justifyContent: 'center',
  },
  inputPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingLeft: 20,
    paddingRight: 6,
    minHeight: 54,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: fontUI,
    color: Colors.text,
    padding: 0,
  },
  pwToggle: {
    backgroundColor: Colors.background,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    minHeight: 36,
    justifyContent: 'center',
  },
  pwToggleText: {
    fontSize: 12.5,
    fontFamily: fontHeading,
    color: Colors.darkGreen,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  strengthBar: {
    flex: 1,
    height: 5,
    borderRadius: Radius.pill,
  },
  strengthLabel: {
    fontSize: 12,
    fontFamily: fontUI,
    color: Colors.textLight,
    marginLeft: 6,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    minHeight: 54,
  },
  countryCodeText: {
    fontSize: 15,
    fontFamily: fontHeading,
    color: Colors.text,
  },
  phoneInputPill: {
    flex: 1,
  },
  textAreaPill: {
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  termsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: Colors.olive,
    borderColor: Colors.olive,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontUI,
    color: Colors.text,
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: Colors.terracotta,
    borderRadius: Radius.pill,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    ...Shadows.sm,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16.5,
    fontFamily: fontButton,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: Colors.textLight,
    fontSize: 15,
    fontFamily: fontUI,
  },
  footerLink: {
    color: Colors.terracotta,
    fontFamily: fontHeading,
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(5,16,4,0.5)',
    padding: 24,
  },
  countryModalBox: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '70%',
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: 24,
    ...(Platform.OS === 'web' && { boxShadow: '0 8px 32px rgba(5,16,4,0.2)' }),
    ...(Platform.OS !== 'web' && Shadows.lg),
  },
  countryList: {
    marginTop: 8,
  },
  countryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  countryRowName: {
    fontSize: 15,
    fontFamily: fontUI,
    color: Colors.text,
  },
  countryRowDial: {
    fontSize: 15,
    fontFamily: fontHeading,
    color: Colors.textLight,
  },
  modalTitle: {
    fontSize: 19,
    fontFamily: fontDisplay,
    color: Colors.text,
    textAlign: 'center',
  },
  modalCancel: {
    marginTop: 12,
    alignItems: 'center',
    padding: 8,
  },
  modalCancelText: {
    fontSize: 15,
    fontFamily: fontUI,
    color: Colors.textLight,
  },
});

export default SignupScreen;
