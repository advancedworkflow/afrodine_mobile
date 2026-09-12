import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import {alert} from '../utils/alert';
import IconWrapper from '../components/IconWrapper';
import {Colors, Radius} from '../utils/colors';
import {fontButton, fontDisplay, fontDisplayMedium, fontHeading, fontUI} from '../utils/fonts';
import {
  getCateringFormulaBySlug,
  getCateringFormulaCooks,
  createCateringBooking,
  type CateringFormulaApi,
  type CateringFormulaCookApi,
} from '../services/catering';
import {getAbsoluteImageUrl} from '../utils/api';
import {useAuth} from '../contexts/AuthContext';
import {formatAxiosError} from '../utils/formatApiError';

const namkeFallback = require('../assets/namke-fallback.png');

const CateringFormulaDetailScreen = ({navigation, route}: any) => {
  const {slug} = route.params || {};
  const {user, isAuthenticated} = useAuth();
  const [formula, setFormula] = useState<CateringFormulaApi | null>(null);
  const [cooks, setCooks] = useState<CateringFormulaCookApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestCount, setGuestCount] = useState(1);
  const [selectedDishes, setSelectedDishes] = useState<string[]>([]);
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [data, cooksList] = await Promise.all([
          getCateringFormulaBySlug(slug),
          getCateringFormulaCooks(slug),
        ]);
        if (cancelled) return;
        setFormula(data);
        setCooks(cooksList);
        if (data) setGuestCount(data.min_guests ?? 1);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (isAuthenticated && user?.email) setContactEmail(user.email);
  }, [isAuthenticated, user?.email]);

  const selectableDishes = useMemo(
    () => (formula?.menu_options ?? []).filter(d => d.selectable),
    [formula],
  );
  const includedItems = useMemo(
    () => (formula?.menu_options ?? []).filter(d => !d.selectable),
    [formula],
  );
  const choiceCount = formula?.menu_choice_count ?? 0;

  const toggleDish = (key: string) => {
    setSelectedDishes(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key);
      if (choiceCount > 0 && prev.length >= choiceCount) {
        alert('Trois plats au maximum', `Choisissez ${choiceCount} plats — retirez-en un d'abord.`);
        return prev;
      }
      return [...prev, key];
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (!formula) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Formule introuvable</Text>
        </View>
      </View>
    );
  }

  const minGuests = formula.min_guests ?? 1;
  const maxGuests = formula.max_guests;
  const pricePerPerson = Number(formula.price_per_person);
  const estimatedTotal = pricePerPerson * guestCount;

  const handleSubmit = async () => {
    if (choiceCount > 0 && selectedDishes.length < choiceCount) {
      alert('Menu incomplet', `Choisissez ${choiceCount} plats avant d'envoyer la demande.`);
      return;
    }
    if (!eventDate.trim() || !eventTime.trim()) {
      alert('Erreur', "Merci d'indiquer la date et l'heure de votre événement.");
      return;
    }
    if (!contactEmail.trim()) {
      alert('Erreur', "Merci d'indiquer un e-mail de contact.");
      return;
    }
    setSubmitting(true);
    try {
      await createCateringBooking({
        formula_id: formula.id,
        event_date: eventDate.trim(),
        event_time: eventTime.trim(),
        guest_count: guestCount,
        customer_id: isAuthenticated && user?.id ? user.id : undefined,
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim() || undefined,
        special_requests: specialRequests.trim() || undefined,
        selected_dishes: selectedDishes.length > 0 ? selectedDishes : undefined,
      });
      alert('Demande envoyée', 'Un cuisinier proposant cette formule vous répondra sous 24 h avec un devis confirmé.');
      navigation.goBack();
    } catch (e: any) {
      alert('Erreur', formatAxiosError(e, "Impossible d'envoyer la demande. Vérifiez le format de la date (AAAA-MM-JJ) et de l'heure (HH:mm)."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageContainer}>
          <Image
            source={formula.image_url ? {uri: getAbsoluteImageUrl(formula.image_url) ?? formula.image_url} : namkeFallback}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <IconWrapper name="arrow-back-outline" size={22} color={Colors.darkGreen} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {formula.tagline && (
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{formula.tagline}</Text>
            </View>
          )}
          <View style={styles.titleRow}>
            <Text style={styles.name}>{formula.name}</Text>
            <Text style={styles.headerPrice}>
              {formula.is_custom_price ? 'Sur devis' : `${pricePerPerson.toFixed(0)} €`}
            </Text>
          </View>
          <Text style={styles.metaLine}>{minGuests} à {maxGuests} convives</Text>
          {formula.description ? (
            <Text style={styles.description}>{formula.description}</Text>
          ) : null}

          {formula.includes && formula.includes.length > 0 && (
            <View style={styles.block}>
              <Text style={styles.blockLabel}>Compris dans le prix</Text>
              {formula.includes.map((item, idx) => (
                <View key={idx} style={styles.includeRow}>
                  <IconWrapper name="checkmark" size={14} color={Colors.olive} />
                  <Text style={styles.includeText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {selectableDishes.length > 0 && (
            <View style={styles.block}>
              <View style={styles.menuHeaderRow}>
                <Text style={styles.blockLabel}>Le menu, à composer</Text>
                <Text style={styles.menuCount}>{selectedDishes.length} / {choiceCount} choisis</Text>
              </View>
              {includedItems.filter(i => i.category === 'entree').map(item => (
                <View key={item.key} style={styles.includedDishRow}>
                  <Text style={styles.includedDishName}>{item.name}</Text>
                  <Text style={styles.includedDishTag}>Entrée · incluse</Text>
                </View>
              ))}
              {selectableDishes.map(dish => {
                const on = selectedDishes.includes(dish.key);
                return (
                  <TouchableOpacity
                    key={dish.key}
                    style={[styles.dishRow, on && styles.dishRowActive]}
                    onPress={() => toggleDish(dish.key)}
                    activeOpacity={0.85}>
                    <View style={styles.dishRowInfo}>
                      <Text style={styles.dishRowName}>{dish.name}</Text>
                      {dish.description ? <Text style={styles.dishRowDescription}>{dish.description}</Text> : null}
                    </View>
                    <View style={[styles.dishMark, on && styles.dishMarkActive]}>
                      {on && <IconWrapper name="checkmark" size={13} color={Colors.cream} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
              {includedItems.filter(i => i.category !== 'entree').map(item => (
                <View key={item.key} style={styles.includedDishRow}>
                  <Text style={styles.includedDishName}>{item.name}</Text>
                  {item.description ? <Text style={styles.includedDishTag}>{item.description}</Text> : null}
                </View>
              ))}
            </View>
          )}

          {cooks.length > 0 && (
            <View style={styles.block}>
              <Text style={styles.blockLabel}>Les cuisiniers de cette formule</Text>
              {cooks.map(cook => (
                <TouchableOpacity
                  key={cook.id}
                  style={styles.cookRow}
                  onPress={() => navigation.navigate('RestaurantDetails', {restaurantId: cook.id})}
                  activeOpacity={0.85}>
                  <Image
                    source={cook.image_url ? {uri: getAbsoluteImageUrl(cook.image_url) ?? cook.image_url} : namkeFallback}
                    style={styles.cookAvatar}
                    resizeMode="cover"
                  />
                  <View style={styles.cookInfo}>
                    <Text style={styles.cookName}>{cook.name}</Text>
                    <Text style={styles.cookMeta} numberOfLines={1}>
                      {[cook.cuisine_type, cook.city].filter(Boolean).join(' · ')}
                      {cook.rating != null ? ` · ★ ${cook.rating}` : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.block}>
            <View style={styles.guestsHeaderRow}>
              <Text style={styles.blockLabel}>Convives</Text>
              <Text style={styles.guestsValue}>{guestCount}</Text>
            </View>
            <View style={styles.guestsStepper}>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => setGuestCount(Math.max(minGuests, guestCount - 1))}>
                <IconWrapper name="remove-outline" size={18} color={Colors.darkGreen} />
              </TouchableOpacity>
              <View style={styles.stepperTrack}>
                <View
                  style={[
                    styles.stepperFill,
                    {
                      width: `${Math.min(
                        100,
                        ((guestCount - minGuests) / Math.max(1, maxGuests - minGuests)) * 100,
                      )}%`,
                    },
                  ]}
                />
              </View>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => setGuestCount(Math.min(maxGuests, guestCount + 1))}>
                <IconWrapper name="add-outline" size={18} color={Colors.darkGreen} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.block}>
            <Text style={styles.blockLabel}>Votre événement</Text>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldPill, styles.fieldPillHalf]}>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Date (AAAA-MM-JJ)"
                  placeholderTextColor={Colors.textLight}
                  value={eventDate}
                  onChangeText={setEventDate}
                />
              </View>
              <View style={[styles.fieldPill, styles.fieldPillHalf]}>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Heure (HH:mm)"
                  placeholderTextColor={Colors.textLight}
                  value={eventTime}
                  onChangeText={setEventTime}
                />
              </View>
            </View>
            <View style={styles.fieldPill}>
              <TextInput
                style={styles.fieldInput}
                placeholder="E-mail de contact"
                placeholderTextColor={Colors.textLight}
                value={contactEmail}
                onChangeText={setContactEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.fieldPill}>
              <TextInput
                style={styles.fieldInput}
                placeholder="Téléphone (optionnel)"
                placeholderTextColor={Colors.textLight}
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
              />
            </View>
            <View style={[styles.fieldPill, styles.fieldPillArea]}>
              <TextInput
                style={[styles.fieldInput, styles.fieldTextArea]}
                placeholder="Demandes particulières (optionnel)"
                placeholderTextColor={Colors.textLight}
                value={specialRequests}
                onChangeText={setSpecialRequests}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <View style={styles.estimateBox}>
            <View style={styles.estimateRow}>
              <Text style={styles.estimateLabel}>
                Repas · {guestCount} × {pricePerPerson.toFixed(2)} €
              </Text>
              <Text style={styles.estimateValue}>{estimatedTotal.toFixed(2)} €</Text>
            </View>
            <View style={[styles.estimateRow, styles.estimateTotalRow]}>
              <Text style={styles.estimateTotalLabel}>Estimation</Text>
              <Text style={styles.estimateTotalValue}>{estimatedTotal.toFixed(2)} €</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}>
          {submitting ? (
            <ActivityIndicator size="small" color={Colors.namkeWhite} />
          ) : (
            <Text style={styles.submitButtonText}>Demander ce devis</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textLight,
    fontFamily: fontUI,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  imageContainer: {
    height: 250,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.gray[100],
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 20,
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(252,251,245,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 22,
    gap: 16,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.mustard,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  typeBadgeText: {
    fontSize: 10.5,
    fontFamily: fontHeading,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.namkeBlack,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  name: {
    flex: 1,
    fontSize: 26,
    fontFamily: fontDisplay,
    color: Colors.text,
  },
  headerPrice: {
    fontSize: 22,
    fontFamily: fontDisplay,
    color: Colors.text,
  },
  metaLine: {
    fontSize: 13,
    fontFamily: fontHeading,
    color: Colors.textLight,
  },
  description: {
    fontSize: 14.5,
    fontFamily: fontUI,
    color: Colors.text,
    lineHeight: 21,
  },
  block: {
    gap: 9,
  },
  blockLabel: {
    fontSize: 12.5,
    fontFamily: fontHeading,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.textLight,
  },
  includeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  includeText: {
    fontSize: 14,
    fontFamily: fontUI,
    color: Colors.text,
    flex: 1,
  },
  menuHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuCount: {
    fontSize: 12.5,
    fontFamily: fontUI,
    color: Colors.textLight,
  },
  includedDishRow: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  includedDishName: {
    fontSize: 14.5,
    fontFamily: fontDisplayMedium,
    color: Colors.text,
  },
  includedDishTag: {
    fontSize: 12,
    fontFamily: fontUI,
    color: Colors.textLight,
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  dishRowActive: {
    borderWidth: 2,
    borderColor: Colors.darkGreen,
    backgroundColor: Colors.surface,
  },
  dishRowInfo: {
    flex: 1,
    gap: 2,
  },
  dishRowName: {
    fontSize: 14.5,
    fontFamily: fontDisplayMedium,
    color: Colors.text,
  },
  dishRowDescription: {
    fontSize: 12,
    fontFamily: fontUI,
    color: Colors.textLight,
  },
  dishMark: {
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dishMarkActive: {
    backgroundColor: Colors.darkGreen,
    borderColor: Colors.darkGreen,
  },
  cookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 22,
    padding: 14,
  },
  cookAvatar: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: Colors.gray[100],
  },
  cookInfo: {
    flex: 1,
    gap: 2,
  },
  cookName: {
    fontSize: 15.5,
    fontFamily: fontDisplayMedium,
    color: Colors.text,
  },
  cookMeta: {
    fontSize: 12.5,
    fontFamily: fontUI,
    color: Colors.textLight,
  },
  guestsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  guestsValue: {
    fontSize: 18,
    fontFamily: fontDisplayMedium,
    color: Colors.text,
  },
  guestsStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperTrack: {
    flex: 1,
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  stepperFill: {
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.terracotta,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldPill: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: 18,
    minHeight: 52,
    justifyContent: 'center',
  },
  fieldPillHalf: {
    flex: 1,
  },
  fieldPillArea: {
    borderRadius: Radius.lg,
    paddingVertical: 12,
  },
  fieldInput: {
    fontSize: 14.5,
    fontFamily: fontUI,
    color: Colors.text,
    padding: 0,
  },
  fieldTextArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  estimateBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 18,
    gap: 8,
  },
  estimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  estimateLabel: {
    fontSize: 13.5,
    fontFamily: fontUI,
    color: Colors.textLight,
  },
  estimateValue: {
    fontSize: 13.5,
    fontFamily: fontUI,
    color: Colors.text,
  },
  estimateTotalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
    alignItems: 'baseline',
  },
  estimateTotalLabel: {
    fontSize: 13.5,
    fontFamily: fontUI,
    color: Colors.text,
  },
  estimateTotalValue: {
    fontSize: 20,
    fontFamily: fontDisplay,
    color: Colors.text,
  },
  bottomBar: {
    padding: 22,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  submitButton: {
    backgroundColor: Colors.terracotta,
    borderRadius: Radius.pill,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: fontButton,
    color: Colors.namkeWhite,
  },
});

export default CateringFormulaDetailScreen;
