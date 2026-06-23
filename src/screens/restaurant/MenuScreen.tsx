import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  SectionList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import TopBar from '../../components/TopBar';
import IconWrapper from '../../components/IconWrapper';
import ConfirmModal from '../../components/ConfirmModal';
import {Colors} from '../../utils/colors';
import {secondaryFont} from '../../utils/fonts';
import {formatAxiosError} from '../../utils/formatApiError';
import {
  getMenusWithDishes,
  getRestaurantDishes,
  getManagementSupplements,
  createManagementSupplement,
  createDish,
  createMenu,
  deleteDish,
  deleteMenu,
  addDishesToMenu,
  uploadManagementImageFile,
  type MenuWithDishes,
  type ManagementDish,
  type ManagementSupplement,
} from '../../services/restaurantManagement';
import {getAbsoluteImageUrl} from '../../utils/api';

const DEFAULT_IMAGE_URL = 'https://placehold.co/400x300?text=Plat';

type Section = {
  title: string;
  data: { id: number; name: string; description?: string; price: number; dish_image_url?: string }[];
  isAllDishes?: boolean;
  menuId?: number;
};

type DeleteTarget = { type: 'dish'; id: number; name: string } | { type: 'menu'; id: number; name: string } | null;

const RestaurantMenuScreen = ({navigation}: any) => {
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
  const [menuName, setMenuName] = useState('');
  const [menuDesc, setMenuDesc] = useState('');
  const [menuPrice, setMenuPrice] = useState('');
  const [menuImageUrl, setMenuImageUrl] = useState('');
  const [uploadingMenuImage, setUploadingMenuImage] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [confirmCreateDish, setConfirmCreateDish] = useState(false);
  const [confirmCreateMenu, setConfirmCreateMenu] = useState(false);
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
    setDishName('');
    setDishDesc('');
    setDishPrice('');
    setDishImageUrl('');
    setModalDish(true);
  };

  const handleImagePick = () => {
    fileInputRef.current?.click();
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
        Alert.alert('Erreur', 'Impossible d\'uploader l\'image.');
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
        Alert.alert('Erreur', 'Impossible d\'uploader l\'image.');
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
    Alert.alert(
      'Image du menu',
      'Sur l\'app mobile, saisissez l\'URL de l\'image dans le champ ci-dessus. L\'upload de fichier est disponible sur le tableau de bord web.',
    );
  };

  const doCreateDish = async () => {
    const name = dishName.trim();
    const price = parseFloat(dishPrice.replace(',', '.'));
    setConfirmCreateDish(false);
    setSubmitting(true);
    try {
      await createDish({
        name,
        description: dishDesc.trim() || undefined,
        price,
        dish_image_url: dishImageUrl.trim() || DEFAULT_IMAGE_URL,
      });
      setModalDish(false);
      load();
      Alert.alert('Succès', 'Plat créé.');
    } catch (e: any) {
      Alert.alert('Erreur', formatAxiosError(e, 'Impossible de créer le plat.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDish = () => {
    const name = dishName.trim();
    const price = parseFloat(dishPrice.replace(',', '.'));
    if (!name) {
      Alert.alert('Erreur', 'Nom du plat requis.');
      return;
    }
    if (isNaN(price) || price < 0) {
      Alert.alert('Erreur', 'Prix invalide.');
      return;
    }
    setConfirmCreateDish(true);
  };

  const doCreateMenu = async () => {
    const name = menuName.trim();
    const priceNum = menuPrice.trim() ? parseFloat(menuPrice.replace(',', '.')) : undefined;
    setConfirmCreateMenu(false);
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
      Alert.alert('Succès', 'Menu créé.');
    } catch (e: any) {
      Alert.alert('Erreur', formatAxiosError(e, 'Impossible de créer le menu.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateMenu = () => {
    const name = menuName.trim();
    if (!name) {
      Alert.alert('Erreur', 'Nom du menu requis.');
      return;
    }
    setConfirmCreateMenu(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      if (target.type === 'dish') {
        await deleteDish(target.id);
        Alert.alert('Succès', 'Plat supprimé.');
      } else {
        await deleteMenu(target.id);
        Alert.alert('Succès', 'Menu supprimé.');
      }
      load();
    } catch (e: any) {
      Alert.alert('Erreur', formatAxiosError(e, 'Impossible de supprimer.'));
    }
  };

  const allSections: Section[] = [
    ...(allDishes.length > 0 ? [{ title: 'Tous les plats', data: allDishes, isAllDishes: true as const }] : []),
    ...menus.map((m) => ({
      title: m.name,
      data: (m.dishes ?? []).map((d) => ({ ...d, dish_image_url: d.dish_image_url ?? (d as any).image_url })),
      isAllDishes: false as const,
      menuId: m.id,
    })),
  ];

  const searchLower = searchQuery.trim().toLowerCase();
  const sections: Section[] = searchLower
    ? allSections
        .map((sec) => ({
          ...sec,
          data: sec.data.filter(
            (item) =>
              item.name.toLowerCase().includes(searchLower) ||
              sec.title.toLowerCase().includes(searchLower),
          ),
        }))
        .filter((sec) => sec.data.length > 0)
    : allSections;

  const renderSectionHeader = ({ section }: { section: Section }) => {
    const menu = menus.find(m => m.name === section.title);
    return (
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <IconWrapper name="restaurant-outline" size={22} color={Colors.primary} />
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
        {menu != null && (
          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => setDeleteTarget({ type: 'menu', id: menu.id, name: menu.name })}
            style={styles.deleteIconBtn}>
            <IconWrapper name="trash-outline" size={22} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const getSupplementsForDish = (dishId: number) => supplements.filter((s) => s.dish_id === dishId);

  const renderItem = ({ item, section }: { item: { id: number; name: string; description?: string; price: number; dish_image_url?: string }; section: Section }) => {
    const dishSupplements = getSupplementsForDish(item.id);
    const imageUrl = item.dish_image_url ?? (item as any).image_url;
    return (
      <View style={styles.dishRow}>
        <View style={styles.dishThumbWrap}>
          {imageUrl ? (
            <Image
              source={{ uri: getAbsoluteImageUrl(imageUrl) || imageUrl }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          ) : (
            <IconWrapper name="image-outline" size={26} color={Colors.textLight} />
          )}
        </View>
        <View style={styles.dishInfo}>
          <Text style={styles.dishName}>{item.name}</Text>
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
        </View>
        <View style={styles.dishRight}>
          <Text style={styles.dishPrice}>{item.price.toFixed(2)} €</Text>
          {!section.isAllDishes ? (
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => setDeleteTarget({ type: 'dish', id: item.id, name: item.name })}
              style={styles.deleteIconBtnRow}>
              <IconWrapper name="trash-outline" size={20} color={Colors.error} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => setAddDishToMenuTarget({ dishId: item.id, dishName: item.name })}
              style={styles.addToMenuBtn}>
              <IconWrapper name="add-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

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
      Alert.alert('Erreur', 'Nom du supplément requis.');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      Alert.alert('Erreur', 'Prix invalide.');
      return;
    }
    if (supplementDishId == null) {
      Alert.alert('Erreur', 'Choisissez un plat.');
      return;
    }
    setSupplementSubmitting(true);
    try {
      await createManagementSupplement({ name, price, dish_id: supplementDishId });
      setModalSupplement(false);
      load();
      Alert.alert('Succès', `Supplément « ${name} » créé et assigné au plat.`);
    } catch (e: any) {
      Alert.alert('Erreur', formatAxiosError(e, 'Impossible de créer le supplément.'));
    } finally {
      setSupplementSubmitting(false);
    }
  };

  const ListHeader = (
    <>
      <View style={styles.searchWrap}>
        <IconWrapper name="search-outline" size={20} color={Colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un plat ou un menu..."
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
      <View style={styles.addActionsBlock}>
        <View style={styles.addRow}>
          <TouchableOpacity style={styles.addButton} onPress={openDishModal}>
            <IconWrapper name="add" size={22} color={Colors.white} />
            <Text style={styles.addButtonText}>Plat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={openMenuModal}>
            <IconWrapper name="add" size={22} color={Colors.white} />
            <Text style={styles.addButtonText}>Menu</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.addButtonSupplement} onPress={openSupplementModal}>
          <IconWrapper name="add-outline" size={22} color={Colors.white} />
          <Text style={styles.addButtonSupplementText}>Supplément</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar navigation={navigation} title="Menu" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar navigation={navigation} title="Menu" />
      {sections.length === 0 ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.emptyScroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }>
          {ListHeader}
          <View style={styles.empty}>
            <IconWrapper name="restaurant-outline" size={56} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>Aucun plat ni menu</Text>
            <Text style={styles.emptyText}>Créez un menu ou un plat avec les boutons ci-dessus.</Text>
          </View>
        </ScrollView>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ListHeaderComponent={ListHeader}
          stickySectionHeadersEnabled
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
          ListFooterComponent={<View style={{ height: 24 }} />}
        />
      )}

      <Modal visible={modalDish} animationType="fade" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalFullScreen}>
          <View style={styles.modalFullHeader}>
            <Text style={styles.modalFullTitle}>Nouveau plat</Text>
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
              placeholder="Nom du plat *"
              value={dishName}
              onChangeText={setDishName}
              placeholderTextColor={Colors.textLight}
            />
            <TextInput
              style={[styles.input, styles.inputArea]}
              placeholder="Description"
              value={dishDesc}
              onChangeText={setDishDesc}
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={3}
            />
            <TextInput
              style={styles.input}
              placeholder="Prix (€) *"
              value={dishPrice}
              onChangeText={setDishPrice}
              placeholderTextColor={Colors.textLight}
              keyboardType="decimal-pad"
            />
            <View style={styles.imageUploadSection}>
              <Text style={styles.imageUploadLabel}>Photo du plat (URL ou upload)</Text>
              <TextInput
                style={[styles.input, { marginBottom: 8 }]}
                placeholder="URL de l'image (optionnel)"
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
                    <Text style={styles.changeImageBtnText}>{uploadingImage ? 'Upload...' : 'Changer'}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadImageBtn} onPress={handleImagePick} disabled={uploadingImage}>
                  {uploadingImage ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <IconWrapper name="image-outline" size={24} color={Colors.white} />
                      <Text style={styles.uploadImageBtnText}>Choisir une image (upload CDN)</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleCreateDish}
              disabled={submitting}>
              <Text style={styles.submitBtnText}>{submitting ? 'Création...' : 'Créer le plat'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={modalMenu} animationType="fade" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalFullScreen}>
          <View style={styles.modalFullHeader}>
            <Text style={styles.modalFullTitle}>Nouveau menu</Text>
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
              placeholder="Nom du menu *"
              value={menuName}
              onChangeText={setMenuName}
              placeholderTextColor={Colors.textLight}
            />
            <TextInput
              style={[styles.input, styles.inputArea]}
              placeholder="Description"
              value={menuDesc}
              onChangeText={setMenuDesc}
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={3}
            />
            <Text style={styles.inputLabel}>Prix (€)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex. 12.90"
              placeholderTextColor={Colors.textLight}
              keyboardType="decimal-pad"
              value={menuPrice}
              onChangeText={setMenuPrice}
            />
            <Text style={styles.inputLabel}>Image du menu</Text>
            <TextInput
              style={styles.input}
              placeholder="URL de l'image ou uploadez ci-dessous"
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
                {uploadingMenuImage ? 'Upload...' : 'Choisir une image'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleCreateMenu}
              disabled={submitting}>
              <Text style={styles.submitBtnText}>{submitting ? 'Création...' : 'Créer le menu'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmModal
        visible={confirmCreateDish}
        title="Créer ce plat ?"
        message={`Plat : ${dishName.trim() || '—'} à ${dishPrice || '0'} €. Confirmer la création ?`}
        confirmLabel="Créer"
        cancelLabel="Annuler"
        variant="primary"
        onConfirm={doCreateDish}
        onCancel={() => setConfirmCreateDish(false)}
      />
      <ConfirmModal
        visible={confirmCreateMenu}
        title="Créer ce menu ?"
        message={`Menu : ${menuName.trim() || '—'}${menuPrice.trim() ? ` • ${menuPrice} €` : ''}. Confirmer la création ?`}
        confirmLabel="Créer"
        cancelLabel="Annuler"
        variant="primary"
        onConfirm={doCreateMenu}
        onCancel={() => setConfirmCreateMenu(false)}
      />
      {/* Modal Nouveau supplément (slide vers le haut, comme Nouveau plat) */}
      <Modal visible={modalSupplement} animationType="fade" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalFullScreen}>
          <View style={styles.modalFullHeader}>
            <Text style={styles.modalFullTitle}>Nouveau supplément</Text>
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
            <Text style={styles.inputLabel}>Nom du supplément *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex. Portion supplémentaire, Sauce"
              placeholderTextColor={Colors.textLight}
              value={supplementName}
              onChangeText={setSupplementName}
            />
            <Text style={styles.inputLabel}>Prix (€) *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={Colors.textLight}
              keyboardType="decimal-pad"
              value={supplementPrice}
              onChangeText={setSupplementPrice}
            />
            <Text style={styles.inputLabel}>Assigner au plat</Text>
            {allDishes.length === 0 ? (
              <Text style={styles.mutedText}>Aucun plat. Créez d'abord un plat.</Text>
            ) : (
              <ScrollView style={styles.dishPickList} nestedScrollEnabled>
                {allDishes.map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.dishPickRow, supplementDishId === d.id && styles.dishPickRowSelected]}
                    onPress={() => setSupplementDishId(d.id)}>
                    <Text style={styles.dishPickName}>{d.name}</Text>
                    {supplementDishId === d.id ? (
                      <IconWrapper name="checkmark-circle" size={22} color={Colors.primary} />
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
                {supplementSubmitting ? 'Création...' : 'Créer le supplément'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmModal
        visible={deleteTarget !== null}
        title={deleteTarget?.type === 'dish' ? 'Supprimer ce plat ?' : 'Supprimer ce menu ?'}
        message={
          deleteTarget
            ? `« ${deleteTarget.name} » sera définitivement supprimé.`
            : ''
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Modal Ajouter le plat à un menu */}
      <Modal visible={addDishToMenuTarget !== null} transparent animationType="fade">
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setAddDishToMenuTarget(null)} />
        <View style={styles.modalCenterWrap}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Ajouter à un menu</Text>
          <Text style={styles.modalSubtitle}>
            {addDishToMenuTarget ? `« ${addDishToMenuTarget.dishName} »` : ''}
          </Text>
          <ScrollView style={{ maxHeight: 240 }}>
            {menus.length === 0 ? (
              <Text style={styles.mutedText}>Aucun menu. Créez d'abord un menu.</Text>
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
                      Alert.alert('Succès', `Plat ajouté au menu « ${menu.name} ».`);
                    } catch (e: any) {
                      Alert.alert('Erreur', formatAxiosError(e, 'Impossible d\'ajouter au menu.'));
                    }
                  }}>
                  <Text style={styles.menuPickName}>{menu.name}</Text>
                  <IconWrapper name="add-circle-outline" size={22} color={Colors.primary} />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddDishToMenuTarget(null)}>
            <Text style={styles.cancelBtnText}>Annuler</Text>
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
  emptyScroll: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addActionsBlock: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  addRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  addButtonSupplement: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryDark,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  addButtonSupplementText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.primaryDark,
    paddingVertical: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryDark,
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
    fontSize: 16,
    color: Colors.primaryDark,
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
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  modalBtnCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  modalBtnConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
    borderRadius: 10,
    gap: 10,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  deleteIconBtn: {
    padding: 4,
  },
  deleteIconBtnRow: {
    padding: 4,
    marginLeft: 8,
  },
  dishRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: secondaryFont,
  },
  dishRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    padding: 14,
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
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
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryDark,
    fontFamily: secondaryFont,
  },
  dishDesc: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 4,
  },
  dishPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  modalFullScreen: {
    flex: 1,
    backgroundColor: Colors.primary,
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
    ...StyleSheet.absoluteFillObject,
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
    color: Colors.primaryDark,
    fontFamily: secondaryFont,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 12,
  },
  inputArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  imageUploadSection: {
    marginBottom: 16,
  },
  imageUploadLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryDark,
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
    backgroundColor: Colors.primary,
  },
  changeImageBtnText: {
    fontSize: 14,
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
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  uploadImageBtnText: {
    fontSize: 14,
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
    fontSize: 11,
    color: Colors.textLight,
    backgroundColor: Colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  addToMenuBtn: {
    padding: 4,
    marginLeft: 8,
  },
  modalSubtitle: {
    fontSize: 14,
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
    fontSize: 16,
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  cancelBtn: {
    marginTop: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  mutedText: {
    fontSize: 14,
    color: Colors.textLight,
    paddingVertical: 12,
    textAlign: 'center',
  },
});

export default RestaurantMenuScreen;
