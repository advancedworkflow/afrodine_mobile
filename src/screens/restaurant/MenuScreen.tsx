import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Switch,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {alert} from '../../utils/alert';
import TopBar from '../../components/TopBar';
import IconWrapper from '../../components/IconWrapper';
import ConfirmModal from '../../components/ConfirmModal';
import {Colors, Radius, Shadows} from '../../utils/colors';
import {secondaryFont} from '../../utils/fonts';
import {formatAxiosError} from '../../utils/formatApiError';
import {
  getMenusWithDishes,
  getRestaurantDishes,
  getManagementSupplements,
  createManagementSupplement,
  createDish,
  updateDish,
  createMenu,
  deleteDish,
  deleteMenu,
  addDishesToMenu,
  uploadManagementImage,
  uploadManagementImageFile,
  type MenuWithDishes,
  type ManagementDish,
  type ManagementSupplement,
} from '../../services/restaurantManagement';
import {getAbsoluteImageUrl} from '../../utils/api';

const DEFAULT_IMAGE_URL = 'https://placehold.co/400x300?text=Plat';

const ImagePicker = Platform.OS !== 'web' ? require('react-native-image-picker') : null;

// Un onglet par type d'élément ; le bouton + crée un élément du type de l'onglet courant
type TabKey = 'dishes' | 'menus' | 'supplements';

type DeleteTarget = { type: 'dish'; id: number; name: string } | { type: 'menu'; id: number; name: string } | null;

const RestaurantMenuScreen = ({navigation}: any) => {
  const {t} = useTranslation();
  const [menus, setMenus] = useState<MenuWithDishes[]>([]);
  const [allDishes, setAllDishes] = useState<ManagementDish[]>([]);
  const [supplements, setSupplements] = useState<ManagementSupplement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalDish, setModalDish] = useState(false);
  const [modalMenu, setModalMenu] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dishName, setDishName] = useState('');
  const [dishDesc, setDishDesc] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishImageUrl, setDishImageUrl] = useState('');
  const [dishCateringOnly, setDishCateringOnly] = useState(false);
  // Plat en cours de modification ; null = création
  const [editingDish, setEditingDish] = useState<ManagementDish | null>(null);
  const [menuName, setMenuName] = useState('');
  const [menuDesc, setMenuDesc] = useState('');
  const [menuPrice, setMenuPrice] = useState('');
  const [menuImageUrl, setMenuImageUrl] = useState('');
  const [uploadingMenuImage, setUploadingMenuImage] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('dishes');
  const [addDishToMenuTarget, setAddDishToMenuTarget] = useState<{ dishId: number; dishName: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<{ click: () => void; value?: string } | null>(null);
  const menuFileInputRef = useRef<{ click: () => void; value?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalSupplement, setModalSupplement] = useState(false);
  const [supplementName, setSupplementName] = useState('');
  const [supplementPrice, setSupplementPrice] = useState('');
  const [supplementDishId, setSupplementDishId] = useState<number | null>(null);
  const [supplementSubmitting, setSupplementSubmitting] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [menusData, dishesData, supplementsData] = await Promise.all([
        getMenusWithDishes(),
        getRestaurantDishes(),
        getManagementSupplements(),
      ]);
      setMenus(menusData);
      setAllDishes(dishesData);
      setSupplements(supplementsData);
    } catch (e) {
      setMenus([]);
      setAllDishes([]);
      setSupplements([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [menusData, dishesData, supplementsData] = await Promise.all([
          getMenusWithDishes(),
          getRestaurantDishes(),
          getManagementSupplements(),
        ]);
        if (!cancelled) {
          setMenus(menusData);
          setAllDishes(dishesData);
          setSupplements(supplementsData);
        }
      } catch (e) {
        if (!cancelled) setMenus([]);
        if (!cancelled) setAllDishes([]);
        if (!cancelled) setSupplements([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onRefresh = () => {
    load(true);
  };

  const openDishModal = () => {
    setEditingDish(null);
    setDishName('');
    setDishDesc('');
    setDishPrice('');
    setDishImageUrl('');
    setDishCateringOnly(false);
    setModalDish(true);
  };

  const openEditDish = (dish: ManagementDish) => {
    setEditingDish(dish);
    setDishName(dish.name);
    setDishDesc(dish.description ?? '');
    setDishPrice(String(dish.price));
    setDishImageUrl(dish.dish_image_url ?? '');
    setDishCateringOnly(!!dish.catering_only);
    setModalDish(true);
  };

  // Mobile : galerie du téléphone puis envoi au CDN (le web passe par un <input type="file">)
  const pickAndUploadNative = (folder: 'dishes' | 'menus', setUploading: (v: boolean) => void, setUrl: (url: string) => void) => {
    ImagePicker.launchImageLibrary({mediaType: 'photo', quality: 0.8}, async (response: any) => {
      if (response.didCancel || response.errorCode) return;
      const asset = response.assets?.[0];
      if (!asset?.uri) return;
      setUploading(true);
      try {
        const {image_url} = await uploadManagementImage(asset.uri, asset.fileName || 'image.jpg', asset.type || 'image/jpeg', folder);
        setUrl(image_url || '');
      } catch {
        alert(t('restaurantMenu.errorTitle'), t('restaurantMenu.uploadError'));
      } finally {
        setUploading(false);
      }
    });
  };

  const handleImagePick = () => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
      return;
    }
    pickAndUploadNative('dishes', setUploadingImage, setDishImageUrl);
  };

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
        const { image_url } = await uploadManagementImageFile(file, 'dishes');
        setDishImageUrl(image_url || '');
      } catch {
        alert(t('restaurantMenu.errorTitle'), t('restaurantMenu.uploadError'));
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
      setUploadingMenuImage(true);
      try {
        const { image_url } = await uploadManagementImageFile(file, 'menus');
        setMenuImageUrl(image_url || '');
      } catch {
        alert(t('restaurantMenu.errorTitle'), t('restaurantMenu.uploadError'));
      } finally {
        setUploadingMenuImage(false);
        if (target) target.value = '';
      }
    };
    doc.body.appendChild(input);
    menuFileInputRef.current = input;
    return () => {
      try {
        doc.body.removeChild(input);
      } catch (_) {}
      menuFileInputRef.current = null;
    };
  }, []);

  const openMenuModal = () => {
    setMenuName('');
    setMenuDesc('');
    setMenuPrice('');
    setMenuImageUrl('');
    setModalMenu(true);
  };

  const handleMenuImagePick = () => {
    if (Platform.OS === 'web') {
      menuFileInputRef.current?.click();
      return;
    }
    pickAndUploadNative('menus', setUploadingMenuImage, setMenuImageUrl);
  };

  const doCreateDish = async () => {
    const name = dishName.trim();
    const price = parseFloat(dishPrice.replace(',', '.'));
    setSubmitting(true);
    try {
      if (editingDish) {
        // Champs non modifiables ici repris du plat existant (le PUT remplace tout)
        await updateDish(editingDish.id, {
          name,
          description: dishDesc.trim() || undefined,
          price,
          dish_image_url: dishImageUrl.trim() || DEFAULT_IMAGE_URL,
          catering_only: dishCateringOnly,
          category_id: editingDish.category_id,
          diet_type: editingDish.diet_type,
          is_available: editingDish.is_available,
          hidden_from_marketplace: editingDish.hidden_from_marketplace,
          is_grocery_product: editingDish.is_grocery_product,
        });
      } else {
        await createDish({
          name,
          description: dishDesc.trim() || undefined,
          price,
          dish_image_url: dishImageUrl.trim() || DEFAULT_IMAGE_URL,
          catering_only: dishCateringOnly,
        });
      }
      setModalDish(false);
      load();
      alert(t('restaurantMenu.successTitle'), t(editingDish ? 'restaurantMenu.dishUpdated' : 'restaurantMenu.dishCreated'));
    } catch (e: any) {
      alert(
        t('restaurantMenu.errorTitle'),
        formatAxiosError(e, t(editingDish ? 'restaurantMenu.updateDishError' : 'restaurantMenu.createDishError')),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDish = () => {
    const name = dishName.trim();
    const price = parseFloat(dishPrice.replace(',', '.'));
    if (!name) {
      alert(t('restaurantMenu.errorTitle'), t('restaurantMenu.dishNameRequired'));
      return;
    }
    if (isNaN(price) || price < 0) {
      alert(t('restaurantMenu.errorTitle'), t('restaurantMenu.invalidPrice'));
      return;
    }
    doCreateDish();
  };

  const doCreateMenu = async () => {
    const name = menuName.trim();
    const priceNum = menuPrice.trim() ? parseFloat(menuPrice.replace(',', '.')) : undefined;
    setSubmitting(true);
    try {
      await createMenu({
        name,
        description: menuDesc.trim() || undefined,
        price: priceNum != null && !Number.isNaN(priceNum) ? priceNum : undefined,
        image_url: menuImageUrl.trim() || undefined,
      });
      setModalMenu(false);
      load();
      alert(t('restaurantMenu.successTitle'), t('restaurantMenu.menuCreated'));
    } catch (e: any) {
      alert(t('restaurantMenu.errorTitle'), formatAxiosError(e, t('restaurantMenu.createMenuError')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateMenu = () => {
    const name = menuName.trim();
    if (!name) {
      alert(t('restaurantMenu.errorTitle'), t('restaurantMenu.menuNameRequired'));
      return;
    }
    doCreateMenu();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      if (target.type === 'dish') {
        await deleteDish(target.id);
        alert(t('restaurantMenu.successTitle'), t('restaurantMenu.dishDeleted'));
      } else {
        await deleteMenu(target.id);
        alert(t('restaurantMenu.successTitle'), t('restaurantMenu.menuDeleted'));
      }
      load();
    } catch (e: any) {
      alert(t('restaurantMenu.errorTitle'), formatAxiosError(e, t('restaurantMenu.deleteError')));
    }
  };

  const searchLower = searchQuery.trim().toLowerCase();
  const matches = (text?: string) => !searchLower || (text ?? '').toLowerCase().includes(searchLower);
  const getDishName = (dishId: number) => allDishes.find((d) => d.id === dishId)?.name;
  const getSupplementsForDish = (dishId: number) => supplements.filter((s) => s.dish_id === dishId);

  const visibleDishes = allDishes.filter((d) => matches(d.name) || matches(d.description));
  const visibleMenus = menus.filter((m) => matches(m.name) || (m.dishes ?? []).some((d) => matches(d.name)));
  const visibleSupplements = supplements.filter((s) => matches(s.name) || matches(getDishName(s.dish_id)));

  const renderDishCard = (item: ManagementDish) => {
    const dishSupplements = getSupplementsForDish(item.id);
    const imageUrl = item.dish_image_url ?? (item as any).image_url;
    return (
      <View key={item.id} style={styles.card}>
        <View style={styles.dishThumbWrap}>
          {imageUrl ? (
            <Image
              source={{ uri: getAbsoluteImageUrl(imageUrl) || imageUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <IconWrapper name="image-outline" size={26} color={Colors.textLight} />
          )}
        </View>
        <View style={styles.dishInfo}>
          <Text style={styles.dishName} numberOfLines={1}>{item.name}</Text>
          {item.description ? (
            <Text style={styles.dishDesc} numberOfLines={2}>{item.description}</Text>
          ) : null}
          {dishSupplements.length > 0 && (
            <View style={styles.supplementsRow}>
              {dishSupplements.map((s) => (
                <Text key={s.id} style={styles.supplementChip}>+ {s.name} ({s.price.toFixed(2)} €)</Text>
              ))}
            </View>
          )}
          <Text style={styles.dishPrice}>{item.price.toFixed(2)} €</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => openEditDish(item)}
            style={styles.iconBtn}>
            <IconWrapper name="create-outline" size={21} color={Colors.darkGreen} />
          </TouchableOpacity>
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => setAddDishToMenuTarget({ dishId: item.id, dishName: item.name })}
            style={styles.iconBtn}>
            <IconWrapper name="add-circle-outline" size={22} color={Colors.darkGreen} />
          </TouchableOpacity>
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => setDeleteTarget({ type: 'dish', id: item.id, name: item.name })}
            style={styles.iconBtn}>
            <IconWrapper name="trash-outline" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderMenuCard = (menu: MenuWithDishes) => {
    const dishes = menu.dishes ?? [];
    return (
      <View key={menu.id} style={styles.menuCard}>
        <View style={styles.menuCardHeader}>
          <View style={styles.menuCardTitleWrap}>
            <Text style={styles.menuCardTitle} numberOfLines={1}>{menu.name}</Text>
            <Text style={styles.metaText}>{t('restaurantMenu.dishCount', {count: dishes.length})}</Text>
          </View>
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => setDeleteTarget({ type: 'menu', id: menu.id, name: menu.name })}
            style={styles.iconBtn}>
            <IconWrapper name="trash-outline" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>
        {dishes.length === 0 ? (
          <Text style={styles.metaText}>{t('restaurantMenu.menuEmpty')}</Text>
        ) : (
          dishes.map((d) => (
            <View key={d.id} style={styles.menuDishRow}>
              <Text style={styles.menuDishName} numberOfLines={1}>{d.name}</Text>
              <Text style={styles.menuDishPrice}>{d.price.toFixed(2)} €</Text>
            </View>
          ))
        )}
      </View>
    );
  };

  const renderSupplementRow = (s: ManagementSupplement) => (
    <View key={s.id} style={styles.supplementCard}>
      <View style={styles.menuCardTitleWrap}>
        <Text style={styles.dishName} numberOfLines={1}>{s.name}</Text>
        <Text style={styles.metaText}>{t('restaurantMenu.forDish', {name: getDishName(s.dish_id) ?? '—'})}</Text>
      </View>
      <Text style={styles.dishPrice}>+{s.price.toFixed(2)} €</Text>
    </View>
  );

  const renderEmpty = (emptyKey: 'restaurantMenu.noDishes' | 'restaurantMenu.noMenus' | 'restaurantMenu.noSupplements') => (
    <View style={styles.empty}>
      <IconWrapper name="restaurant-outline" size={48} color={Colors.textLight} />
      <Text style={styles.emptyText}>{searchLower ? t('restaurantMenu.noResults') : t(emptyKey)}</Text>
    </View>
  );

  const openSupplementModal = () => {
    setSupplementName('');
    setSupplementPrice('');
    setSupplementDishId(allDishes.length > 0 ? allDishes[0].id : null);
    setModalSupplement(true);
  };

  const handleCreateSupplement = async () => {
    const name = supplementName.trim();
    const price = parseFloat(supplementPrice.replace(',', '.'));
    if (!name) {
      alert(t('restaurantMenu.errorTitle'), t('restaurantMenu.supplementNameRequired'));
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      alert(t('restaurantMenu.errorTitle'), t('restaurantMenu.invalidPrice'));
      return;
    }
    if (supplementDishId == null) {
      alert(t('restaurantMenu.errorTitle'), t('restaurantMenu.chooseDish'));
      return;
    }
    setSupplementSubmitting(true);
    try {
      await createManagementSupplement({ name, price, dish_id: supplementDishId });
      setModalSupplement(false);
      load();
      alert(t('restaurantMenu.successTitle'), t('restaurantMenu.supplementCreated', {name}));
    } catch (e: any) {
      alert(t('restaurantMenu.errorTitle'), formatAxiosError(e, t('restaurantMenu.createSupplementError')));
    } finally {
      setSupplementSubmitting(false);
    }
  };

  const tabs: { key: TabKey; count: number }[] = [
    { key: 'dishes', count: allDishes.length },
    { key: 'menus', count: menus.length },
    { key: 'supplements', count: supplements.length },
  ];
  const openCreateModal =
    activeTab === 'dishes' ? openDishModal : activeTab === 'menus' ? openMenuModal : openSupplementModal;

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar navigation={navigation} title={t('restaurantMenu.title')} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.darkGreen} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar navigation={navigation} title={t('restaurantMenu.title')} />
      <View style={styles.tabs}>
        {tabs.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}>
              <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>
                {t(`restaurantMenu.tabs.${tab.key}`)} ({tab.count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.searchWrap}>
        <IconWrapper name="search-outline" size={20} color={Colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('restaurantMenu.searchPlaceholder')}
          placeholderTextColor={Colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
            <IconWrapper name="close-circle" size={20} color={Colors.textLight} />
          </TouchableOpacity>
        ) : null}
      </View>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.darkGreen]} />
        }>
        {activeTab === 'dishes' &&
          (visibleDishes.length > 0 ? visibleDishes.map(renderDishCard) : renderEmpty('restaurantMenu.noDishes'))}
        {activeTab === 'menus' &&
          (visibleMenus.length > 0 ? visibleMenus.map(renderMenuCard) : renderEmpty('restaurantMenu.noMenus'))}
        {activeTab === 'supplements' &&
          (visibleSupplements.length > 0
            ? visibleSupplements.map(renderSupplementRow)
            : renderEmpty('restaurantMenu.noSupplements'))}
      </ScrollView>
      <TouchableOpacity style={styles.fab} onPress={openCreateModal} activeOpacity={0.85}>
        <IconWrapper name="add" size={30} color={Colors.white} />
      </TouchableOpacity>

      <Modal visible={modalDish} animationType="fade" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalFullScreen}>
          <View style={styles.modalFullHeader}>
            <Text style={styles.modalFullTitle}>{t(editingDish ? 'restaurantMenu.editDish' : 'restaurantMenu.newDish')}</Text>
            <TouchableOpacity
              onPress={() => setModalDish(false)}
              style={styles.modalCloseBtn}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <IconWrapper name="close-outline" size={28} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.modalFullContent}
            contentContainerStyle={styles.modalFullContentInner}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <TextInput
              style={styles.input}
              placeholder={t('restaurantMenu.dishNamePlaceholder')}
              value={dishName}
              onChangeText={setDishName}
              placeholderTextColor={Colors.textLight}
            />
            <TextInput
              style={[styles.input, styles.inputArea]}
              placeholder={t('restaurantMenu.description')}
              value={dishDesc}
              onChangeText={setDishDesc}
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={3}
            />
            <TextInput
              style={styles.input}
              placeholder={t('restaurantMenu.pricePlaceholder')}
              value={dishPrice}
              onChangeText={setDishPrice}
              placeholderTextColor={Colors.textLight}
              keyboardType="decimal-pad"
            />
            <View style={styles.imageUploadSection}>
              <Text style={styles.imageUploadLabel}>{t('restaurantMenu.dishPhoto')}</Text>
              <TextInput
                style={[styles.input, { marginBottom: 8 }]}
                placeholder={t('restaurantMenu.imageUrlOptional')}
                placeholderTextColor={Colors.textLight}
                value={dishImageUrl}
                onChangeText={setDishImageUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {dishImageUrl ? (
                <View style={styles.imagePreviewWrap}>
                  <Image source={{ uri: getAbsoluteImageUrl(dishImageUrl) || dishImageUrl }} style={styles.imagePreview} resizeMode="cover" />
                  <TouchableOpacity style={styles.changeImageBtn} onPress={handleImagePick} disabled={uploadingImage}>
                    <Text style={styles.changeImageBtnText}>{uploadingImage ? t('restaurantMenu.uploading') : t('restaurantMenu.change')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadImageBtn} onPress={handleImagePick} disabled={uploadingImage}>
                  {uploadingImage ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <IconWrapper name="image-outline" size={24} color={Colors.white} />
                      <Text style={styles.uploadImageBtnText}>{t('restaurantMenu.chooseImageCdn')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>{t('restaurantMenu.cateringOnly')}</Text>
                <Text style={styles.toggleSub}>{t('restaurantMenu.cateringOnlyHint')}</Text>
              </View>
              <Switch
                value={dishCateringOnly}
                onValueChange={setDishCateringOnly}
                trackColor={{ false: Colors.gray[300], true: Colors.darkGreen }}
                thumbColor={Colors.white}
              />
            </View>
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleCreateDish}
              disabled={submitting}>
              <Text style={styles.submitBtnText}>
                {editingDish
                  ? submitting ? t('restaurantMenu.saving') : t('restaurantMenu.saveDish')
                  : submitting ? t('restaurantMenu.creating') : t('restaurantMenu.createDish')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={modalMenu} animationType="fade" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalFullScreen}>
          <View style={styles.modalFullHeader}>
            <Text style={styles.modalFullTitle}>{t('restaurantMenu.newMenu')}</Text>
            <TouchableOpacity
              onPress={() => setModalMenu(false)}
              style={styles.modalCloseBtn}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <IconWrapper name="close-outline" size={28} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.modalFullContent}
            contentContainerStyle={styles.modalFullContentInner}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <TextInput
              style={styles.input}
              placeholder={t('restaurantMenu.menuNamePlaceholder')}
              value={menuName}
              onChangeText={setMenuName}
              placeholderTextColor={Colors.textLight}
            />
            <TextInput
              style={[styles.input, styles.inputArea]}
              placeholder={t('restaurantMenu.description')}
              value={menuDesc}
              onChangeText={setMenuDesc}
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={3}
            />
            <Text style={styles.inputLabel}>{t('restaurantMenu.priceLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('restaurantMenu.priceExample')}
              placeholderTextColor={Colors.textLight}
              keyboardType="decimal-pad"
              value={menuPrice}
              onChangeText={setMenuPrice}
            />
            <Text style={styles.inputLabel}>{t('restaurantMenu.menuImage')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('restaurantMenu.menuImagePlaceholder')}
              value={menuImageUrl}
              onChangeText={setMenuImageUrl}
              placeholderTextColor={Colors.textLight}
              keyboardType="url"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.uploadImageBtn, uploadingMenuImage && styles.uploadBtnDisabled]}
              onPress={handleMenuImagePick}
              disabled={uploadingMenuImage}>
              <IconWrapper name="image-outline" size={20} color={Colors.white} />
              <Text style={styles.uploadImageBtnText}>
                {uploadingMenuImage ? t('restaurantMenu.uploading') : t('restaurantMenu.chooseImage')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleCreateMenu}
              disabled={submitting}>
              <Text style={styles.submitBtnText}>{submitting ? t('restaurantMenu.creating') : t('restaurantMenu.createMenu')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Nouveau supplément (slide vers le haut, comme Nouveau plat) */}
      <Modal visible={modalSupplement} animationType="fade" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalFullScreen}>
          <View style={styles.modalFullHeader}>
            <Text style={styles.modalFullTitle}>{t('restaurantMenu.newSupplement')}</Text>
            <TouchableOpacity
              onPress={() => setModalSupplement(false)}
              style={styles.modalCloseBtn}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <IconWrapper name="close-outline" size={28} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.modalFullContent}
            contentContainerStyle={styles.modalFullContentInner}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>{t('restaurantMenu.supplementNameLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('restaurantMenu.supplementNamePlaceholder')}
              placeholderTextColor={Colors.textLight}
              value={supplementName}
              onChangeText={setSupplementName}
            />
            <Text style={styles.inputLabel}>{t('restaurantMenu.priceRequiredLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={Colors.textLight}
              keyboardType="decimal-pad"
              value={supplementPrice}
              onChangeText={setSupplementPrice}
            />
            <Text style={styles.inputLabel}>{t('restaurantMenu.assignToDish')}</Text>
            {allDishes.length === 0 ? (
              <Text style={styles.mutedText}>{t('restaurantMenu.noDishCreateFirst')}</Text>
            ) : (
              <ScrollView style={styles.dishPickList} nestedScrollEnabled>
                {allDishes.map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.dishPickRow, supplementDishId === d.id && styles.dishPickRowSelected]}
                    onPress={() => setSupplementDishId(d.id)}>
                    <Text style={styles.dishPickName}>{d.name}</Text>
                    {supplementDishId === d.id ? (
                      <IconWrapper name="checkmark-circle" size={22} color={Colors.darkGreen} />
                    ) : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity
              style={[styles.submitBtn, (supplementSubmitting || allDishes.length === 0) && styles.submitBtnDisabled]}
              onPress={handleCreateSupplement}
              disabled={supplementSubmitting || allDishes.length === 0}>
              <Text style={styles.submitBtnText}>
                {supplementSubmitting ? t('restaurantMenu.creating') : t('restaurantMenu.createSupplement')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmModal
        visible={deleteTarget !== null}
        title={deleteTarget?.type === 'dish' ? t('restaurantMenu.deleteDishConfirmTitle') : t('restaurantMenu.deleteMenuConfirmTitle')}
        message={
          deleteTarget
            ? t('restaurantMenu.deleteConfirmMessage', {name: deleteTarget.name})
            : ''
        }
        confirmLabel={t('restaurantMenu.delete')}
        cancelLabel={t('restaurantMenu.cancel')}
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Modal Ajouter le plat à un menu */}
      <Modal visible={addDishToMenuTarget !== null} transparent animationType="fade">
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setAddDishToMenuTarget(null)} />
        <View style={styles.modalCenterWrap}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>{t('restaurantMenu.addToMenu')}</Text>
          <Text style={styles.modalSubtitle}>
            {addDishToMenuTarget ? `« ${addDishToMenuTarget.dishName} »` : ''}
          </Text>
          <ScrollView style={{ maxHeight: 240 }}>
            {menus.length === 0 ? (
              <Text style={styles.mutedText}>{t('restaurantMenu.noMenuCreateFirst')}</Text>
            ) : (
              menus.map((menu) => (
                <TouchableOpacity
                  key={menu.id}
                  style={styles.menuPickRow}
                  onPress={async () => {
                    if (!addDishToMenuTarget) return;
                    try {
                      await addDishesToMenu(menu.id, [addDishToMenuTarget.dishId]);
                      setAddDishToMenuTarget(null);
                      load();
                      alert(t('restaurantMenu.successTitle'), t('restaurantMenu.dishAddedToMenu', {name: menu.name}));
                    } catch (e: any) {
                      alert(t('restaurantMenu.errorTitle'), formatAxiosError(e, t('restaurantMenu.addToMenuError')));
                    }
                  }}>
                  <Text style={styles.menuPickName}>{menu.name}</Text>
                  <IconWrapper name="add-circle-outline" size={22} color={Colors.darkGreen} />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddDishToMenuTarget(null)}>
            <Text style={styles.cancelBtnText}>{t('restaurantMenu.cancel')}</Text>
          </TouchableOpacity>
        </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  content: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: Radius.pill,
  },
  tabActive: {
    backgroundColor: Colors.darkGreen,
  },
  tabText: {
    fontSize: 14,
    fontFamily: secondaryFont,
    color: Colors.text,
  },
  tabTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    padding: 12,
    marginBottom: 12,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  cardActions: {
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 4,
  },
  menuCard: {
    backgroundColor: Colors.white,
    padding: 16,
    marginBottom: 12,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  menuCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuCardTitleWrap: {
    flex: 1,
    marginRight: 12,
  },
  menuCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 2,
  },
  menuDishRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  menuDishName: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    marginRight: 12,
  },
  menuDishPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.darkGreen,
  },
  supplementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 14,
    marginBottom: 10,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 12,
    gap: 8,
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: Colors.darkGreen,
    paddingVertical: 4,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.darkGreen,
    marginBottom: 8,
  },
  dishPickList: {
    marginBottom: 16,
    maxHeight: 220,
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  dishPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dishPickRowSelected: {
    backgroundColor: Colors.backgroundLight,
  },
  dishPickName: {
    fontSize: 17,
    color: Colors.darkGreen,
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: Colors.border,
    alignItems: 'center',
  },
  modalBtnConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: Colors.darkGreen,
    alignItems: 'center',
  },
  modalBtnCancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.darkGreen,
  },
  modalBtnConfirmText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.white,
  },
  listContent: {
    padding: 16,
    // Laisse la place au bouton + flottant
    paddingBottom: 100,
  },
  dishThumbWrap: {
    width: 64,
    height: 64,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: Colors.gray[100],
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dishInfo: {
    flex: 1,
    marginRight: 12,
  },
  dishName: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
  },
  dishDesc: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
  },
  dishPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.darkGreen,
    marginTop: 6,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  modalFullScreen: {
    flex: 1,
    backgroundColor: Colors.darkGreen,
  },
  modalFullHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingBottom: 16,
  },
  modalFullTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: secondaryFont,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalFullContent: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalFullContentInner: {
    padding: 24,
    paddingBottom: 32,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCenterWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    color: Colors.text,
    marginBottom: 12,
  },
  inputArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.gray[100],
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  toggleSub: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 2,
    fontFamily: secondaryFont,
  },
  submitBtn: {
    backgroundColor: Colors.darkGreen,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.white,
  },
  imageUploadSection: {
    marginBottom: 16,
  },
  imageUploadLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.darkGreen,
    marginBottom: 8,
    fontFamily: secondaryFont,
  },
  imagePreviewWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  imagePreview: {
    width: 120,
    height: 90,
    borderRadius: 8,
    backgroundColor: Colors.border,
  },
  changeImageBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: Colors.darkGreen,
  },
  changeImageBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  uploadImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: Colors.darkGreen,
    borderWidth: 1,
    borderColor: Colors.darkGreen,
  },
  uploadImageBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  uploadBtnDisabled: {
    opacity: 0.6,
  },
  supplementsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  supplementChip: {
    fontSize: 12,
    color: Colors.textLight,
    backgroundColor: Colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modalSubtitle: {
    fontSize: 15,
    color: Colors.textLight,
    marginBottom: 12,
  },
  menuPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuPickName: {
    fontSize: 17,
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  cancelBtn: {
    marginTop: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 17,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  mutedText: {
    fontSize: 15,
    color: Colors.textLight,
    paddingVertical: 12,
    textAlign: 'center',
  },
});

export default RestaurantMenuScreen;
