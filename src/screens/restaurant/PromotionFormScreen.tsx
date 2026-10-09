import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
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
  createManagementPromotion,
  updateManagementPromotion,
  getRestaurantDishes,
  getRestaurantMenus,
  uploadManagementImage,
  uploadManagementImageFile,
  type ManagementPromotion,
  type ManagementDish,
  type MenuRead,
  type PromotionCreatePayload,
} from '../../services/restaurantManagement';
import {formatAxiosError} from '../../utils/formatApiError';
import {
  calculatePromotionPrice,
  formatPromotionPrice,
  getFormatDescription,
  DISPLAY_FORMATS,
  DURATION_OPTIONS,
  type DisplayFormat,
  type MediaType,
} from '../../utils/promotionPricing';

// react-native-image-picker n'existe pas sur le build web (react-native-web) — chargé
// uniquement sur Android/iOS, comme pour notificationService.ts.
const ImagePicker = Platform.OS !== 'web' ? require('react-native-image-picker') : null;

const PromotionFormScreen = ({navigation, route}: any) => {
  const {t} = useTranslation();
  const labelName = (v: string) =>
    v === '' ? t('restaurantPromotionForm.labelNone')
      : v === 'offre_du_jour' ? t('restaurantPromotionForm.labelDealOfDay')
      : t('restaurantPromotionForm.labelNew');
  const promotionTypeName = (v: string) =>
    v === 'percentage' ? t('restaurantPromotionForm.typePercentage')
      : v === 'fixed_amount' ? t('restaurantPromotionForm.typeFixed')
      : t('restaurantPromotionForm.typeFlash');
  const promotion = route.params?.promotion as ManagementPromotion | undefined;
  const isEdit = promotion != null;

  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [targetType, setTargetType] = useState<'dish' | 'menu'>('dish');
  const [dishIds, setDishIds] = useState<number[]>([]);
  const [menuIds, setMenuIds] = useState<number[]>([]);
  const [displayFormat, setDisplayFormat] = useState<DisplayFormat>('section');
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [slideDuration, setSlideDuration] = useState(5);
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [label, setLabel] = useState('');
  const [layoutType, setLayoutType] = useState<'dish' | 'menu'>('dish');
  const [ctaType, setCtaType] = useState('discover');
  const [ctaText, setCtaText] = useState(t('restaurantPromotionForm.ctaDiscover'));
  const [promotionType, setPromotionType] = useState('percentage');
  const [dishes, setDishes] = useState<ManagementDish[]>([]);
  const [menus, setMenus] = useState<MenuRead[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<any>(null);

  const canUseVideo = displayFormat === 'floating_left' || displayFormat === 'section';
  const effectiveMediaType = canUseVideo ? mediaType : 'image';
  const estimatedPrice = calculatePromotionPrice(displayFormat, slideDuration, effectiveMediaType);

  useEffect(() => {
    if (promotion) {
      const p = promotion as any;
      const mediaUrl = p.media_url ?? p.image_url ?? '';
      const mt = p.media_type === 'video' ? 'video' : 'image';
      setTitle(promotion.title ?? '');
      setShortDescription(p.short_description ?? '');
      setDescription(promotion.description ?? '');
      setOriginalPrice(
        promotion.original_price != null ? String(promotion.original_price) : '',
      );
      setDiscountPercent(
        promotion.discount_percentage != null
          ? String(promotion.discount_percentage)
          : '',
      );
      setStartDate(promotion.start_date?.slice(0, 10) ?? '');
      setEndDate(promotion.end_date?.slice(0, 10) ?? '');
      if (mt === 'video') {
        setVideoUrl(mediaUrl);
        setImageUrl('');
      } else {
        setImageUrl(mediaUrl);
        setVideoUrl('');
      }
      const df = p.display_format;
      if (df === 'floating_left' || df === 'top_banner' || df === 'section') {
        setDisplayFormat(df);
      }
      if (mt === 'image' || mt === 'video') setMediaType(mt);
      const sd = p.slide_duration;
      if (typeof sd === 'number' && sd >= 5 && sd <= 30) setSlideDuration(sd);
      setBackgroundColor(p.background_color ?? '#FFFFFF');
      setLabel(p.label ?? '');
      setLayoutType((p.layout_type as 'dish' | 'menu') ?? 'dish');
      setCtaType(p.cta_type ?? 'discover');
      setCtaText(p.cta_label ?? p.cta_text ?? t('restaurantPromotionForm.ctaDiscover'));
      setPromotionType(p.promotion_type === 'discount' ? 'percentage' : (p.promotion_type ?? 'percentage'));
      if (p.dish_ids?.length) {
        setTargetType('dish');
        setDishIds([p.dish_ids[0]]);
        setMenuIds([]);
      } else if (p.menu_ids?.length) {
        setTargetType('menu');
        setMenuIds([p.menu_ids[0]]);
        setDishIds([]);
      } else if (p.dishes?.length) {
        setTargetType('dish');
        setDishIds([p.dishes[0].dish_id ?? p.dishes[0].id]);
        setMenuIds([]);
      } else if (p.menus?.length) {
        setTargetType('menu');
        setMenuIds([p.menus[0].menu_id ?? p.menus[0].id]);
        setDishIds([]);
      }
    }
  }, [promotion]);

  useEffect(() => {
    let cancelled = false;
    setLoadingData(true);
    Promise.all([getRestaurantDishes(), getRestaurantMenus()])
      .then(([d, m]) => {
        if (!cancelled) {
          setDishes(Array.isArray(d) ? d : []);
          setMenus(Array.isArray(m) ? m : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDishes([]);
          setMenus([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Web (react-native-web) : input file caché, comme dans GroceryProductFormScreen.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const doc = (globalThis as any).document;
    if (!doc?.createElement) return;
    const input = doc.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    input.onchange = async (e: any) => {
      const target = e?.target;
      const file: File | undefined = target?.files?.[0];
      if (!file || !file.type?.startsWith('image/')) return;
      setUploadingImage(true);
      try {
        const {image_url} = await uploadManagementImageFile(file, 'promotions');
        setImageUrl(image_url || '');
      } catch {
        alert(t('restaurantPromotionForm.errorTitle'), t('restaurantPromotionForm.uploadError'));
      } finally {
        setUploadingImage(false);
        if (target) target.value = '';
      }
    };
    doc.body.appendChild(input);
    fileInputRef.current = input;
    return () => {
      try {
        doc.body.removeChild(input);
      } catch (_) {}
      fileInputRef.current = null;
    };
  }, []);

  const handlePickImage = () => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
      return;
    }
    ImagePicker.launchImageLibrary(
      {mediaType: 'photo', quality: 0.8},
      async (response: any) => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (!asset?.uri) return;
        setUploadingImage(true);
        try {
          const {image_url} = await uploadManagementImage(
            asset.uri,
            asset.fileName || 'promotion.jpg',
            asset.type || 'image/jpeg',
            'promotions',
          );
          setImageUrl(image_url || '');
        } catch {
          alert(t('restaurantPromotionForm.errorTitle'), t('restaurantPromotionForm.uploadError'));
        } finally {
          setUploadingImage(false);
        }
      },
    );
  };

  const selectDish = (id: number) => {
    setDishIds(prev => (prev.includes(id) ? [] : [id]));
  };
  const selectMenu = (id: number) => {
    setMenuIds(prev => (prev.includes(id) ? [] : [id]));
  };

  // Payload aligné sur le schéma API PromotionCreate (media_url, cta_label, fixed_discount_amount, pas de short_description/image_url/video_url/slide_duration/etc.)
  const buildPayload = (): PromotionCreatePayload => {
    const orig = parseFloat(originalPrice.replace(',', '.')) || 0;
    const pct = parseFloat(discountPercent.replace(',', '.')) || 0;
    const mediaUrl = effectiveMediaType === 'video' ? (videoUrl.trim() || undefined) : (imageUrl.trim() || undefined);
    const payload: PromotionCreatePayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      promotion_type: promotionType === 'percentage' ? 'discount' : promotionType,
      display_format: displayFormat,
      media_type: effectiveMediaType,
      media_url: mediaUrl,
      original_price: orig,
      discount_percentage: pct > 0 ? pct : undefined,
      fixed_discount_amount: 0,
      start_date: startDate.trim() || undefined,
      end_date: endDate.trim() || undefined,
      is_featured: false,
      requires_payment: true,
      cta_label: ctaText.trim() || undefined,
      cta_url: undefined,
    };
    if (targetType === 'dish' && dishIds.length > 0) payload.dish_ids = dishIds;
    if (targetType === 'menu' && menuIds.length > 0) payload.menu_ids = menuIds;
    return payload;
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert(t('restaurantPromotionForm.requiredFieldTitle'), t('restaurantPromotionForm.titleRequired'));
      return;
    }
    if (targetType === 'dish' && dishIds.length === 0) {
      alert(t('restaurantPromotionForm.requiredFieldTitle'), t('restaurantPromotionForm.dishRequired'));
      return;
    }
    if (targetType === 'menu' && menuIds.length === 0) {
      alert(t('restaurantPromotionForm.requiredFieldTitle'), t('restaurantPromotionForm.menuRequired'));
      return;
    }
    if (effectiveMediaType === 'image' && !imageUrl.trim()) {
      alert(t('restaurantPromotionForm.requiredFieldTitle'), t('restaurantPromotionForm.imageUrlRequired'));
      return;
    }
    if (effectiveMediaType === 'video' && !videoUrl.trim()) {
      alert(t('restaurantPromotionForm.requiredFieldTitle'), t('restaurantPromotionForm.videoUrlRequired'));
      return;
    }

    const payload = buildPayload();
    setSubmitting(true);
    try {
      if (isEdit && promotion?.id) {
        await updateManagementPromotion(promotion.id, payload);
        alert(t('restaurantPromotionForm.successTitle'), t('restaurantPromotionForm.updatedMessage'), [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      } else {
        await createManagementPromotion(payload);
        alert(t('restaurantPromotionForm.successTitle'), t('restaurantPromotionForm.createdMessage'), [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      }
    } catch (e: any) {
      alert(t('restaurantPromotionForm.errorTitle'), formatAxiosError(e, t('restaurantPromotionForm.saveError')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TopBar
        navigation={navigation}
        title={isEdit ? t('restaurantPromotionForm.editTitle') : t('restaurantPromotionForm.newTitle')}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>{t('restaurantPromotionForm.generalInfo')}</Text>
          <Text style={styles.label}>{t('restaurantPromotionForm.titleLabel')}</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={t('restaurantPromotionForm.titlePlaceholder')}
            placeholderTextColor={Colors.textLight}
          />
          <Text style={styles.label}>{t('restaurantPromotionForm.shortDescription')}</Text>
          <TextInput
            style={styles.input}
            value={shortDescription}
            onChangeText={setShortDescription}
            placeholder={t('restaurantPromotionForm.shortDescription')}
            placeholderTextColor={Colors.textLight}
          />
          <Text style={styles.label}>{t('restaurantPromotionForm.description')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder={t('restaurantPromotionForm.descriptionPlaceholder')}
            placeholderTextColor={Colors.textLight}
            multiline
          />

          <Text style={styles.sectionTitle}>{t('restaurantPromotionForm.media')}</Text>
          <Text style={styles.label}>{t('restaurantPromotionForm.imageUrl')}</Text>
          <TouchableOpacity
            style={styles.imagePicker}
            onPress={handlePickImage}
            activeOpacity={0.8}
            disabled={uploadingImage}>
            {imageUrl ? (
              <Image source={{uri: imageUrl}} style={styles.imagePreview} resizeMode="cover" />
            ) : (
              <>
                <IconWrapper name="image-outline" size={28} color={Colors.textLight} />
                <Text style={styles.imagePickerText} numberOfLines={1}>
                  {t('restaurantPromotionForm.uploadImage')}
                </Text>
              </>
            )}
            {uploadingImage && (
              <View style={styles.imagePickerLoading}>
                <ActivityIndicator size="small" color={Colors.white} />
              </View>
            )}
            {!!imageUrl && !uploadingImage && (
              <View style={styles.imagePickerBadge}>
                <Text style={styles.imagePickerBadgeText} numberOfLines={1}>
                  {t('restaurantPromotionForm.changeImage')}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {canUseVideo && (
            <>
              <Text style={styles.label}>{t('restaurantPromotionForm.videoUrl')}</Text>
              <TextInput
                style={styles.input}
                value={videoUrl}
                onChangeText={setVideoUrl}
                placeholder="https://..."
                placeholderTextColor={Colors.textLight}
                keyboardType="url"
                autoCapitalize="none"
              />
            </>
          )}

          <Text style={styles.sectionTitle}>{t('restaurantPromotionForm.promote')}</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.optionBtn, targetType === 'dish' && styles.optionBtnActive]}
              onPress={() => setTargetType('dish')}>
              <Text style={[styles.optionBtnText, targetType === 'dish' && styles.optionBtnTextActive]}>
                {t('restaurantPromotionForm.dishes')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionBtn, targetType === 'menu' && styles.optionBtnActive]}
              onPress={() => setTargetType('menu')}>
              <Text style={[styles.optionBtnText, targetType === 'menu' && styles.optionBtnTextActive]}>
                {t('restaurantPromotionForm.menus')}
              </Text>
            </TouchableOpacity>
          </View>
          {targetType === 'dish' && (
            <View style={styles.listBox}>
              {loadingData ? (
                <Text style={styles.hint}>{t('restaurantPromotionForm.loading')}</Text>
              ) : dishes.length === 0 ? (
                <Text style={styles.hint}>{t('restaurantPromotionForm.noDishAvailable')}</Text>
              ) : (
                <>
                  <Text style={styles.hint}>{t('restaurantPromotionForm.chooseSingleDish')}</Text>
                  {dishes.map(d => (
                    <TouchableOpacity
                      key={d.id}
                      style={styles.checkRow}
                      onPress={() => selectDish(d.id)}>
                      <IconWrapper
                        name={dishIds.includes(d.id) ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={dishIds.includes(d.id) ? Colors.darkGreen : Colors.textLight}
                      />
                      <Text style={styles.checkLabel}>{d.name}</Text>
                      <Text style={styles.checkPrice}>{d.price?.toFixed(2)}€</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </View>
          )}
          {targetType === 'menu' && (
            <View style={styles.listBox}>
              {loadingData ? (
                <Text style={styles.hint}>{t('restaurantPromotionForm.loading')}</Text>
              ) : menus.length === 0 ? (
                <Text style={styles.hint}>{t('restaurantPromotionForm.noMenuAvailable')}</Text>
              ) : (
                <>
                  <Text style={styles.hint}>{t('restaurantPromotionForm.chooseSingleMenu')}</Text>
                  {menus.map(m => (
                    <TouchableOpacity
                      key={m.id}
                      style={styles.checkRow}
                      onPress={() => selectMenu(m.id)}>
                      <IconWrapper
                        name={menuIds.includes(m.id) ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={menuIds.includes(m.id) ? Colors.darkGreen : Colors.textLight}
                      />
                      <Text style={styles.checkLabel}>{m.name}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </View>
          )}

          <Text style={styles.sectionTitle}>{t('restaurantPromotionForm.displayFormat')}</Text>
          <View style={styles.formatRow}>
            {DISPLAY_FORMATS.map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.formatBtn, displayFormat === f && styles.formatBtnActive]}
                onPress={() => {
                  setDisplayFormat(f);
                  if (f === 'top_banner') setMediaType('image');
                }}>
                <Text style={[styles.formatBtnText, displayFormat === f && styles.formatBtnTextActive]}
                  numberOfLines={2}>
                  {getFormatDescription(f)}
                </Text>
                <Text style={styles.formatPrice}>
                  {f === 'floating_left' && '7$'}
                  {f === 'top_banner' && '10$'}
                  {f === 'section' && '5$'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>{t('restaurantPromotionForm.mediaType')}</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.optionBtn, effectiveMediaType === 'image' && styles.optionBtnActive]}
              onPress={() => setMediaType('image')}>
              <Text style={[styles.optionBtnText, effectiveMediaType === 'image' && styles.optionBtnTextActive]}>
                {t('restaurantPromotionForm.image')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionBtn,
                effectiveMediaType === 'video' && styles.optionBtnActive,
                !canUseVideo && styles.optionBtnDisabled,
              ]}
              onPress={() => canUseVideo && setMediaType('video')}
              disabled={!canUseVideo}>
              <Text style={[
                styles.optionBtnText,
                effectiveMediaType === 'video' && styles.optionBtnTextActive,
                !canUseVideo && styles.optionBtnTextDisabled,
              ]}>
                {t('restaurantPromotionForm.videoSurcharge')}
              </Text>
            </TouchableOpacity>
          </View>
          {!canUseVideo && (
            <Text style={styles.hint}>{t('restaurantPromotionForm.topBannerImageOnly')}</Text>
          )}
          <Text style={styles.label}>{t('restaurantPromotionForm.slideDuration', {seconds: slideDuration})}</Text>
          <View style={styles.durationRow}>
            {DURATION_OPTIONS.map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.durationBtn, slideDuration === d && styles.durationBtnActive]}
                onPress={() => setSlideDuration(d)}>
                <Text style={[styles.durationBtnText, slideDuration === d && styles.durationBtnTextActive]}>
                  {d}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>{t('restaurantPromotionForm.visualSettings')}</Text>
          <Text style={styles.label}>{t('restaurantPromotionForm.backgroundColor')}</Text>
          <TextInput
            style={styles.input}
            value={backgroundColor}
            onChangeText={setBackgroundColor}
            placeholder="#FFFFFF"
            placeholderTextColor={Colors.textLight}
          />
          <Text style={styles.label}>{t('restaurantPromotionForm.label')}</Text>
          <View style={styles.pickerRow}>
            {['', 'offre_du_jour', 'nouveau'].map(v => (
              <TouchableOpacity
                key={v || 'none'}
                style={[styles.optionBtn, label === v && styles.optionBtnActive]}
                onPress={() => setLabel(v)}>
                <Text style={[styles.optionBtnText, label === v && styles.optionBtnTextActive]}>
                  {labelName(v)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>{t('restaurantPromotionForm.layout')}</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.optionBtn, layoutType === 'dish' && styles.optionBtnActive]}
              onPress={() => setLayoutType('dish')}>
              <Text style={[styles.optionBtnText, layoutType === 'dish' && styles.optionBtnTextActive]}>
                {t('restaurantPromotionForm.dish')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionBtn, layoutType === 'menu' && styles.optionBtnActive]}
              onPress={() => setLayoutType('menu')}>
              <Text style={[styles.optionBtnText, layoutType === 'menu' && styles.optionBtnTextActive]}>
                {t('restaurantPromotionForm.menu')}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>{t('restaurantPromotionForm.ctaButton')}</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.optionBtn, ctaType === 'discover' && styles.optionBtnActive]}
              onPress={() => setCtaType('discover')}>
              <Text style={[styles.optionBtnText, ctaType === 'discover' && styles.optionBtnTextActive]}>
                {t('restaurantPromotionForm.ctaDiscover')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionBtn, ctaType === 'order' && styles.optionBtnActive]}
              onPress={() => setCtaType('order')}>
              <Text style={[styles.optionBtnText, ctaType === 'order' && styles.optionBtnTextActive]}>
                {t('restaurantPromotionForm.ctaOrder')}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>{t('restaurantPromotionForm.buttonText')}</Text>
          <TextInput
            style={styles.input}
            value={ctaText}
            onChangeText={setCtaText}
            placeholder={t('restaurantPromotionForm.ctaDiscover')}
            placeholderTextColor={Colors.textLight}
          />

          <Text style={styles.sectionTitle}>{t('restaurantPromotionForm.promotionTypeSection')}</Text>
          <Text style={styles.label}>{t('restaurantPromotionForm.type')}</Text>
          <View style={styles.pickerRow}>
            {['percentage', 'fixed_amount', 'flash_sale'].map(pt => (
              <TouchableOpacity
                key={pt}
                style={[styles.optionBtn, promotionType === pt && styles.optionBtnActive]}
                onPress={() => setPromotionType(pt)}>
                <Text style={[styles.optionBtnText, promotionType === pt && styles.optionBtnTextActive]}
                  numberOfLines={1}>
                  {promotionTypeName(pt)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>{t('restaurantPromotionForm.originalPrice')}</Text>
          <TextInput
            style={styles.input}
            value={originalPrice}
            onChangeText={setOriginalPrice}
            placeholder="0"
            placeholderTextColor={Colors.textLight}
            keyboardType="decimal-pad"
          />
          <Text style={styles.label}>{t('restaurantPromotionForm.discount')}</Text>
          <TextInput
            style={styles.input}
            value={discountPercent}
            onChangeText={setDiscountPercent}
            placeholder={t('restaurantPromotionForm.discountPlaceholder')}
            placeholderTextColor={Colors.textLight}
            keyboardType="decimal-pad"
          />
          <Text style={styles.label}>{t('restaurantPromotionForm.serviceFee')}</Text>
          <TextInput
            style={styles.input}
            value={servicePrice}
            onChangeText={setServicePrice}
            placeholder="0"
            placeholderTextColor={Colors.textLight}
            keyboardType="decimal-pad"
          />

          <Text style={styles.sectionTitle}>{t('restaurantPromotionForm.dates')}</Text>
          <Text style={styles.label}>{t('restaurantPromotionForm.startDate')}</Text>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="2025-01-01"
            placeholderTextColor={Colors.textLight}
          />
          <Text style={styles.label}>{t('restaurantPromotionForm.endDate')}</Text>
          <TextInput
            style={styles.input}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="2025-12-31"
            placeholderTextColor={Colors.textLight}
          />

          <View style={styles.estimatorBox}>
            <Text style={styles.estimatorTitle}>{t('restaurantPromotionForm.costEstimate')}</Text>
            <Text style={styles.estimatorPrice}>{formatPromotionPrice(estimatedPrice)}</Text>
            <Text style={styles.estimatorDetail}>
              {displayFormat === 'floating_left' && '7$ base + 0.5$/s'}
              {displayFormat === 'top_banner' && '10$ base + 0.7$/s'}
              {displayFormat === 'section' && '5$ base + 0.3$/s'}
              {effectiveMediaType === 'video' && ' × 1.25'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}>
            {submitting ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>
                {isEdit ? t('restaurantPromotionForm.save') : t('restaurantPromotionForm.createPromotion')}
              </Text>
            )}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkGreen,
    marginTop: 20,
    marginBottom: 12,
    fontFamily: secondaryFont,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkGreen,
    marginBottom: 8,
    fontFamily: secondaryFont,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 16,
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  imagePicker: {
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePickerText: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 8,
    fontFamily: secondaryFont,
    maxWidth: '90%',
  },
  imagePickerLoading: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5,16,4,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    maxWidth: '70%',
    backgroundColor: 'rgba(5,16,4,0.75)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  imagePickerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: secondaryFont,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  optionBtnActive: {
    borderColor: Colors.darkGreen,
    backgroundColor: Colors.olive + '30',
  },
  optionBtnDisabled: {
    opacity: 0.5,
  },
  optionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  optionBtnTextActive: {
    color: Colors.darkGreen,
  },
  optionBtnTextDisabled: {
    color: Colors.textLight,
  },
  listBox: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
    backgroundColor: Colors.white,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  checkLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
    fontFamily: secondaryFont,
  },
  checkPrice: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  formatBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  formatBtnActive: {
    borderColor: Colors.darkGreen,
    backgroundColor: Colors.olive + '30',
  },
  formatBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: secondaryFont,
    textAlign: 'center',
  },
  formatBtnTextActive: {
    color: Colors.darkGreen,
  },
  formatPrice: {
    fontSize: 10,
    color: Colors.textLight,
    marginTop: 4,
    fontFamily: secondaryFont,
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  durationBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: Colors.gray[100],
  },
  durationBtnActive: {
    backgroundColor: Colors.darkGreen,
  },
  durationBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  durationBtnTextActive: {
    color: Colors.white,
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  hint: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: secondaryFont,
    marginBottom: 8,
  },
  estimatorBox: {
    backgroundColor: Colors.olive + '20',
    borderWidth: 1,
    borderColor: Colors.darkGreen,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  estimatorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkGreen,
    marginBottom: 4,
    fontFamily: secondaryFont,
  },
  estimatorPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
  },
  estimatorDetail: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
    fontFamily: secondaryFont,
  },
  submitBtn: {
    backgroundColor: Colors.darkGreen,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: secondaryFont,
  },
});

export default PromotionFormScreen;
