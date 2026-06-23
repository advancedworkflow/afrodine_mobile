import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  StatusBar,
  Platform,
  Modal,
  Image,
} from 'react-native';
import IconWrapper from '../components/IconWrapper';
import {useAuth} from '../contexts/AuthContext';
import {Colors} from '../utils/colors';
import {useNavigation} from '@react-navigation/native';
import type {SignupType} from '../contexts/AuthContext';

const SignupScreen = () => {
  const [accountType, setAccountType] = useState<SignupType | null>(null);
  const [showTypeModal, setShowTypeModal] = useState(true);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [cuisineType, setCuisineType] = useState('');

  const [loading, setLoading] = useState(false);
  const {signupClient, signupRestaurant} = useAuth();
  const navigation = useNavigation();

  const openTypeModal = () => {
    setAccountType(null);
    setShowTypeModal(true);
  };

  const chooseType = (type: SignupType) => {
    setAccountType(type);
    setShowTypeModal(false);
  };

  const handleSignupClient = async () => {
    if (!firstName.trim() || !lastName.trim() || !email || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir les champs obligatoires (prénom, nom, email, mot de passe).');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setLoading(true);
    try {
      await signupClient(email, password, firstName.trim(), lastName.trim(), phone.trim() || undefined, address.trim() || undefined);
    } catch (error: any) {
      Alert.alert('Erreur d\'inscription', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupRestaurant = async () => {
    if (!name.trim() || !address.trim() || !phone.trim() || !city.trim() || !email || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir les champs obligatoires (nom, adresse, téléphone, ville, email, mot de passe).');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setLoading(true);
    try {
      await signupRestaurant(
        email,
        password,
        name.trim(),
        address.trim(),
        phone.trim(),
        city.trim(),
        description.trim() || undefined,
        cuisineType.trim() || undefined,
      );
    } catch (error: any) {
      Alert.alert('Erreur d\'inscription', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderTypeChoiceModal = () => (
    <Modal visible={showTypeModal} transparent animationType="fade" onRequestClose={() => navigation.goBack()} statusBarTranslucent>
      <View style={styles.modalOverlay}>
        <View style={styles.typeModalBox}>
          <Text style={styles.typeModalTitle}>Choisissez votre type de compte</Text>
          <Text style={styles.typeModalSubtitle}>Comment souhaitez-vous utiliser namke ?</Text>
          <TouchableOpacity style={[styles.typeButton, styles.typeButtonClient]} onPress={() => chooseType('client')} activeOpacity={0.8}>
            <IconWrapper name="person-outline" size={32} color={Colors.white} />
            <View style={styles.typeButtonLabels}>
              <Text style={styles.typeButtonText}>Client</Text>
              <Text style={styles.typeButtonHint}>Commander dans les restaurants</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.typeButton, styles.typeButtonRestaurant]} onPress={() => chooseType('restaurant')} activeOpacity={0.8}>
            <IconWrapper name="restaurant-outline" size={32} color={Colors.white} />
            <View style={styles.typeButtonLabels}>
              <Text style={styles.typeButtonText}>Restaurateur</Text>
              <Text style={styles.typeButtonHint}>Gérer mon restaurant et mes plats</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.typeModalCancel}>
            <Text style={styles.typeModalCancelText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderClientForm = () => (
    <View style={styles.form}>
      <TouchableOpacity onPress={openTypeModal} style={styles.changeTypeLink}>
        <Text style={styles.changeTypeText}>← Changer le type de compte</Text>
      </TouchableOpacity>
      <View style={styles.inputContainer}>
        <IconWrapper name="person-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
        <TextInput style={styles.input} placeholder="Prénom *" placeholderTextColor={Colors.textLight} value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
      </View>
      <View style={styles.inputContainer}>
        <IconWrapper name="person-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
        <TextInput style={styles.input} placeholder="Nom *" placeholderTextColor={Colors.textLight} value={lastName} onChangeText={setLastName} autoCapitalize="words" />
      </View>
      <View style={styles.inputContainer}>
        <IconWrapper name="mail-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
        <TextInput style={styles.input} placeholder="Email *" placeholderTextColor={Colors.textLight} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
      </View>
      <View style={styles.inputContainer}>
        <IconWrapper name="lock-closed-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
        <TextInput style={styles.input} placeholder="Mot de passe *" placeholderTextColor={Colors.textLight} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
      </View>
      <View style={styles.inputContainer}>
        <IconWrapper name="lock-closed-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
        <TextInput style={styles.input} placeholder="Confirmer le mot de passe *" placeholderTextColor={Colors.textLight} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoCapitalize="none" />
      </View>
      <View style={styles.inputContainer}>
        <IconWrapper name="call-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
        <TextInput style={styles.input} placeholder="Téléphone (optionnel)" placeholderTextColor={Colors.textLight} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      </View>
      <View style={styles.inputContainer}>
        <IconWrapper name="location-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
        <TextInput style={styles.input} placeholder="Adresse (optionnel)" placeholderTextColor={Colors.textLight} value={address} onChangeText={setAddress} autoCapitalize="words" />
      </View>
      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSignupClient} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Inscription...' : 'Créer mon compte client'}</Text>
      </TouchableOpacity>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Déjà un compte ? </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.footerLink}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRestaurantForm = () => (
    <View style={styles.form}>
      <TouchableOpacity onPress={openTypeModal} style={styles.changeTypeLink}>
        <Text style={styles.changeTypeText}>← Changer le type de compte</Text>
      </TouchableOpacity>
      <View style={styles.inputContainer}>
        <IconWrapper name="restaurant-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
        <TextInput style={styles.input} placeholder="Nom du restaurant *" placeholderTextColor={Colors.textLight} value={name} onChangeText={setName} autoCapitalize="words" />
      </View>
      <View style={styles.inputContainer}>
        <IconWrapper name="mail-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
        <TextInput style={styles.input} placeholder="Email *" placeholderTextColor={Colors.textLight} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
      </View>
      <View style={styles.inputContainer}>
        <IconWrapper name="lock-closed-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
        <TextInput style={styles.input} placeholder="Mot de passe *" placeholderTextColor={Colors.textLight} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
      </View>
      <View style={styles.inputContainer}>
        <IconWrapper name="lock-closed-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
        <TextInput style={styles.input} placeholder="Confirmer le mot de passe *" placeholderTextColor={Colors.textLight} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoCapitalize="none" />
      </View>
      <View style={styles.inputContainer}>
        <IconWrapper name="location-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
        <TextInput style={styles.input} placeholder="Adresse *" placeholderTextColor={Colors.textLight} value={address} onChangeText={setAddress} autoCapitalize="words" />
      </View>
      <View style={styles.inputContainer}>
        <IconWrapper name="call-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
        <TextInput style={styles.input} placeholder="Téléphone *" placeholderTextColor={Colors.textLight} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      </View>
      <View style={styles.inputContainer}>
        <IconWrapper name="business-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
        <TextInput style={styles.input} placeholder="Ville *" placeholderTextColor={Colors.textLight} value={city} onChangeText={setCity} autoCapitalize="words" />
      </View>
      <View style={styles.inputContainer}>
        <IconWrapper name="document-text-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
        <TextInput style={[styles.input, styles.inputArea]} placeholder="Description (optionnel)" placeholderTextColor={Colors.textLight} value={description} onChangeText={setDescription} multiline numberOfLines={2} />
      </View>
      <View style={styles.inputContainer}>
        <IconWrapper name="pricetag-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
        <TextInput style={styles.input} placeholder="Type de cuisine (optionnel)" placeholderTextColor={Colors.textLight} value={cuisineType} onChangeText={setCuisineType} autoCapitalize="words" />
      </View>
      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSignupRestaurant} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Inscription...' : 'Créer mon compte restaurateur'}</Text>
      </TouchableOpacity>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Déjà un compte ? </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.footerLink}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      {renderTypeChoiceModal()}
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require('../assets/namke-logo-header.png')} style={styles.brandLogo} resizeMode="contain" />
            <Text style={styles.subtitle}>
              {accountType === 'client' ? 'Compte client' : accountType === 'restaurant' ? 'Compte restaurateur' : 'Créez votre compte'}
            </Text>
          </View>
        </View>
        {accountType === 'client' && renderClientForm()}
        {accountType === 'restaurant' && renderRestaurantForm()}
        {!accountType && !showTypeModal && (
          <TouchableOpacity style={styles.button} onPress={openTypeModal}>
            <Text style={styles.buttonText}>Choisir le type de compte</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.white,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: { alignItems: 'center' },
  brandLogo: {
    width: 220,
    height: 72,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
  },
  form: { width: '100%' },
  changeTypeLink: {
    marginBottom: 16,
  },
  changeTypeText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    height: 56,
  },
  inputArea: {
    minHeight: 56,
    height: undefined,
    paddingVertical: 12,
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  button: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: { color: Colors.textLight, fontSize: 14 },
  footerLink: { color: Colors.primary, fontWeight: 'bold', fontSize: 14 },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 24,
  },
  typeModalBox: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    ...(Platform.OS === 'web' && { boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }),
    ...(Platform.OS !== 'web' && { elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 }),
  },
  typeModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  typeModalSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 24,
    textAlign: 'center',
  },
  typeButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 14,
    marginBottom: 12,
    gap: 16,
  },
  typeButtonClient: {
    backgroundColor: Colors.primary,
  },
  typeButtonRestaurant: {
    backgroundColor: Colors.primaryDark || Colors.primary,
  },
  typeButtonLabels: {
    flex: 1,
  },
  typeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  typeButtonHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  typeModalCancel: {
    marginTop: 16,
    padding: 8,
  },
  typeModalCancelText: {
    fontSize: 15,
    color: Colors.textLight,
  },
});

export default SignupScreen;
