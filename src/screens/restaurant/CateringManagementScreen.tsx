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
  updateCateringBookingStatus,
  type ManagementCateringService,
  type CateringBookingItem,
} from '../../services/restaurantManagement';
import ConfirmModal from '../../components/ConfirmModal';
import {formatAxiosError} from '../../utils/formatApiError';
import {CATERING_PAID_OPTIONS, getOfferStartingPrice} from '../../utils/catering';

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
  const [expandedBookingId, setExpandedBookingId] = useState<number | null>(null);
  const [cancelTarget, setCancelTarget] = useState<CateringBookingItem | null>(null);
  const [updatingBookingId, setUpdatingBookingId] = useState<number | null>(null);

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

  const changeBookingStatus = async (booking: CateringBookingItem, status: 'confirmed' | 'completed' | 'cancelled') => {
    setUpdatingBookingId(booking.id);
    try {
      await updateCateringBookingStatus(booking.id, status);
      setBookings((prev) => prev.map((b) => (b.id === booking.id ? {...b, status} : b)));
    } catch (e: any) {
      alert(t('restaurantCateringManagement.errorTitle'), formatAxiosError(e, t('restaurantCateringManagement.statusFailed')));
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelTarget) return;
    const booking = cancelTarget;
    setCancelTarget(null);
    await changeBookingStatus(booking, 'cancelled');
  };

  // Une prestation ne peut être terminée qu'à partir du jour de l'événement (règle de l'API)
  const eventHasStarted = (b: CateringBookingItem) => new Date(`${b.event_date}T00:00:00`) <= new Date();

  const chosenOptionLabels = (b: CateringBookingItem) => {
    const selected = b.selected_options;
    if (!selected) return [];
    return CATERING_PAID_OPTIONS.filter((o) => (o.id === 'staff' ? (selected.staff_hours ?? 0) > 0 : selected[o.id])).map((o) =>
      o.id === 'staff'
        ? t('restaurantCateringManagement.options.staffHours', {hours: selected.staff_hours})
        : t(`restaurantCateringManagement.options.${o.id}`),
    );
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
                      {getOfferStartingPrice(s).amount.toFixed(0)} €
                    </Text>
                    <Text style={styles.cardPriceLabel}>
                      {getOfferStartingPrice(s).perPerson ? ` ${t('catering.perPerson')}` : ` (${t('catering.packagePrice')})`}
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
              {bookings.map((b, index) => {
                const expanded = expandedBookingId === b.id;
                const options = chosenOptionLabels(b);
                const busy = updatingBookingId === b.id;
                return (
                <View
                  key={b.id}
                  style={[
                    styles.tableRowGroup,
                    index === bookings.length - 1 && styles.tableRowGroupLast,
                  ]}>
                  <TouchableOpacity
                    style={styles.tableRow}
                    onPress={() => setExpandedBookingId(expanded ? null : b.id)}
                    activeOpacity={0.7}>
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
                  </TouchableOpacity>
                  {!expanded && (b.service_name || b.customer_name) ? (
                    <Text style={styles.tableRowMeta} numberOfLines={1}>
                      {[b.service_name, b.customer_name].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                  {expanded && (
                    <View style={styles.bookingDetail}>
                      {b.service_name ? <Text style={styles.detailTitle}>{b.service_name}</Text> : null}
                      {b.occasion || b.formula_name ? (
                        <Text style={styles.detailLine}>
                          {[b.occasion ? t(`catering.occasions.${b.occasion}`) : null, b.formula_name].filter(Boolean).join(' · ')}
                        </Text>
                      ) : null}
                      <Text style={styles.detailLabel}>{t('restaurantCateringManagement.detail.client')}</Text>
                      {b.customer_name ? <Text style={styles.detailLine}>{b.customer_name}</Text> : null}
                      {[b.contact_email, b.contact_phone].filter(Boolean).map((c) => (
                        <Text key={c} style={styles.detailLine}>{c}</Text>
                      ))}
                      {b.delivery_address ? (
                        <>
                          <Text style={styles.detailLabel}>{t('restaurantCateringManagement.detail.address')}</Text>
                          <Text style={styles.detailLine}>{b.delivery_address}</Text>
                        </>
                      ) : null}
                      {options.length > 0 && (
                        <>
                          <Text style={styles.detailLabel}>{t('restaurantCateringManagement.detail.options')}</Text>
                          <Text style={styles.detailLine}>{options.join(' · ')}</Text>
                        </>
                      )}
                      {b.dietary_requirements && b.dietary_requirements.length > 0 ? (
                        <>
                          <Text style={styles.detailLabel}>{t('restaurantCateringManagement.detail.dietary')}</Text>
                          <Text style={styles.detailLine}>
                            {b.dietary_requirements.map((d) => t(`catering.dietaryOptions.${d}`)).join(' · ')}
                          </Text>
                        </>
                      ) : null}
                      {b.selected_dish_names && b.selected_dish_names.length > 0 ? (
                        <>
                          <Text style={styles.detailLabel}>{t('restaurantCateringManagement.detail.dishes')}</Text>
                          <Text style={styles.detailLine}>{b.selected_dish_names.join(' · ')}</Text>
                        </>
                      ) : null}
                      {b.special_requests ? (
                        <>
                          <Text style={styles.detailLabel}>{t('restaurantCateringManagement.detail.message')}</Text>
                          <Text style={styles.detailLine}>{b.special_requests}</Text>
                        </>
                      ) : null}
                      <Text style={styles.detailLabel}>{t('restaurantCateringManagement.detail.deposit')}</Text>
                      <Text style={styles.detailLine}>
                        {`${Number(b.deposit_amount ?? 0).toFixed(2)} € · ${
                          b.deposit_paid ? t('restaurantCateringManagement.detail.depositPaid') : t('restaurantCateringManagement.detail.depositUnpaid')
                        }`}
                      </Text>
                      <View style={styles.bookingActions}>
                        {busy ? (
                          <ActivityIndicator size="small" color={Colors.darkGreen} />
                        ) : (
                          <>
                            {b.status === 'pending' && (
                              <TouchableOpacity style={styles.actionPrimary} onPress={() => changeBookingStatus(b, 'confirmed')}>
                                <Text style={styles.actionPrimaryText}>{t('restaurantCateringManagement.actions.confirm')}</Text>
                              </TouchableOpacity>
                            )}
                            {b.status === 'confirmed' && eventHasStarted(b) && (
                              <TouchableOpacity style={styles.actionPrimary} onPress={() => changeBookingStatus(b, 'completed')}>
                                <Text style={styles.actionPrimaryText}>{t('restaurantCateringManagement.actions.complete')}</Text>
                              </TouchableOpacity>
                            )}
                            {(b.status === 'pending' || b.status === 'confirmed') && (
                              <TouchableOpacity style={styles.actionDanger} onPress={() => setCancelTarget(b)}>
                                <Text style={styles.actionDangerText}>{t('restaurantCateringManagement.actions.cancel')}</Text>
                              </TouchableOpacity>
                            )}
                          </>
                        )}
                      </View>
                    </View>
                  )}
                </View>
                );
              })}
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

      <ConfirmModal
        visible={cancelTarget !== null}
        title={t('restaurantCateringManagement.cancelBookingTitle')}
        message={t('restaurantCateringManagement.cancelBookingMessage')}
        confirmLabel={t('restaurantCateringManagement.actions.cancel')}
        cancelLabel={t('restaurantCateringManagement.back')}
        variant="danger"
        onConfirm={handleCancelBooking}
        onCancel={() => setCancelTarget(null)}
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
  bookingDetail: {
    paddingHorizontal: 12,
    paddingBottom: 14,
    backgroundColor: Colors.gray[50],
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
    marginTop: 10,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: Colors.textLight,
    fontFamily: fontSub,
    marginTop: 10,
  },
  detailLine: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: secondaryFont,
    marginTop: 2,
  },
  bookingActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  actionPrimary: {
    backgroundColor: Colors.darkGreen,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  actionPrimaryText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 13,
    fontFamily: secondaryFont,
  },
  actionDanger: {
    borderWidth: 1,
    borderColor: Colors.error,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  actionDangerText: {
    color: Colors.error,
    fontWeight: '600',
    fontSize: 13,
    fontFamily: secondaryFont,
  },
});

export default CateringManagementScreen;
