import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
} from 'react-native';
import TopBar from '../../components/TopBar';
import {Colors} from '../../utils/colors';
import {secondaryFont} from '../../utils/fonts';
import {
  getManagementCateringServices,
  createManagementCateringService,
  updateManagementCateringService,
  type ManagementCateringService,
  type CateringServiceCreatePayload,
} from '../../services/restaurantManagement';
import {formatAxiosError} from '../../utils/formatApiError';

const SERVICE_TYPES = [
  { value: 'buffet', label: 'Buffet' },
  { value: 'cocktail', label: 'Cocktail' },
  { value: 'seated_dinner', label: 'Dîner assis' },
  { value: 'catering_delivery', label: 'Livraison traiteur' },
];

const CateringOfferDetailScreen = ({navigation, route}: any) => {
  const serviceId = route.params?.serviceId as number | undefined;
  const isEdit = serviceId != null;

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [service_name, setServiceName] = useState('');
  const [service_description, setServiceDescription] = useState('');
  const [service_type, setServiceType] = useState('');
  const [base_price, setBasePrice] = useState('');
  const [price_per_person, setPricePerPerson] = useState('');
  const [min_guests, setMinGuests] = useState('10');
  const [max_guests, setMaxGuests] = useState('');
  const [delivery_available, setDeliveryAvailable] = useState(false);
  const [setup_available, setSetupAvailable] = useState(false);
  const [staff_available, setStaffAvailable] = useState(false);
  const [equipment_rental, setEquipmentRental] = useState(false);
  const [cancellation_policy, setCancellationPolicy] = useState('');
  const [is_active, setIsActive] = useState(true);
  const [featured, setFeatured] = useState(false);

  const loadService = useCallback(async () => {
    if (!serviceId) return;
    setLoading(true);
    try {
      const list = await getManagementCateringServices();
      const s = list.find((x) => x.id === serviceId);
      if (s) {
        setServiceName(s.service_name);
        setServiceDescription(s.service_description ?? '');
        setServiceType(s.service_type ?? '');
        setBasePrice(String(Number(s.base_price)));
        setPricePerPerson(s.price_per_person != null ? String(Number(s.price_per_person)) : '');
        setMinGuests(String(s.min_guests));
        setMaxGuests(s.max_guests != null ? String(s.max_guests) : '');
        setDeliveryAvailable(s.delivery_available ?? false);
        setSetupAvailable(s.setup_available ?? false);
        setStaffAvailable(s.staff_available ?? false);
        setEquipmentRental(s.equipment_rental ?? false);
        setCancellationPolicy(s.cancellation_policy ?? '');
        setIsActive(s.is_active !== false);
        setFeatured(s.featured ?? false);
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de charger l\'offre.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [serviceId, navigation]);

  useEffect(() => {
    loadService();
  }, [loadService]);

  const buildPayload = (): CateringServiceCreatePayload => ({
    service_name: service_name.trim(),
    service_description: service_description.trim() || undefined,
    service_type: service_type || undefined,
    base_price: parseFloat(base_price.replace(',', '.')) || 0,
    price_per_person:
      price_per_person.trim() !== ''
        ? parseFloat(price_per_person.replace(',', '.'))
        : undefined,
    min_guests: Math.max(1, parseInt(min_guests, 10) || 1),
    max_guests: max_guests.trim() !== '' ? parseInt(max_guests, 10) ?? undefined : undefined,
    delivery_available,
    setup_available,
    staff_available,
    equipment_rental,
    cancellation_policy: cancellation_policy.trim() || undefined,
    is_active,
    featured,
  });

  const handleSave = async () => {
    if (!service_name.trim()) {
      Alert.alert('Erreur', 'Nom de l\'offre requis.');
      return;
    }
    const base = parseFloat(base_price.replace(',', '.'));
    if (!Number.isFinite(base) || base < 0) {
      Alert.alert('Erreur', 'Prix de base invalide.');
      return;
    }
    const min = parseInt(min_guests, 10);
    if (!Number.isInteger(min) || min < 1) {
      Alert.alert('Erreur', 'Nombre min. de convives invalide (≥ 1).');
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit && serviceId) {
        await updateManagementCateringService(serviceId, buildPayload());
        Alert.alert('Succès', 'Offre mise à jour.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await createManagementCateringService(buildPayload());
        Alert.alert('Succès', 'Offre créée.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Erreur', formatAxiosError(e, 'Impossible d\'enregistrer.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar
          navigation={navigation}
          title={isEdit ? 'Modifier l\'offre' : 'Nouvelle offre traiteur'}
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar
        navigation={navigation}
        title={isEdit ? 'Modifier l\'offre' : 'Nouvelle offre traiteur'}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>Nom de l'offre *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex. Menu mariage, Buffet séminaire"
            placeholderTextColor={Colors.textLight}
            value={service_name}
            onChangeText={setServiceName}
          />
          <Text style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            {SERVICE_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[
                  styles.typeChip,
                  service_type === t.value && styles.typeChipActive,
                ]}
                onPress={() => setServiceType(service_type === t.value ? '' : t.value)}>
                <Text
                  style={[
                    styles.typeChipText,
                    service_type === t.value && styles.typeChipTextActive,
                  ]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.inputArea]}
            placeholder="Décrivez votre offre (formule, prestations…)"
            placeholderTextColor={Colors.textLight}
            value={service_description}
            onChangeText={setServiceDescription}
            multiline
            numberOfLines={4}
          />
          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Prix de base (€) *</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={Colors.textLight}
                keyboardType="decimal-pad"
                value={base_price}
                onChangeText={setBasePrice}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Prix / personne (€)</Text>
              <TextInput
                style={styles.input}
                placeholder="Optionnel"
                placeholderTextColor={Colors.textLight}
                keyboardType="decimal-pad"
                value={price_per_person}
                onChangeText={setPricePerPerson}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Convives min. *</Text>
              <TextInput
                style={styles.input}
                placeholder="10"
                placeholderTextColor={Colors.textLight}
                keyboardType="number-pad"
                value={min_guests}
                onChangeText={setMinGuests}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Convives max.</Text>
              <TextInput
                style={styles.input}
                placeholder="Optionnel"
                placeholderTextColor={Colors.textLight}
                keyboardType="number-pad"
                value={max_guests}
                onChangeText={setMaxGuests}
              />
            </View>
          </View>
          <Text style={styles.label}>Politique d'annulation</Text>
          <TextInput
            style={[styles.input, styles.inputArea]}
            placeholder="Ex. Annulation gratuite jusqu'à 7 jours avant"
            placeholderTextColor={Colors.textLight}
            value={cancellation_policy}
            onChangeText={setCancellationPolicy}
            multiline
          />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Livraison possible</Text>
            <Switch
              value={delivery_available}
              onValueChange={setDeliveryAvailable}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={delivery_available ? Colors.primary : Colors.textLight}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Installation sur place</Text>
            <Switch
              value={setup_available}
              onValueChange={setSetupAvailable}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={setup_available ? Colors.primary : Colors.textLight}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Personnel fourni</Text>
            <Switch
              value={staff_available}
              onValueChange={setStaffAvailable}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={staff_available ? Colors.primary : Colors.textLight}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Location matériel</Text>
            <Switch
              value={equipment_rental}
              onValueChange={setEquipmentRental}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={equipment_rental ? Colors.primary : Colors.textLight}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Offre active</Text>
            <Switch
              value={is_active}
              onValueChange={setIsActive}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={is_active ? Colors.primary : Colors.textLight}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Mise en avant</Text>
            <Switch
              value={featured}
              onValueChange={setFeatured}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={featured ? Colors.primary : Colors.textLight}
            />
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, submitting && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={submitting}>
            <Text style={styles.saveBtnText}>
              {submitting ? 'Enregistrement...' : isEdit ? 'Enregistrer' : 'Créer l\'offre'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  keyboard: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryDark,
    marginBottom: 8,
    fontFamily: secondaryFont,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.primaryDark,
    marginBottom: 16,
    backgroundColor: Colors.white,
  },
  inputArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeChipText: {
    fontSize: 14,
    color: Colors.primaryDark,
    fontFamily: secondaryFont,
  },
  typeChipTextActive: {
    color: Colors.white,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 4,
  },
  switchLabel: {
    fontSize: 16,
    color: Colors.primaryDark,
    fontFamily: secondaryFont,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: secondaryFont,
  },
});

export default CateringOfferDetailScreen;
