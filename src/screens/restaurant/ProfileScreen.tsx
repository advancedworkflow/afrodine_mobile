import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import TopBar from '../../components/TopBar';
import IconWrapper from '../../components/IconWrapper';
import {Colors} from '../../utils/colors';
import {secondaryFont} from '../../utils/fonts';
import {
  getRestaurantProfile,
  updateRestaurantProfile,
  type RestaurantProfileRead,
  type RestaurantProfileUpdatePayload,
} from '../../services/restaurantManagement';

const RestaurantProfileScreen = ({navigation}: any) => {
  const [profile, setProfile] = useState<RestaurantProfileRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [minimumOrder, setMinimumOrder] = useState('');
  const [bio, setBio] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [facebookLink, setFacebookLink] = useState('');
  const [instagramLink, setInstagramLink] = useState('');

  const loadProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getRestaurantProfile();
      setProfile(data ?? null);
      if (data) {
        setName(data.name ?? '');
        setDescription(data.description ?? '');
        setCuisineType(data.cuisine_type ?? '');
        setPhone(data.phone ?? '');
        setEmail(data.email ?? '');
        setAddress(data.address ?? '');
        setDeliveryFee(data.delivery_fee != null ? String(data.delivery_fee) : '');
        setMinimumOrder(data.minimum_order != null ? String(data.minimum_order) : '');
        setBio(data.bio ?? '');
        setOpeningHours(data.opening_hours ?? '');
        setWebsiteUrl(data.website_url ?? '');
        setFacebookLink(data.facebook_link ?? '');
        setInstagramLink(data.instagram_link ?? '');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: RestaurantProfileUpdatePayload = {
        name: name.trim() || undefined,
        description: description.trim() || undefined,
        cuisine_type: cuisineType.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        delivery_fee: deliveryFee.trim() ? parseFloat(deliveryFee.replace(',', '.')) : undefined,
        minimum_order: minimumOrder.trim() ? parseFloat(minimumOrder.replace(',', '.')) : undefined,
        bio: bio.trim() || undefined,
        opening_hours: openingHours.trim() || undefined,
        website_url: websiteUrl.trim() || undefined,
        facebook_link: facebookLink.trim() || undefined,
        instagram_link: instagramLink.trim() || undefined,
      };
      const updated = await updateRestaurantProfile(payload);
      if (updated) {
        setProfile(updated);
        Alert.alert('Profil enregistré', 'Les modifications ont bien été enregistrées.');
      } else {
        Alert.alert('Erreur', 'Impossible d\'enregistrer le profil. Réessayez.');
      }
    } catch {
      Alert.alert('Erreur', 'Impossible d\'enregistrer le profil. Réessayez.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) {
    return (
      <View style={styles.container}>
        <TopBar navigation={navigation} title="Profil restaurant" showBackButton onBackPress={() => navigation.goBack()} />
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
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => loadProfile(true)} colors={[Colors.primary]} />
      }>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations générales</Text>
        <Field label="Nom du restaurant" value={name} onChangeText={setName} placeholder="Nom" />
        <Field label="Description" value={description} onChangeText={setDescription} placeholder="Description" multiline />
        <Field label="Type de cuisine" value={cuisineType} onChangeText={setCuisineType} placeholder="Ex: Africain, Camerounais" />
        <Field label="Téléphone" value={phone} onChangeText={setPhone} placeholder="Téléphone" keyboardType="phone-pad" />
        <Field label="Email" value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" />
        <Field label="Adresse" value={address} onChangeText={setAddress} placeholder="Adresse complète" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tarifs</Text>
        <Field label="Frais de livraison (€)" value={deliveryFee} onChangeText={setDeliveryFee} placeholder="0.00" keyboardType="decimal-pad" />
        <Field label="Commande minimum (€)" value={minimumOrder} onChangeText={setMinimumOrder} placeholder="0.00" keyboardType="decimal-pad" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Horaires & Bio</Text>
        <Field label="Horaires d'ouverture" value={openingHours} onChangeText={setOpeningHours} placeholder="Ex: Lun-Ven 11h-22h" />
        <Field label="Bio" value={bio} onChangeText={setBio} placeholder="Présentation du restaurant" multiline />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Réseaux & site</Text>
        <Field label="Site web" value={websiteUrl} onChangeText={setWebsiteUrl} placeholder="https://..." keyboardType="url" />
        <Field label="Facebook" value={facebookLink} onChangeText={setFacebookLink} placeholder="Lien Facebook" keyboardType="url" />
        <Field label="Instagram" value={instagramLink} onChangeText={setInstagramLink} placeholder="Lien Instagram" keyboardType="url" />
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
      <TopBar navigation={navigation} title="Profil restaurant" showBackButton onBackPress={() => navigation.goBack()} />
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
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'decimal-pad' | 'url';
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
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
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
    minHeight: 80,
    textAlignVertical: 'top',
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

export default RestaurantProfileScreen;
