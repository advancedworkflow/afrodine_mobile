import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Switch,
} from 'react-native';
import {alert} from '../../utils/alert';
import TopBar from '../../components/TopBar';
import IconWrapper from '../../components/IconWrapper';
import ConfirmModal from '../../components/ConfirmModal';
import {Colors} from '../../utils/colors';
import {secondaryFont} from '../../utils/fonts';
import {formatAxiosError} from '../../utils/formatApiError';
import {
  getManagementGroceryShop,
  createManagementGroceryShop,
  updateManagementGroceryShop,
  listManagementGroceryProducts,
  updateManagementGroceryProduct,
  deleteManagementGroceryProduct,
  type ManagementGroceryShop,
  type ManagementGroceryProduct,
} from '../../services/restaurantManagement';

const LOW_STOCK_THRESHOLD = 5;

const GroceryManagementScreen = ({navigation}: any) => {
  const [shop, setShop] = useState<ManagementGroceryShop | null>(null);
  const [products, setProducts] = useState<ManagementGroceryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagementGroceryProduct | null>(null);

  const [editingShop, setEditingShop] = useState(false);
  const [shopName, setShopName] = useState('');
  const [shopDesc, setShopDesc] = useState('');
  const [shopActive, setShopActive] = useState(true);
  const [savingShop, setSavingShop] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const shopData = await getManagementGroceryShop();
      setShop(shopData);
      if (shopData) {
        const productsData = await listManagementGroceryProducts();
        setProducts(productsData);
      } else {
        setProducts([]);
      }
    } catch {
      setShop(null);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openShopEditor = () => {
    setShopName(shop?.name ?? '');
    setShopDesc(shop?.description ?? '');
    setShopActive(shop?.is_active ?? true);
    setEditingShop(true);
  };

  const handleSaveShop = async () => {
    if (!shopName.trim()) {
      alert('Champ requis', 'Le nom du magasin est obligatoire.');
      return;
    }
    setSavingShop(true);
    try {
      const payload = {
        name: shopName.trim(),
        description: shopDesc.trim() || undefined,
        is_active: shopActive,
      };
      const updated = shop
        ? await updateManagementGroceryShop(payload)
        : await createManagementGroceryShop(payload);
      setShop(updated);
      setEditingShop(false);
      if (!shop) load();
    } catch (e) {
      alert('Erreur', formatAxiosError(e, "Impossible d'enregistrer le magasin."));
    } finally {
      setSavingShop(false);
    }
  };

  const adjustStock = async (product: ManagementGroceryProduct, delta: number) => {
    const nextStock = Math.max(0, product.stock_quantity + delta);
    if (nextStock === product.stock_quantity) return;
    setBusyId(product.id);
    try {
      const updated = await updateManagementGroceryProduct(product.id, {stock_quantity: nextStock});
      setProducts(prev => prev.map(p => (p.id === product.id ? updated : p)));
    } catch (e) {
      alert('Erreur', formatAxiosError(e, 'Impossible de mettre à jour le stock.'));
    } finally {
      setBusyId(null);
    }
  };

  const toggleProductActive = async (product: ManagementGroceryProduct) => {
    setBusyId(product.id);
    try {
      const updated = await updateManagementGroceryProduct(product.id, {is_active: !product.is_active});
      setProducts(prev => prev.map(p => (p.id === product.id ? updated : p)));
    } catch (e) {
      alert('Erreur', formatAxiosError(e, 'Impossible de changer le statut.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    try {
      await deleteManagementGroceryProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      alert('Erreur', formatAxiosError(e, 'Impossible de supprimer ce produit.'));
    }
  };

  const totalCount = products.length;
  const activeCount = products.filter(p => p.is_active).length;
  const inactiveCount = totalCount - activeCount;
  const lowStockCount = products.filter(p => p.stock_quantity <= LOW_STOCK_THRESHOLD).length;

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar navigation={navigation} title="Grocery shop" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.darkGreen} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar navigation={navigation} title="Grocery shop" showBackButton onBackPress={() => navigation.goBack()} />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[Colors.darkGreen]} />}>
        {!shop && !editingShop ? (
          <View style={styles.empty}>
            <IconWrapper name="storefront-outline" size={56} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>Aucun magasin grocery</Text>
            <Text style={styles.emptyText}>
              Créez votre magasin pour vendre des produits d'épicerie en plus de votre menu.
            </Text>
            <TouchableOpacity style={styles.addButton} onPress={openShopEditor} activeOpacity={0.8}>
              <IconWrapper name="add-circle-outline" size={22} color={Colors.white} />
              <Text style={styles.addButtonText}>Créer mon magasin</Text>
            </TouchableOpacity>
          </View>
        ) : editingShop ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{shop ? 'Modifier le magasin' : 'Créer le magasin'}</Text>
            <Text style={styles.label}>Nom *</Text>
            <TextInput
              style={styles.input}
              value={shopName}
              onChangeText={setShopName}
              placeholder="Nom du magasin"
              placeholderTextColor={Colors.textLight}
            />
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={shopDesc}
              onChangeText={setShopDesc}
              placeholder="Description (optionnel)"
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={3}
            />
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Magasin actif</Text>
              <Switch
                value={shopActive}
                onValueChange={setShopActive}
                trackColor={{false: Colors.gray[300], true: Colors.darkGreen}}
                thumbColor={Colors.white}
              />
            </View>
            <View style={styles.formActions}>
              {shop && (
                <TouchableOpacity
                  style={[styles.formBtn, styles.formBtnCancel]}
                  onPress={() => setEditingShop(false)}
                  disabled={savingShop}>
                  <Text style={styles.formBtnCancelText}>Annuler</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.formBtn, styles.formBtnConfirm, savingShop && styles.formBtnDisabled]}
                onPress={handleSaveShop}
                disabled={savingShop}>
                {savingShop ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.formBtnConfirmText}>{shop ? 'Enregistrer' : 'Créer'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.shopHeaderRow}>
                <View style={styles.shopHeaderLeft}>
                  <Text style={styles.shopName}>{shop!.name}</Text>
                  {shop!.description ? <Text style={styles.shopDesc}>{shop!.description}</Text> : null}
                </View>
                <TouchableOpacity onPress={openShopEditor} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <IconWrapper name="create-outline" size={22} color={Colors.darkGreen} />
                </TouchableOpacity>
              </View>
              <View style={[styles.statusBadge, shop!.is_active ? styles.statusActive : styles.statusInactive]}>
                <Text style={styles.statusBadgeText}>{shop!.is_active ? 'Actif' : 'Inactif'}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{totalCount}</Text>
                <Text style={styles.statLabel}>Produits</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{activeCount}</Text>
                <Text style={styles.statLabel}>Actifs</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{inactiveCount}</Text>
                <Text style={styles.statLabel}>Inactifs</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, lowStockCount > 0 && styles.statValueWarning]}>{lowStockCount}</Text>
                <Text style={styles.statLabel}>Stock bas</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('GroceryProductForm', {shopId: shop!.id})}
              activeOpacity={0.8}>
              <IconWrapper name="add-circle-outline" size={22} color={Colors.white} />
              <Text style={styles.addButtonText}>Nouveau produit</Text>
            </TouchableOpacity>

            {products.length === 0 ? (
              <View style={styles.empty}>
                <IconWrapper name="basket-outline" size={56} color={Colors.textLight} />
                <Text style={styles.emptyTitle}>Aucun produit</Text>
                <Text style={styles.emptyText}>Ajoutez vos premiers produits d'épicerie.</Text>
              </View>
            ) : (
              products.map(product => (
                <View key={product.id} style={styles.productCard}>
                  <TouchableOpacity
                    style={styles.productBody}
                    onPress={() => navigation.navigate('GroceryProductForm', {shopId: shop!.id, product})}
                    activeOpacity={0.8}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {product.name}
                      </Text>
                      <View
                        style={[styles.statusBadge, product.is_active ? styles.statusActive : styles.statusInactive]}>
                        <Text style={styles.statusBadgeText}>{product.is_active ? 'Actif' : 'Inactif'}</Text>
                      </View>
                    </View>
                    <View style={styles.cardMetaRow}>
                      {product.category ? (
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>{product.category}</Text>
                        </View>
                      ) : null}
                      <Text style={styles.cardMeta}>{Number(product.price).toFixed(2)} € / {product.unit}</Text>
                    </View>
                    {product.stock_quantity <= LOW_STOCK_THRESHOLD && (
                      <View style={styles.lowStockRow}>
                        <IconWrapper name="alert-circle-outline" size={14} color={Colors.warning} />
                        <Text style={styles.lowStockText}>Stock bas</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <View style={styles.productActions}>
                    <View style={styles.stockStepper}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => adjustStock(product, -1)}
                        disabled={busyId === product.id || product.stock_quantity <= 0}
                        hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                        <IconWrapper name="remove" size={16} color={Colors.darkGreen} />
                      </TouchableOpacity>
                      <Text style={styles.stockValue}>
                        {busyId === product.id ? '…' : product.stock_quantity}
                      </Text>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => adjustStock(product, 1)}
                        disabled={busyId === product.id}
                        hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                        <IconWrapper name="add" size={16} color={Colors.darkGreen} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.rowActions}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => toggleProductActive(product)}
                        disabled={busyId === product.id}
                        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                        <IconWrapper
                          name={product.is_active ? 'pause-circle-outline' : 'play-circle-outline'}
                          size={22}
                          color={product.is_active ? Colors.warning : Colors.success}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => setDeleteTarget(product)}
                        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                        <IconWrapper name="trash-outline" size={22} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      <ConfirmModal
        visible={deleteTarget != null}
        title="Supprimer le produit"
        message={`Supprimer "${deleteTarget?.name}" ?`}
        confirmLabel="Supprimer"
        onConfirm={handleDeleteProduct}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
      />
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
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkGreen,
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
    fontSize: 15,
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  textArea: {
    minHeight: 70,
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
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  formBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formBtnDisabled: {
    opacity: 0.7,
  },
  formBtnCancel: {
    backgroundColor: Colors.gray[100],
  },
  formBtnCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  formBtnConfirm: {
    backgroundColor: Colors.darkGreen,
  },
  formBtnConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: secondaryFont,
  },
  shopHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  shopHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
  },
  shopDesc: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 4,
    fontFamily: secondaryFont,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
  },
  statValueWarning: {
    color: Colors.warning,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.darkGreen,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: secondaryFont,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
    fontFamily: secondaryFont,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    paddingHorizontal: 16,
    fontFamily: secondaryFont,
  },
  productCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
  },
  productBody: {
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
    flex: 1,
    marginRight: 8,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardMeta: {
    fontSize: 13,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  categoryBadge: {
    backgroundColor: Colors.olive + '30',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
  },
  lowStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  lowStockText: {
    fontSize: 12,
    color: Colors.warning,
    fontFamily: secondaryFont,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  statusActive: {
    backgroundColor: Colors.success + '30',
  },
  statusInactive: {
    backgroundColor: Colors.border,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textDark,
    fontFamily: secondaryFont,
  },
  productActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  stockStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.olive + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
    minWidth: 24,
    textAlign: 'center',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionBtn: {
    padding: 2,
  },
});

export default GroceryManagementScreen;
