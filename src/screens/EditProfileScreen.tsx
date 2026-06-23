import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import TopBar from '../components/TopBar';
import IconWrapper from '../components/IconWrapper';
import {Colors} from '../utils/colors';
import {secondaryFont} from '../utils/fonts';
import {
  getClientProfile,
  updateClientProfile,
  type ClientProfileRead,
  type ClientProfileUpdatePayload,
} from '../services/clientProfile';

const EditProfileScreen = ({navigation}: any) => {
  const [profile, setProfile] = useState<ClientProfileRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [birthDate, setBirthDate] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getClientProfile();
        if (!cancelled) {
          setProfile(data ?? null);
          if (data) {
            setFirstName(data.first_name ?? '');
            setLastName(data.last_name ?? '');
            setPhone(data.phone ?? '');
            setAddress(data.address ?? '');
            setBirthDate(data.birth_date ?? '');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: ClientProfileUpdatePayload = {
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        birth_date: birthDate.trim() ? birthDate.trim() : null,
      };
      const updated = await updateClientProfile(payload);
      if (updated) {
        setProfile(updated);
        Alert.alert('Profil enregistré', 'Les modifications ont bien été enregistrées.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Erreur', 'Impossible d\'enregistrer le profil. Réessayez.');
      }
    } catch {
      Alert.alert('Erreur', 'Impossible d\'enregistrer le profil. Réessayez.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar navigation={navigation} title="Modifier mon profil" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  const content = (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled">
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>
        <Field label="Prénom" value={firstName} onChangeText={setFirstName} placeholder="Prénom" />
        <Field label="Nom" value={lastName} onChangeText={setLastName} placeholder="Nom" />
        <Field label="Téléphone" value={phone} onChangeText={setPhone} placeholder="Téléphone" keyboardType="phone-pad" />
        <Field
          label="Adresse de livraison"
          value={address}
          onChangeText={setAddress}
          placeholder="Rue, code postal, ville…"
          multiline
        />
        <Field
          label="Date de naissance (optionnel)"
          value={birthDate}
          onChangeText={setBirthDate}
          placeholder="AAAA-MM-JJ"
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}>
        {saving ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <>
            <IconWrapper name="save-outline" size={20} color={Colors.white} style={styles.saveIcon} />
            <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
          </>
        )}
      </TouchableOpacity>
      <View style={styles.bottomPad} />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <TopBar navigation={navigation} title="Modifier mon profil" showBackButton onBackPress={() => navigation.goBack()} />
      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </View>
  );
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textLight}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        numberOfLines={multiline ? 4 : 1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: secondaryFont,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  field: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 6,
    fontFamily: secondaryFont,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
    fontFamily: secondaryFont,
    backgroundColor: Colors.backgroundLight,
  },
  inputMultiline: {
    minHeight: 96,
    paddingTop: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: secondaryFont,
  },
  bottomPad: {
    height: 24,
  },
});

export default EditProfileScreen;
