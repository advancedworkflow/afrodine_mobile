import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {alert} from '../../utils/alert';
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
import {getCateringFormulas, type CateringFormulaApi} from '../../services/catering';
import {DIETARY_IDS} from '../../utils/catering';

const toAmount = (value: string) => parseFloat(value.replace(',', '.')) || 0;

const SERVICE_TYPE_VALUES = ['buffet', 'cocktail', 'seated_dinner', 'catering_delivery'];

const CateringOfferDetailScreen = ({navigation, route}: any) => {
  const {t} = useTranslation();
  const SERVICE_TYPES = SERVICE_TYPE_VALUES.map((value) => ({
    value,
    label: t(`restaurantCateringOfferDetail.serviceTypes.${value}`),
  }));
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
  const [delivery_fee, setDeliveryFee] = useState('0');
  const [setup_fee, setSetupFee] = useState('0');
  const [equipment_fee, setEquipmentFee] = useState('0');
  const [staff_fee_per_hour, setStaffFeePerHour] = useState('0');
  const [min_notice_hours, setMinNoticeHours] = useState('24');
  const [deposit_percentage, setDepositPercentage] = useState('30');
  const [dietary_options, setDietaryOptions] = useState<string[]>([]);
  const [formula_id, setFormulaId] = useState<number | null>(null);
  const [formulas, setFormulas] = useState<CateringFormulaApi[]>([]);

  useEffect(() => {
    getCateringFormulas().then(setFormulas).catch(() => setFormulas([]));
  }, []);

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
        setDeliveryFee(String(Number(s.delivery_fee ?? 0)));
        setSetupFee(String(Number(s.setup_fee ?? 0)));
        setEquipmentFee(String(Number(s.equipment_fee ?? 0)));
        setStaffFeePerHour(String(Number(s.staff_fee_per_hour ?? 0)));
        setMinNoticeHours(String(s.min_notice_hours ?? 24));
        setDepositPercentage(String(Number(s.deposit_percentage ?? 30)));
        setDietaryOptions(Array.isArray(s.dietary_options) ? s.dietary_options : []);
        setFormulaId(s.formula_id ?? null);
      }
    } catch {
      alert(t('restaurantCateringOfferDetail.errorTitle'), t('restaurantCateringOfferDetail.loadFailed'));
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
    // Frais facturés au client si l'option est proposée (0 sinon, comme sur le web)
    delivery_fee: delivery_available ? toAmount(delivery_fee) : 0,
    setup_fee: setup_available ? toAmount(setup_fee) : 0,
    equipment_fee: equipment_rental ? toAmount(equipment_fee) : 0,
    staff_fee_per_hour: staff_available ? toAmount(staff_fee_per_hour) : 0,
    min_notice_hours: Math.max(0, parseInt(min_notice_hours, 10) || 0),
    deposit_percentage: toAmount(deposit_percentage),
    dietary_options,
    formula_id,
    cancellation_policy: cancellation_policy.trim() || undefined,
    is_active,
    featured,
  });

  const toggleDietary = (id: string) =>
    setDietaryOptions((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));

  // Champ de frais affiché sous l'interrupteur de l'option quand elle est proposée
  const renderFeeInput = (value: string, onChange: (v: string) => void, labelKey: string) => (
    <View style={styles.feeRow}>
      <Text style={styles.feeLabel}>{t(labelKey)}</Text>
      <TextInput
        style={[styles.input, styles.feeInput]}
        placeholder="0"
        placeholderTextColor={Colors.textLight}
        keyboardType="decimal-pad"
        value={value}
        onChangeText={onChange}
      />
    </View>
  );

  const handleSave = async () => {
    if (!service_name.trim()) {
      alert(t('restaurantCateringOfferDetail.errorTitle'), t('restaurantCateringOfferDetail.nameRequired'));
      return;
    }
    const base = parseFloat(base_price.replace(',', '.'));
    if (!Number.isFinite(base) || base < 0) {
      alert(t('restaurantCateringOfferDetail.errorTitle'), t('restaurantCateringOfferDetail.invalidBasePrice'));
      return;
    }
    const min = parseInt(min_guests, 10);
    if (!Number.isInteger(min) || min < 1) {
      alert(t('restaurantCateringOfferDetail.errorTitle'), t('restaurantCateringOfferDetail.invalidMinGuests'));
      return;
    }
    const deposit = parseFloat(deposit_percentage.replace(',', '.'));
    if (!Number.isFinite(deposit) || deposit < 0 || deposit > 100) {
      alert(t('restaurantCateringOfferDetail.errorTitle'), t('restaurantCateringOfferDetail.invalidDeposit'));
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit && serviceId) {
        await updateManagementCateringService(serviceId, buildPayload());
        alert(t('restaurantCateringOfferDetail.successTitle'), t('restaurantCateringOfferDetail.updateSuccess'), [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await createManagementCateringService(buildPayload());
        alert(t('restaurantCateringOfferDetail.successTitle'), t('restaurantCateringOfferDetail.createSuccess'), [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e: any) {
      alert(t('restaurantCateringOfferDetail.errorTitle'), formatAxiosError(e, t('restaurantCateringOfferDetail.saveFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar
          navigation={navigation}
          title={isEdit ? t('restaurantCateringOfferDetail.editTitle') : t('restaurantCateringOfferDetail.createTitle')}
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.darkGreen} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar
        navigation={navigation}
        title={isEdit ? t('restaurantCateringOfferDetail.editTitle') : t('restaurantCateringOfferDetail.createTitle')}
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
          <Text style={styles.label}>{t('restaurantCateringOfferDetail.nameLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('restaurantCateringOfferDetail.namePlaceholder')}
            placeholderTextColor={Colors.textLight}
            value={service_name}
            onChangeText={setServiceName}
          />
          <Text style={styles.label}>{t('restaurantCateringOfferDetail.typeLabel')}</Text>
          <View style={styles.typeRow}>
            {SERVICE_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeChip,
                  service_type === type.value && styles.typeChipActive,
                ]}
                onPress={() => setServiceType(service_type === type.value ? '' : type.value)}>
                <Text
                  style={[
                    styles.typeChipText,
                    service_type === type.value && styles.typeChipTextActive,
                  ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>{t('restaurantCateringOfferDetail.descriptionLabel')}</Text>
          <TextInput
            style={[styles.input, styles.inputArea]}
            placeholder={t('restaurantCateringOfferDetail.descriptionPlaceholder')}
            placeholderTextColor={Colors.textLight}
            value={service_description}
            onChangeText={setServiceDescription}
            multiline
            numberOfLines={4}
          />
          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>{t('restaurantCateringOfferDetail.basePriceLabel')}</Text>
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
              <Text style={styles.label}>{t('restaurantCateringOfferDetail.pricePerPersonLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('restaurantCateringOfferDetail.optional')}
                placeholderTextColor={Colors.textLight}
                keyboardType="decimal-pad"
                value={price_per_person}
                onChangeText={setPricePerPerson}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>{t('restaurantCateringOfferDetail.minGuestsLabel')}</Text>
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
              <Text style={styles.label}>{t('restaurantCateringOfferDetail.maxGuestsLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('restaurantCateringOfferDetail.optional')}
                placeholderTextColor={Colors.textLight}
                keyboardType="number-pad"
                value={max_guests}
                onChangeText={setMaxGuests}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>{t('restaurantCateringOfferDetail.minNoticeLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder="24"
                placeholderTextColor={Colors.textLight}
                keyboardType="number-pad"
                value={min_notice_hours}
                onChangeText={setMinNoticeHours}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>{t('restaurantCateringOfferDetail.depositLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder="30"
                placeholderTextColor={Colors.textLight}
                keyboardType="decimal-pad"
                value={deposit_percentage}
                onChangeText={setDepositPercentage}
              />
            </View>
          </View>
          {formulas.length > 0 && (
            <>
              <Text style={styles.label}>{t('restaurantCateringOfferDetail.formulaLabel')}</Text>
              <View style={styles.typeRow}>
                {formulas.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.typeChip, formula_id === f.id && styles.typeChipActive]}
                    onPress={() => setFormulaId(formula_id === f.id ? null : f.id)}>
                    <Text style={[styles.typeChipText, formula_id === f.id && styles.typeChipTextActive]}>{f.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.hint}>{t('restaurantCateringOfferDetail.formulaHint')}</Text>
            </>
          )}
          <Text style={styles.label}>{t('restaurantCateringOfferDetail.dietaryLabel')}</Text>
          <View style={styles.typeRow}>
            {DIETARY_IDS.map((id) => (
              <TouchableOpacity
                key={id}
                style={[styles.typeChip, dietary_options.includes(id) && styles.typeChipActive]}
                onPress={() => toggleDietary(id)}>
                <Text style={[styles.typeChipText, dietary_options.includes(id) && styles.typeChipTextActive]}>
                  {t(`catering.dietaryOptions.${id}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>{t('restaurantCateringOfferDetail.cancellationPolicyLabel')}</Text>
          <TextInput
            style={[styles.input, styles.inputArea]}
            placeholder={t('restaurantCateringOfferDetail.cancellationPolicyPlaceholder')}
            placeholderTextColor={Colors.textLight}
            value={cancellation_policy}
            onChangeText={setCancellationPolicy}
            multiline
          />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('restaurantCateringOfferDetail.deliveryAvailable')}</Text>
            <Switch
              value={delivery_available}
              onValueChange={setDeliveryAvailable}
              trackColor={{ false: Colors.border, true: Colors.olive }}
              thumbColor={delivery_available ? Colors.darkGreen : Colors.textLight}
            />
          </View>
          {delivery_available && renderFeeInput(delivery_fee, setDeliveryFee, 'restaurantCateringOfferDetail.deliveryFeeLabel')}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('restaurantCateringOfferDetail.setupAvailable')}</Text>
            <Switch
              value={setup_available}
              onValueChange={setSetupAvailable}
              trackColor={{ false: Colors.border, true: Colors.olive }}
              thumbColor={setup_available ? Colors.darkGreen : Colors.textLight}
            />
          </View>
          {setup_available && renderFeeInput(setup_fee, setSetupFee, 'restaurantCateringOfferDetail.setupFeeLabel')}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('restaurantCateringOfferDetail.staffAvailable')}</Text>
            <Switch
              value={staff_available}
              onValueChange={setStaffAvailable}
              trackColor={{ false: Colors.border, true: Colors.olive }}
              thumbColor={staff_available ? Colors.darkGreen : Colors.textLight}
            />
          </View>
          {staff_available && renderFeeInput(staff_fee_per_hour, setStaffFeePerHour, 'restaurantCateringOfferDetail.staffFeeLabel')}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('restaurantCateringOfferDetail.equipmentRental')}</Text>
            <Switch
              value={equipment_rental}
              onValueChange={setEquipmentRental}
              trackColor={{ false: Colors.border, true: Colors.olive }}
              thumbColor={equipment_rental ? Colors.darkGreen : Colors.textLight}
            />
          </View>
          {equipment_rental && renderFeeInput(equipment_fee, setEquipmentFee, 'restaurantCateringOfferDetail.equipmentFeeLabel')}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('restaurantCateringOfferDetail.isActive')}</Text>
            <Switch
              value={is_active}
              onValueChange={setIsActive}
              trackColor={{ false: Colors.border, true: Colors.olive }}
              thumbColor={is_active ? Colors.darkGreen : Colors.textLight}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('restaurantCateringOfferDetail.featured')}</Text>
            <Switch
              value={featured}
              onValueChange={setFeatured}
              trackColor={{ false: Colors.border, true: Colors.olive }}
              thumbColor={featured ? Colors.darkGreen : Colors.textLight}
            />
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, submitting && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={submitting}>
            <Text style={styles.saveBtnText}>
              {submitting
                ? t('restaurantCateringOfferDetail.saving')
                : isEdit
                ? t('restaurantCateringOfferDetail.save')
                : t('restaurantCateringOfferDetail.createButton')}
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
    color: Colors.darkGreen,
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
    color: Colors.darkGreen,
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
    backgroundColor: Colors.darkGreen,
    borderColor: Colors.darkGreen,
  },
  typeChipText: {
    fontSize: 14,
    color: Colors.darkGreen,
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
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
  },
  saveBtn: {
    backgroundColor: Colors.darkGreen,
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
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
    paddingLeft: 8,
  },
  feeLabel: {
    flex: 1,
    fontSize: 13,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  feeInput: {
    width: 110,
    marginBottom: 0,
  },
  hint: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: secondaryFont,
    marginTop: 6,
  },
});

export default CateringOfferDetailScreen;
