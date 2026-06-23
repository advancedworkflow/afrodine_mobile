import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import IconWrapper from './IconWrapper';
import {Colors} from '../utils/colors';
import {secondaryFont} from '../utils/fonts';

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'primary' | 'neutral';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
  variant = 'neutral',
}) => {
  const isDanger = variant === 'danger';
  const isPrimary = variant === 'primary';
  const confirmBg = isDanger ? Colors.error : isPrimary ? Colors.primary : Colors.gray[700];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onCancel} />
        <View style={styles.box}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.8}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton, {backgroundColor: confirmBg}]}
              onPress={onConfirm}
              activeOpacity={0.8}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 24,
  },
  box: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    }),
    ...(Platform.OS !== 'web' && {
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.15,
      shadowRadius: 12,
    }),
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: secondaryFont,
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: Colors.textLight,
    fontFamily: secondaryFont,
    marginBottom: 24,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.gray[100],
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  confirmButton: {},
  confirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: secondaryFont,
  },
});

export default ConfirmModal;
