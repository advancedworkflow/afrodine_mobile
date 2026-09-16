import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {alert} from '../../utils/alert';
import TopBar from '../../components/TopBar';
import IconWrapper from '../../components/IconWrapper';
import {Colors} from '../../utils/colors';
import {fontSub, secondaryFont} from '../../utils/fonts';
import {
  getManagementCateringServices,
  deleteManagementCateringService,
  getCateringBookings,
  type ManagementCateringService,
  type CateringBookingItem,
} from '../../services/restaurantManagement';
import ConfirmModal from '../../components/ConfirmModal';
import {formatAxiosError} from '../../utils/formatApiError';

const SERVICE_TYPE_KEYS = ['buffet', 'cocktail', 'seated_dinner', 'catering_delivery'];
const BOOKING_STATUS_KEYS = ['pending', 'confirmed', 'cancelled', 'completed'];

const LOCALE_MAP: Record<string, string> = {fr: 'fr-FR', en: 'en-GB', de: 'de-DE'};

const CateringManagementScreen = ({navigation}: any) => {
  const {t, i18n} = useTranslation();
  const dateLocale = LOCALE_MAP[i18n.language] || 'fr-FR';
  const [services, setServices] = useState<ManagementCateringService[]>([]);
  const [bookings, setBookings] = useState<CateringBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ManagementCateringService | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [servicesData, bookingsData] = await Promise.all([
        getManagementCateringServices(),
        getCateringBookings(null),
      ]);
      setServices(servicesData);
      setBookings(bookingsData);
    } catch {
      setServices([]);
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => load(true);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    try {
      await deleteManagementCateringService(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
      alert(t('restaurantCateringManagement.successTitle'), t('restaurantCateringManagement.deleteSuccess'));
    } catch (e: any) {
      alert(t('restaurantCateringManagement.errorTitle'), formatAxiosError(e, t('restaurantCateringManagement.deleteFailed')));
    }
  };

  const typeLabel = (serviceType?: string) =>
    serviceType && SERVICE_TYPE_KEYS.includes(serviceType)
      ? t(`restaurantCateringManagement.serviceTypes.${serviceType}`)
      : serviceType ?? t('restaurantCateringManagement.defaultServiceType');

  const bookingStatusLabel = (status: string) =>
    BOOKING_STATUS_KEYS.includes(status) ? t(`restaurantCateringManagement.bookingStatuses.${status}`) : status;

  const formatBookingDateTime = (b: CateringBookingItem) => {
    const dateStr = new Date(b.event_date).toLocaleDateString(dateLocale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeStr =
      typeof b.event_time === 'string' && b.event_time.includes(':')
        ? b.event_time.slice(0, 5)
        : String(b.event_time ?? '');
    return `${dateStr} · ${timeStr}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar
          navigation={navigation}
          title={t('restaurantCateringManagement.title')}
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.darkGreen} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar
        navigation={navigation}
        title={t('restaurantCateringManagement.title')}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.darkGreen]} />
        }>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CateringOfferDetail', {serviceId: undefined})}
          activeOpacity={0.8}>
          <IconWrapper name="add-outline" size={20} color={Colors.white} />
          <Text style={styles.addButtonText}>{t('restaurantCateringManagement.newOffer')}</Text>
        </TouchableOpacity>

        {services.length === 0 ? (
          <View style={styles.empty}>
            <IconWrapper name="restaurant-outline" size={44} color={Colors.gray[400]} />
            <Text style={styles.emptyTitle}>{t('restaurantCateringManagement.emptyTitle')}</Text>
            <Text style={styles.emptyText}>
              {t('restaurantCateringManagement.emptyText')}
            </Text>
          </View>
        ) : (
          services.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.card}
              onPress={() => navigation.navigate('CateringOfferDetail', {serviceId: s.id})}
              activeOpacity={0.8}>
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>{s.service_name}</Text>
                <Text style={styles.cardType}>{typeLabel(s.service_type)}</Text>
                {s.service_description ? (
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {s.service_description}
                  </Text>
                ) : null}
                <View style={styles.cardMeta}>
                  <Text style={styles.cardPriceLine}>
                    <Text style={styles.cardPriceLabel}>{t('restaurantCateringManagement.startingFrom')} </Text>
                    <Text style={styles.cardPriceValue}>
                      {Number(s.base_price).toFixed(0)} €
                    </Text>
                  </Text>
                  <Text style={styles.cardGuests}>
                    {t('restaurantCateringManagement.guestsRange', {min: s.min_guests, max: s.max_guests ?? '+'})}
                  </Text>
                </View>
                {s.is_active === false && (
                  <Text style={styles.inactiveBadge}>{t('restaurantCateringManagement.inactive')}</Text>
                )}
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => navigation.navigate('CateringOfferDetail', {serviceId: s.id})}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <IconWrapper name="pencil-outline" size={20} color={Colors.textLight} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => setDeleteTarget(s)}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <IconWrapper name="trash-outline" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Section Réservations — tableau type management */}
        <View style={styles.reservationsSection}>
          <View style={styles.sectionHeader}>
            <IconWrapper name="calendar-outline" size={20} color={Colors.textLight} />
            <Text style={styles.sectionTitle}>{t('restaurantCateringManagement.bookingsSectionTitle')}</Text>
          </View>
          {bookings.length === 0 ? (
            <View style={styles.emptyBookings}>
              <Text style={styles.emptyText}>{t('restaurantCateringManagement.noBookings')}</Text>
            </View>
          ) : (
            <View style={styles.tableWrap}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeadCell, styles.tableColDate]}>{t('restaurantCateringManagement.tableDate')}</Text>
                <Text style={[styles.tableHeadCell, styles.tableColStatus]}>{t('restaurantCateringManagement.tableStatus')}</Text>
                <Text style={[styles.tableHeadCell, styles.tableColGuests]}>{t('restaurantCateringManagement.tableGuestsAbbr')}</Text>
                <Text style={[styles.tableHeadCell, styles.tableColAmount]}>{t('restaurantCateringManagement.tableAmount')}</Text>
              </View>
              {bookings.map((b, index) => (
                <View
                  key={b.id}
                  style={[
                    styles.tableRowGroup,
                    index === bookings.length - 1 && styles.tableRowGroupLast,
                  ]}>
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.tableColDate]} numberOfLines={2}>
                      {formatBookingDateTime(b)}
                    </Text>
                    <View style={[styles.tableColStatus, styles.tableCellStatusWrap]}>
                      <View
                        style={[
                          styles.bookingStatusBadge,
                          b.status === 'confirmed' && styles.bookingStatusConfirmed,
                          b.status === 'cancelled' && styles.bookingStatusCancelled,
                        ]}>
                        <Text
                          style={[
                            styles.bookingStatusText,
                            b.status === 'confirmed' && styles.bookingStatusTextConfirmed,
                            b.status === 'cancelled' && styles.bookingStatusTextCancelled,
                          ]}
                          numberOfLines={1}>
                          {bookingStatusLabel(b.status)}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.tableCell, styles.tableColGuests, styles.tableCellCenter]}>
                      {b.guest_count}
                    </Text>
                    <Text style={[styles.tableCell, styles.tableColAmount, styles.tableCellAmount]}>
                      {Number(b.total_amount).toFixed(0)} {b.currency || '€'}
                    </Text>
                  </View>
                  {(b.contact_email || b.contact_phone) && (
                    <Text style={styles.tableRowMeta} numberOfLines={2}>
                      {[b.contact_email, b.contact_phone].filter(Boolean).join(' · ')}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <ConfirmModal
        visible={deleteTarget !== null}
        title={t('restaurantCateringManagement.deleteConfirmTitle')}
        message={
          deleteTarget
            ? t('restaurantCateringManagement.deleteConfirmMessage', {name: deleteTarget.service_name})
            : ''
        }
        confirmLabel={t('restaurantCateringManagement.deleteConfirmButton')}
        cancelLabel={t('restaurantCateringManagement.cancel')}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.darkGreen,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: secondaryFont,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardBody: {
    flex: 1,
    marginRight: 12,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
  },
  cardType: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
    fontFamily: secondaryFont,
  },
  cardDesc: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 6,
    lineHeight: 18,
    fontFamily: secondaryFont,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 12,
  },
  cardPriceLine: {
    flexShrink: 1,
  },
  cardPriceLabel: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  cardPriceValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
  },
  cardGuests: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  inactiveBadge: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: { padding: 4 },
  deleteBtn: { padding: 4 },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkGreen,
    marginTop: 16,
    fontFamily: secondaryFont,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 24,
    fontFamily: secondaryFont,
  },
  reservationsSection: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
  },
  emptyBookings: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  tableWrap: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.gray[50],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  tableHeadCell: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textLight,
    fontFamily: fontSub,
  },
  tableColDate: {
    flex: 2.1,
    paddingRight: 6,
  },
  tableColStatus: {
    flex: 1.35,
    paddingRight: 4,
  },
  tableColGuests: {
    width: 36,
    textAlign: 'center',
  },
  tableColAmount: {
    flex: 1,
    textAlign: 'right',
  },
  tableRowGroup: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.gray[100],
  },
  tableRowGroupLast: {
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  tableCell: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  tableCellCenter: {
    textAlign: 'center',
  },
  tableCellAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkGreen,
  },
  tableCellStatusWrap: {
    justifyContent: 'center',
  },
  tableRowMeta: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: secondaryFont,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 0,
    marginTop: -4,
  },
  bookingStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    backgroundColor: Colors.category?.yellow?.bg ?? '#FEF3C7',
  },
  bookingStatusConfirmed: {
    backgroundColor: Colors.darkGreen + '20',
  },
  bookingStatusCancelled: {
    backgroundColor: Colors.error + '20',
  },
  bookingStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  bookingStatusTextConfirmed: {
    color: Colors.darkGreen,
  },
  bookingStatusTextCancelled: {
    color: Colors.error,
  },
});

export default CateringManagementScreen;
