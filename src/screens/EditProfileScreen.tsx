import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import {alert} from '../utils/alert';
import TopBar from '../components/TopBar';
import IconWrapper from '../components/IconWrapper';
import {useTranslation} from 'react-i18next';
import {Colors} from '../utils/colors';
import {secondaryFont} from '../utils/fonts';
import {
  getClientProfile,
  updateClientProfile,
  uploadClientAvatar,
  type ClientProfileRead,
  type ClientProfileUpdatePayload,
} from '../services/clientProfile';
import {getAbsoluteImageUrl} from '../utils/api';

const ImagePicker = Platform.OS !== 'web' ? require('react-native-image-picker') : null;

// Galerie du téléphone (ou sélecteur de fichier sur le web) ; null si annulé
function pickAvatarFile(): Promise<Blob | {uri: string; name: string; type: string} | null> {
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      const input = (globalThis as any).document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => resolve(input.files?.[0] ?? null);
      input.click();
    });
  }
  return new Promise((resolve) => {
    ImagePicker.launchImageLibrary({mediaType: 'photo', quality: 0.8, maxWidth: 1024, maxHeight: 1024}, (response: any) => {
      const asset = response.assets?.[0];
      if (response.didCancel || response.errorCode || !asset?.uri) return resolve(null);
      resolve({uri: asset.uri, name: asset.fileName || 'avatar.jpg', type: asset.type || 'image/jpeg'});
    });
  });
}

const EditProfileScreen = ({navigation}: any) => {
  const {t} = useTranslation();
  const [profile, setProfile] = useState<ClientProfileRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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

  // La photo est enregistrée tout de suite, indépendamment du bouton « Enregistrer »
  const handleChangeAvatar = async () => {
    const file = await pickAvatarFile();
    if (!file) return;
    setUploadingAvatar(true);
    try {
      setProfile(await uploadClientAvatar(file));
    } catch {
      alert(t('editProfile.errorTitle'), t('editProfile.photoUploadError'));
    } finally {
      setUploadingAvatar(false);
    }
  };

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
        alert(t('editProfile.savedTitle'), t('editProfile.savedMessage'), [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        alert(t('editProfile.errorTitle'), t('editProfile.saveFailed'));
      }
    } catch {
      alert(t('editProfile.errorTitle'), t('editProfile.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar navigation={navigation} title={t('editProfile.title')} showBackButton onBackPress={() => navigation.goBack()} />
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
      <TouchableOpacity
        style={styles.avatarWrap}
        onPress={handleChangeAvatar}
        disabled={uploadingAvatar}
        activeOpacity={0.8}>
        <View style={styles.avatar}>
          {profile?.avatar_url ? (
            <Image source={{uri: getAbsoluteImageUrl(profile.avatar_url) ?? profile.avatar_url}} style={styles.avatarImage} />
          ) : (
            <IconWrapper name="person-outline" size={44} color={Colors.textLight} />
          )}
        </View>
        <View style={styles.avatarBadge}>
          {uploadingAvatar ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <IconWrapper name="camera-outline" size={16} color={Colors.white} />
          )}
        </View>
        <Text style={styles.avatarHint}>{t('editProfile.changePhoto')}</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('editProfile.personalInfo')}</Text>
        <Field label={t('editProfile.firstName')} value={firstName} onChangeText={setFirstName} placeholder={t('editProfile.firstName')} />
        <Field label={t('editProfile.lastName')} value={lastName} onChangeText={setLastName} placeholder={t('editProfile.lastName')} />
        <Field label={t('editProfile.phone')} value={phone} onChangeText={setPhone} placeholder={t('editProfile.phone')} keyboardType="phone-pad" />
        <Field
          label={t('editProfile.deliveryAddress')}
          value={address}
          onChangeText={setAddress}
          placeholder={t('editProfile.addressPlaceholder')}
          multiline
        />
        <Field
          label={t('editProfile.birthDate')}
          value={birthDate}
          onChangeText={setBirthDate}
          placeholder={t('editProfile.birthDatePlaceholder')}
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
            <Text style={styles.saveButtonText}>{t('editProfile.saveChanges')}</Text>
          </>
        )}
      </TouchableOpacity>
      <View style={styles.bottomPad} />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <TopBar navigation={navigation} title={t('editProfile.title')} showBackButton onBackPress={() => navigation.goBack()} />
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
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarBadge: {
    position: 'absolute',
    top: 72,
    marginLeft: 72,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.darkGreen,
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
  },
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
    backgroundColor: Colors.white,
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
