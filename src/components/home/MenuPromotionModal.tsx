import React from 'react';
import {Modal, View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView} from 'react-native';
import IconWrapper from '../IconWrapper';
import {Colors} from '../../utils/colors';
import type {MenuApi} from '../../services/menus';

const namkeFallback = require('../../assets/namke-fallback.png');

interface MenuPromotionModalProps {
  visible: boolean;
  loading?: boolean;
  menu?: MenuApi | null;
  onClose: () => void;
  onAddToCart: (menu: MenuApi) => void;
}

const formatPrice = (p?: number | null) => {
  if (p == null || Number.isNaN(Number(p))) return '—';
  return `${Number(p).toFixed(2).replace('.', ',')} €`;
};

const MenuPromotionModal: React.FC<MenuPromotionModalProps> = ({
  visible,
  loading,
  menu,
  onClose,
  onAddToCart,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {menu?.name ?? 'Menu'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <IconWrapper name="close" size={22} color={Colors.textLight} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.imageWrap}>
                {menu?.image_url ? (
                  <Image source={{uri: menu.image_url}} style={styles.image} resizeMode="cover" />
                ) : (
                  <Image source={namkeFallback} style={styles.image} resizeMode="cover" />
                )}
              </View>

              {menu?.description ? <Text style={styles.description}>{menu.description}</Text> : null}

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Prix</Text>
                <Text style={styles.price}>{formatPrice(menu?.price)}</Text>
              </View>
            </ScrollView>
          )}

          <TouchableOpacity
            style={[styles.addButton, (!menu || loading) && styles.addButtonDisabled]}
            disabled={!menu || loading}
            onPress={() => menu && onAddToCart(menu)}
            activeOpacity={0.85}>
            <IconWrapper name="cart-outline" size={18} color={Colors.white} />
            <Text style={styles.addButtonText}>Ajouter au panier</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primaryDark ?? Colors.primary,
    marginRight: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  imageWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.gray[100],
  },
  description: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  addButton: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default MenuPromotionModal;
