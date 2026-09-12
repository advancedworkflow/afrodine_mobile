import React, {useCallback, useEffect, useState} from 'react';
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
  Linking,
} from 'react-native';
import {alert} from '../../utils/alert';
import TopBar from '../../components/TopBar';
import IconWrapper from '../../components/IconWrapper';
import {Colors} from '../../utils/colors';
import {secondaryFont} from '../../utils/fonts';
import {formatAxiosError} from '../../utils/formatApiError';
import {
  getWalletInfo,
  requestPayout,
  getStripeConnectStatus,
  getStripeConnectBalance,
  getStripeConnectPayouts,
  createStripeConnectOnboardingLink,
  type StripeConnectStatus,
  type StripeConnectBalance,
  type StripeConnectPayout,
} from '../../services/restaurantManagement';

const PAYOUT_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  in_transit: 'En transit',
  paid: 'Payé',
  failed: 'Échoué',
  canceled: 'Annulé',
};

const WalletScreen = ({navigation}: any) => {
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [connectStatus, setConnectStatus] = useState<StripeConnectStatus | null>(null);
  const [connectBalance, setConnectBalance] = useState<StripeConnectBalance | null>(null);
  const [payouts, setPayouts] = useState<StripeConnectPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payoutModalVisible, setPayoutModalVisible] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [info, statusData] = await Promise.all([getWalletInfo(), getStripeConnectStatus()]);
      setWalletBalance(info?.balance ?? info?.available_balance ?? 0);
      setConnectStatus(statusData);

      const shouldLoadStripeDetails =
        !!statusData &&
        (statusData.charges_enabled === true ||
          statusData.payouts_enabled === true ||
          statusData.details_submitted === true);

      if (shouldLoadStripeDetails) {
        const [balanceData, payoutsData] = await Promise.all([
          getStripeConnectBalance(),
          getStripeConnectPayouts(30),
        ]);
        setConnectBalance(balanceData);
        setPayouts(Array.isArray(payoutsData) ? payoutsData : []);
      } else {
        setConnectBalance(null);
        setPayouts([]);
      }
    } catch {
      setWalletBalance(0);
      setConnectStatus(null);
      setConnectBalance(null);
      setPayouts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onConfirmPayout = async () => {
    const amount = parseFloat(payoutAmount.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      alert('Montant invalide', 'Saisissez un montant positif.');
      return;
    }
    if (amount > walletBalance) {
      alert('Solde insuffisant', `Solde disponible : ${walletBalance.toFixed(2)} €`);
      return;
    }
    setPayoutLoading(true);
    try {
      const result = await requestPayout(amount, 'Retrait manuel');
      if (result?.success) {
        setPayoutModalVisible(false);
        setPayoutAmount('');
        alert('Succès', `Payout de ${amount.toFixed(2)} € demandé. Arrivée sous 1-3 jours ouvrés.`);
        load(true);
      } else {
        alert('Erreur', (result as any)?.message ?? "Impossible d'effectuer le retrait.");
      }
    } catch (e) {
      alert('Erreur', formatAxiosError(e, "Impossible d'effectuer le retrait."));
    } finally {
      setPayoutLoading(false);
    }
  };

  const onOpenConnectOnboarding = async () => {
    setConnectLoading(true);
    try {
      const link = await createStripeConnectOnboardingLink();
      if (!link?.url) {
        alert('Stripe Connect', 'Impossible de générer le lien onboarding pour le moment.');
        return;
      }
      const canOpen = await Linking.canOpenURL(link.url);
      if (!canOpen) {
        alert('Stripe Connect', "Impossible d'ouvrir le navigateur sur cet appareil.");
        return;
      }
      await Linking.openURL(link.url);
    } catch {
      alert('Stripe Connect', "Impossible d'ouvrir le lien onboarding. Réessayez.");
    } finally {
      setConnectLoading(false);
    }
  };

  const connectActive = connectStatus?.charges_enabled && connectStatus?.payouts_enabled;

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar navigation={navigation} title="Portefeuille" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.darkGreen} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar navigation={navigation} title="Portefeuille" showBackButton onBackPress={() => navigation.goBack()} />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[Colors.darkGreen]} />
        }>
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <IconWrapper name="wallet-outline" size={22} color={Colors.darkGreen} />
            <Text style={styles.sectionTitle}>Solde</Text>
          </View>
          <Text style={styles.walletBalance}>{walletBalance.toFixed(2)} € disponibles</Text>
          <TouchableOpacity
            style={[styles.payoutButton, walletBalance <= 0 && styles.payoutButtonDisabled]}
            onPress={() => setPayoutModalVisible(true)}
            activeOpacity={0.8}
            disabled={walletBalance <= 0}>
            <IconWrapper name="card-outline" size={20} color={Colors.white} />
            <Text style={styles.payoutButtonText}>Effectuer un payout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <IconWrapper name="card-outline" size={22} color={Colors.darkGreen} />
            <Text style={styles.sectionTitle}>Stripe Connect</Text>
          </View>
          <View style={styles.connectRow}>
            <Text style={styles.connectLabel}>Statut</Text>
            <Text style={styles.connectValue}>{connectActive ? 'Actif' : connectStatus?.status || 'Non configuré'}</Text>
          </View>
          <View style={styles.connectRow}>
            <Text style={styles.connectLabel}>Disponible Connect</Text>
            <Text style={styles.connectValue}>{(connectBalance?.available_balance ?? 0).toFixed(2)} €</Text>
          </View>
          <View style={[styles.connectRow, styles.connectRowLast]}>
            <Text style={styles.connectLabel}>En attente Connect</Text>
            <Text style={styles.connectValue}>{(connectBalance?.pending_balance ?? 0).toFixed(2)} €</Text>
          </View>
          <TouchableOpacity
            style={styles.connectButton}
            onPress={onOpenConnectOnboarding}
            activeOpacity={0.8}
            disabled={connectLoading}>
            {connectLoading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.connectButtonText}>Activer / Mettre à jour Connect</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique des virements</Text>
          {payouts.length === 0 ? (
            <Text style={styles.mutedText}>Aucun virement pour le moment.</Text>
          ) : (
            payouts.map((payout, index) => (
              <View key={payout.id ?? payout.stripe_payout_id ?? index} style={styles.payoutRow}>
                <View style={styles.payoutRowLeft}>
                  <Text style={styles.payoutDate}>
                    {payout.created_at ? new Date(payout.created_at).toLocaleDateString('fr-FR') : '—'}
                  </Text>
                  <Text style={styles.payoutStatus}>
                    {PAYOUT_STATUS_LABELS[payout.status ?? ''] ?? payout.status ?? '—'}
                  </Text>
                </View>
                <Text style={styles.payoutAmount}>
                  {payout.amount != null ? `${Number(payout.amount).toFixed(2)} €` : '—'}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={payoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !payoutLoading && setPayoutModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Effectuer un payout</Text>
            <Text style={styles.modalHint}>Montant à retirer (€)</Text>
            <TextInput
              style={styles.modalInput}
              value={payoutAmount}
              onChangeText={setPayoutAmount}
              placeholder="0.00"
              placeholderTextColor={Colors.textLight}
              keyboardType="decimal-pad"
              editable={!payoutLoading}
            />
            <Text style={styles.modalBalance}>Solde : {walletBalance.toFixed(2)} €</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => !payoutLoading && setPayoutModalVisible(false)}
                disabled={payoutLoading}>
                <Text style={styles.modalBtnCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={onConfirmPayout}
                disabled={payoutLoading}>
                {payoutLoading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.modalBtnConfirmText}>Confirmer</Text>
                )}
              </TouchableOpacity>
            </View>
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
  contentInner: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
    marginBottom: 12,
  },
  walletBalance: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
    marginBottom: 12,
  },
  payoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.darkGreen,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 4,
  },
  payoutButtonDisabled: {
    opacity: 0.5,
  },
  payoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: secondaryFont,
  },
  connectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  connectRowLast: {
    borderBottomWidth: 0,
  },
  connectLabel: {
    fontSize: 13,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  connectValue: {
    fontSize: 14,
    color: Colors.darkGreen,
    fontWeight: '600',
    fontFamily: secondaryFont,
  },
  connectButton: {
    marginTop: 12,
    backgroundColor: Colors.darkGreen,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  connectButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: secondaryFont,
  },
  mutedText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  payoutRowLeft: {
    gap: 2,
  },
  payoutDate: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  payoutStatus: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  payoutAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalHint: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    color: Colors.darkGreen,
    marginBottom: 8,
  },
  modalBalance: {
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: Colors.border,
  },
  modalBtnConfirm: {
    backgroundColor: Colors.darkGreen,
  },
  modalBtnCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
  },
  modalBtnConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: secondaryFont,
  },
});

export default WalletScreen;
