import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  AppState,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {alert} from '../../utils/alert';
import TopBar from '../../components/TopBar';
import IconWrapper from '../../components/IconWrapper';
import {Colors} from '../../utils/colors';
import {secondaryFont} from '../../utils/fonts';
import {formatAxiosError} from '../../utils/formatApiError';
import {
  getLedgerBalance,
  getLedgerPayouts,
  requestLedgerWithdrawal,
  getStripeConnectStatus,
  createStripeConnectOnboardingLink,
  createStripeConnectDashboardLink,
  type StripeConnectStatus,
  type LedgerBalance,
  type LedgerPayout,
} from '../../services/restaurantManagement';

const WalletScreen = ({navigation}: any) => {
  const {t, i18n} = useTranslation();
  const PAYOUT_STATUS_LABELS: Record<string, string> = {
    en_attente: t('restaurantWallet.payoutStatus.pending'),
    envoye: t('restaurantWallet.payoutStatus.inTransit'),
    confirme: t('restaurantWallet.payoutStatus.paid'),
    echoue: t('restaurantWallet.payoutStatus.failed'),
  };
  const dateLocale = i18n.language === 'en' ? 'en-GB' : i18n.language === 'de' ? 'de-DE' : 'fr-FR';
  const [balance, setBalance] = useState<LedgerBalance | null>(null);
  const [connectStatus, setConnectStatus] = useState<StripeConnectStatus | null>(null);
  const [payouts, setPayouts] = useState<LedgerPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [balanceData, statusData, payoutsData] = await Promise.all([
        getLedgerBalance(),
        getStripeConnectStatus(),
        getLedgerPayouts(30),
      ]);
      setBalance(balanceData);
      setConnectStatus(statusData);
      setPayouts(payoutsData);
    } catch {
      setBalance(null);
      setConnectStatus(null);
      setPayouts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Retour depuis l'onboarding Stripe (navigateur) : on resynchronise le statut
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') load(true);
    });
    return () => sub.remove();
  }, [load]);

  const available = balance?.available_balance ?? 0;
  const threshold = balance?.payout_threshold ?? 0;
  const payoutsReady = connectStatus?.payouts_enabled === true;
  const canWithdraw = payoutsReady && threshold > 0 && available >= threshold;

  const doWithdraw = async () => {
    setPayoutLoading(true);
    try {
      const payout = await requestLedgerWithdrawal();
      alert(t('restaurantWallet.successTitle'), t('restaurantWallet.payoutRequestedMessage', {amount: Number(payout.amount).toFixed(2)}));
      load(true);
    } catch (e) {
      alert(t('restaurantWallet.errorTitle'), formatAxiosError(e, t('restaurantWallet.payoutError')));
    } finally {
      setPayoutLoading(false);
    }
  };

  const onWithdraw = () => {
    alert(t('restaurantWallet.makePayout'), t('restaurantWallet.confirmWithdrawMessage', {amount: available.toFixed(2)}), [
      {text: t('restaurantWallet.cancel'), style: 'cancel'},
      {text: t('restaurantWallet.confirm'), onPress: doWithdraw},
    ]);
  };

  const onOpenStripe = async () => {
    setConnectLoading(true);
    try {
      const link = payoutsReady
        ? await createStripeConnectDashboardLink()
        : await createStripeConnectOnboardingLink();
      const canOpen = await Linking.canOpenURL(link.url);
      if (!canOpen) {
        alert('Stripe', t('restaurantWallet.cannotOpenBrowser'));
        return;
      }
      await Linking.openURL(link.url);
    } catch (e) {
      alert('Stripe', formatAxiosError(e, t('restaurantWallet.onboardingOpenError')));
    } finally {
      setConnectLoading(false);
    }
  };

  const connectStatusLabel = payoutsReady
    ? t('restaurantWallet.statusActive')
    : connectStatus?.details_submitted
      ? t('restaurantWallet.statusPendingVerification')
      : t('restaurantWallet.statusNotConfigured');

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar navigation={navigation} title={t('restaurantWallet.title')} showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.darkGreen} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar navigation={navigation} title={t('restaurantWallet.title')} showBackButton onBackPress={() => navigation.goBack()} />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[Colors.darkGreen]} />
        }>
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <IconWrapper name="wallet-outline" size={22} color={Colors.darkGreen} />
            <Text style={styles.sectionTitle}>{t('restaurantWallet.balance')}</Text>
          </View>
          <Text style={styles.walletBalance}>{t('restaurantWallet.balanceAvailable', {amount: available.toFixed(2)})}</Text>
          <View style={[styles.connectRow, styles.connectRowLast]}>
            <Text style={styles.connectLabel}>{t('restaurantWallet.pendingBalance')}</Text>
            <Text style={styles.connectValue}>{(balance?.pending_balance ?? 0).toFixed(2)} €</Text>
          </View>
          <TouchableOpacity
            style={[styles.payoutButton, (!canWithdraw || payoutLoading) && styles.payoutButtonDisabled]}
            onPress={onWithdraw}
            activeOpacity={0.8}
            disabled={!canWithdraw || payoutLoading}>
            {payoutLoading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <IconWrapper name="card-outline" size={20} color={Colors.white} />
                <Text style={styles.payoutButtonText}>{t('restaurantWallet.makePayout')}</Text>
              </>
            )}
          </TouchableOpacity>
          {payoutsReady && !canWithdraw && (
            <Text style={styles.hintText}>{t('restaurantWallet.belowThreshold', {amount: threshold.toFixed(2)})}</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <IconWrapper name="card-outline" size={22} color={Colors.darkGreen} />
            <Text style={styles.sectionTitle}>{t('restaurantWallet.payoutAccount')}</Text>
          </View>
          <View style={[styles.connectRow, styles.connectRowLast]}>
            <Text style={styles.connectLabel}>{t('restaurantWallet.status')}</Text>
            <Text style={styles.connectValue}>{connectStatusLabel}</Text>
          </View>
          {!payoutsReady && (
            <Text style={styles.hintText}>{t('restaurantWallet.configureHint')}</Text>
          )}
          <TouchableOpacity
            style={styles.connectButton}
            onPress={onOpenStripe}
            activeOpacity={0.8}
            disabled={connectLoading}>
            {connectLoading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.connectButtonText}>
                {payoutsReady ? t('restaurantWallet.manageOnStripe') : t('restaurantWallet.activateUpdateConnect')}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('restaurantWallet.payoutHistory')}</Text>
          {payouts.length === 0 ? (
            <Text style={styles.mutedText}>{t('restaurantWallet.noPayouts')}</Text>
          ) : (
            payouts.map(payout => (
              <View key={payout.id} style={styles.payoutRow}>
                <View style={styles.payoutRowLeft}>
                  <Text style={styles.payoutDate}>
                    {payout.created_at ? new Date(payout.created_at).toLocaleDateString(dateLocale) : '—'}
                  </Text>
                  <Text style={styles.payoutStatus}>
                    {PAYOUT_STATUS_LABELS[payout.status] ?? payout.status}
                  </Text>
                </View>
                <Text style={styles.payoutAmount}>{Number(payout.amount).toFixed(2)} €</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
    fontSize: 17,
    fontWeight: '600',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
    marginBottom: 12,
  },
  walletBalance: {
    fontSize: 19,
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
    fontSize: 17,
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
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  connectValue: {
    fontSize: 15,
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
    fontSize: 15,
    fontFamily: secondaryFont,
  },
  hintText: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: secondaryFont,
    marginTop: 8,
  },
  mutedText: {
    fontSize: 15,
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
    fontSize: 15,
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  payoutStatus: {
    fontSize: 13,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  payoutAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
  },
});

export default WalletScreen;
