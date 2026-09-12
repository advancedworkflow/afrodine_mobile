import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Switch,
} from 'react-native';
import {alert} from '../../utils/alert';
import TopBar from '../../components/TopBar';
import IconWrapper from '../../components/IconWrapper';
import {Colors} from '../../utils/colors';
import {secondaryFont} from '../../utils/fonts';
import {formatAxiosError} from '../../utils/formatApiError';
import {
  createManagementGroceryProduct,
  updateManagementGroceryProduct,
  uploadManagementImageFile,
  type ManagementGroceryProduct,
} from '../../services/restaurantManagement';

const UNITS = ['piece', 'kg', 'g', 'l', 'ml', 'paquet'];

const GroceryProductFormScreen = ({navigation, route}: any) => {
  const product = route.params?.product as ManagementGroceryProduct | undefined;
  const isEdit = product != null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [originCountry, setOriginCountry] = useState('');
  const [originRegion, setOriginRegion] = useState('');
  const [isAfrican, setIsAfrican] = useState(false);
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [unit, setUnit] = useState('piece');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<{click: () => void} | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.name ?? '');
      setDescription(product.description ?? '');
      setCategory(product.category ?? '');
      setOriginCountry(product.origin_country ?? '');
      setOriginRegion(product.origin_region ?? '');
      setIsAfrican(!!product.is_african);
      setPrice(product.price != null ? String(product.price) : '');
      setStockQuantity(product.stock_quantity != null ? String(product.stock_quantity) : '0');
      setUnit(product.unit ?? 'piece');
      setImageUrl(product.image_url ?? '');
      setIsActive(product.is_active ?? true);
    }
  }, [product]);

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
        const {image_url} = await uploadManagementImageFile(file, 'grocery');
        setImageUrl(image_url || '');
      } catch {
        alert('Erreur', "Impossible d'uploader l'image.");
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

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const priceNum = parseFloat(price.replace(',', '.'));
    const stockNum = parseInt(stockQuantity, 10);

    if (!trimmedName) {
      alert('Champ requis', 'Le nom du produit est obligatoire.');
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      alert('Prix invalide', 'Saisissez un prix positif.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: trimmedName,
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        origin_country: originCountry.trim() || undefined,
        origin_region: originRegion.trim() || undefined,
        is_african: isAfrican,
        price: priceNum,
        stock_quantity: Number.isFinite(stockNum) ? Math.max(0, stockNum) : 0,
        unit: unit.trim() || 'piece',
        image_url: imageUrl.trim() || undefined,
        is_active: isActive,
      };
      if (isEdit && product) {
        await updateManagementGroceryProduct(product.id, payload);
        alert('Succès', 'Produit mis à jour.', [{text: 'OK', onPress: () => navigation.goBack()}]);
      } else {
        await createManagementGroceryProduct(payload);
        alert('Succès', 'Produit créé.', [{text: 'OK', onPress: () => navigation.goBack()}]);
      }
    } catch (e) {
      alert('Erreur', formatAxiosError(e, "Erreur lors de l'enregistrement"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TopBar
        navigation={navigation}
        title={isEdit ? 'Modifier le produit' : 'Nouveau produit'}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>Image</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={handleImagePick} activeOpacity={0.8}>
            {uploadingImage ? (
              <ActivityIndicator size="small" color={Colors.darkGreen} />
            ) : imageUrl ? (
              <Image source={{uri: imageUrl}} style={styles.imagePreview} resizeMode="cover" />
            ) : (
              <>
                <IconWrapper name="image-outline" size={28} color={Colors.textLight} />
                <Text style={styles.imagePickerText}>
                  {Platform.OS === 'web' ? 'Choisir une image' : 'Non disponible sur mobile'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Informations</Text>

          <Text style={styles.label}>Nom *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nom du produit"
            placeholderTextColor={Colors.textLight}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Description (optionnel)"
            placeholderTextColor={Colors.textLight}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Catégorie</Text>
          <TextInput
            style={styles.input}
            value={category}
            onChangeText={setCategory}
            placeholder="Ex : Épices, Boissons..."
            placeholderTextColor={Colors.textLight}
          />

          <Text style={styles.sectionTitle}>Origine</Text>
          <Text style={styles.label}>Pays d'origine</Text>
          <TextInput
            style={styles.input}
            value={originCountry}
            onChangeText={setOriginCountry}
            placeholder="Ex : Sénégal"
            placeholderTextColor={Colors.textLight}
          />

          <Text style={styles.label}>Région d'origine</Text>
          <TextInput
            style={styles.input}
            value={originRegion}
            onChangeText={setOriginRegion}
            placeholder="Optionnel"
            placeholderTextColor={Colors.textLight}
          />

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Produit africain</Text>
            <Switch
              value={isAfrican}
              onValueChange={setIsAfrican}
              trackColor={{false: Colors.gray[300], true: Colors.darkGreen}}
              thumbColor={Colors.white}
            />
          </View>

          <Text style={styles.sectionTitle}>Prix et stock</Text>
          <Text style={styles.label}>Prix (€) *</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            placeholderTextColor={Colors.textLight}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Quantité en stock</Text>
          <TextInput
            style={styles.input}
            value={stockQuantity}
            onChangeText={setStockQuantity}
            placeholder="0"
            placeholderTextColor={Colors.textLight}
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Unité</Text>
          <View style={styles.unitGrid}>
            {UNITS.map(u => (
              <TouchableOpacity
                key={u}
                style={[styles.optionBtn, unit === u && styles.optionBtnActive]}
                onPress={() => setUnit(u)}>
                <Text style={[styles.optionBtnText, unit === u && styles.optionBtnTextActive]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Produit actif</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{false: Colors.gray[300], true: Colors.darkGreen}}
              thumbColor={Colors.white}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}>
            {submitting ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>{isEdit ? 'Enregistrer' : 'Créer le produit'}</Text>
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
    minHeight: 70,
    textAlignVertical: 'top',
  },
  imagePicker: {
    height: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
  unitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  optionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  optionBtnActive: {
    borderColor: Colors.darkGreen,
    backgroundColor: Colors.olive + '30',
  },
  optionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  optionBtnTextActive: {
    color: Colors.darkGreen,
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

export default GroceryProductFormScreen;
