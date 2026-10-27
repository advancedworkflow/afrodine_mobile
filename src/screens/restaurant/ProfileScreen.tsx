import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {alert} from '../../utils/alert';
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
  const {t} = useTranslation();
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
        alert(t('restaurantProfile.savedTitle'), t('restaurantProfile.savedMessage'));
      } else {
        alert(t('restaurantProfile.errorTitle'), t('restaurantProfile.errorMessage'));
      }
    } catch {
      alert(t('restaurantProfile.errorTitle'), t('restaurantProfile.errorMessage'));
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) {
    return (
      <View style={styles.container}>
        <TopBar navigation={navigation} title={t('restaurantProfile.title')} showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.darkGreen} />
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
        <RefreshControl refreshing={refreshing} onRefresh={() => loadProfile(true)} colors={[Colors.darkGreen]} />
      }>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('restaurantProfile.generalInfo')}</Text>
        <Field label={t('restaurantProfile.restaurantName')} value={name} onChangeText={setName} placeholder={t('restaurantProfile.namePlaceholder')} />
        <Field label={t('restaurantProfile.description')} value={description} onChangeText={setDescription} placeholder={t('restaurantProfile.description')} multiline />
        <Field label={t('restaurantProfile.cuisineType')} value={cuisineType} onChangeText={setCuisineType} placeholder={t('restaurantProfile.cuisineTypePlaceholder')} />
        <Field label={t('restaurantProfile.phone')} value={phone} onChangeText={setPhone} placeholder={t('restaurantProfile.phone')} keyboardType="phone-pad" />
        <Field label={t('restaurantProfile.email')} value={email} onChangeText={setEmail} placeholder={t('restaurantProfile.email')} keyboardType="email-address" />
        <Field label={t('restaurantProfile.address')} value={address} onChangeText={setAddress} placeholder={t('restaurantProfile.addressPlaceholder')} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('restaurantProfile.pricing')}</Text>
        <Field label={t('restaurantProfile.deliveryFee')} value={deliveryFee} onChangeText={setDeliveryFee} placeholder="0.00" keyboardType="decimal-pad" />
        <Field label={t('restaurantProfile.minimumOrder')} value={minimumOrder} onChangeText={setMinimumOrder} placeholder="0.00" keyboardType="decimal-pad" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('restaurantProfile.hoursAndBio')}</Text>
        <Field label={t('restaurantProfile.openingHours')} value={openingHours} onChangeText={setOpeningHours} placeholder={t('restaurantProfile.openingHoursPlaceholder')} />
        <Field label={t('restaurantProfile.bio')} value={bio} onChangeText={setBio} placeholder={t('restaurantProfile.bioPlaceholder')} multiline />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('restaurantProfile.socialAndWebsite')}</Text>
        <Field label={t('restaurantProfile.website')} value={websiteUrl} onChangeText={setWebsiteUrl} placeholder="https://..." keyboardType="url" />
        <Field label={t('restaurantProfile.facebook')} value={facebookLink} onChangeText={setFacebookLink} placeholder={t('restaurantProfile.facebookPlaceholder')} keyboardType="url" />
        <Field label={t('restaurantProfile.instagram')} value={instagramLink} onChangeText={setInstagramLink} placeholder={t('restaurantProfile.instagramPlaceholder')} keyboardType="url" />
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
            <Text style={styles.saveButtonText}>{t('restaurantProfile.saveChanges')}</Text>
          </>
        )}
      </TouchableOpacity>
      <View style={styles.bottomPad} />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <TopBar navigation={navigation} title={t('restaurantProfile.title')} showBackButton onBackPress={() => navigation.goBack()} />
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
    color: Colors.darkGreen,
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.darkGreen,
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
