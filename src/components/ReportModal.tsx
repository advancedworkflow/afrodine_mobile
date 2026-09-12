import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import {alert} from '../utils/alert';
import IconWrapper from './IconWrapper';
import {Colors} from '../utils/colors';
import {secondaryFont} from '../utils/fonts';
import {createComplaint, ComplaintReason} from '../services/complaints';
import {formatAxiosError} from '../utils/formatApiError';

const REASONS: {value: ComplaintReason; label: string}[] = [
  {value: 'inappropriate_content', label: 'Contenu inapproprié'},
  {value: 'fake_information', label: 'Fausses informations'},
  {value: 'spam', label: 'Spam'},
  {value: 'harassment', label: 'Harcèlement'},
  {value: 'illegal_activity', label: 'Activité illégale'},
  {value: 'other', label: 'Autre'},
];

export interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  restaurantId?: number;
  title?: string;
}

const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  restaurantId,
  title = 'Signaler ce restaurant',
}) => {
  const [reason, setReason] = useState<ComplaintReason | null>(null);
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setReason(null);
    setMessage('');
    setContact('');
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!reason) {
      alert('Motif requis', 'Sélectionnez un motif de signalement.');
      return;
    }
    if (message.trim().length < 10) {
      alert('Description trop courte', 'Décrivez le problème en au moins 10 caractères.');
      return;
    }
    setSubmitting(true);
    try {
      await createComplaint({
        restaurant_id: restaurantId,
        reason,
        message: message.trim(),
        contact: contact.trim() || undefined,
      });
      alert('Signalement envoyé', 'Merci, notre équipe va examiner votre signalement.');
      reset();
      onClose();
    } catch (e) {
      alert('Erreur', formatAxiosError(e, "Impossible d'envoyer le signalement."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />
        <View style={styles.box}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <IconWrapper name="flag-outline" size={18} color={Colors.error} />
              </View>
              <Text style={styles.title}>{title}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <IconWrapper name="close" size={22} color={Colors.textLight} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Motif du signalement *</Text>
            <View style={styles.reasonGrid}>
              {REASONS.map(r => (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.optionBtn, reason === r.value && styles.optionBtnActive]}
                  onPress={() => setReason(r.value)}>
                  <Text style={[styles.optionBtnText, reason === r.value && styles.optionBtnTextActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Description détaillée *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder="Décrivez le problème en détail..."
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Contact (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={contact}
              onChangeText={setContact}
              placeholder="Email ou téléphone pour vous recontacter"
              placeholderTextColor={Colors.textLight}
            />
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleClose} disabled={submitting}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}>
              <Text style={styles.submitText}>{submitting ? 'Envoi...' : 'Envoyer'}</Text>
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
    padding: 20,
  },
  box: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  body: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryDark,
    marginBottom: 8,
    fontFamily: secondaryFont,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 14,
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
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
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '30',
  },
  optionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  optionBtnTextActive: {
    color: Colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
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
  submitButton: {
    backgroundColor: Colors.error,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: secondaryFont,
  },
});

export default ReportModal;
