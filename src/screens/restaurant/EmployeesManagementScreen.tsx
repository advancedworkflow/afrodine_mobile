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
import {secondaryFont} from '../../utils/fonts';
import {
  getEmployees,
  deleteEmployee,
  toggleEmployeeStatus,
  type ManagementEmployee,
} from '../../services/restaurantManagement';
import ConfirmModal from '../../components/ConfirmModal';
import {formatAxiosError} from '../../utils/formatApiError';

const EmployeesManagementScreen = ({navigation}: any) => {
  const {t} = useTranslation();
  const roleLabel = (role: string) => t(`restaurantEmployeeForm.roles.${role}`, {defaultValue: role});
  const [employees, setEmployees] = useState<ManagementEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ManagementEmployee | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const list = await getEmployees();
      setEmployees(list);
    } catch {
      setEmployees([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => load(true);

  const handleToggleStatus = async (employee: ManagementEmployee) => {
    setBusyId(employee.id);
    try {
      const updated = await toggleEmployeeStatus(employee.id);
      setEmployees((prev) => prev.map((e) => (e.id === employee.id ? updated : e)));
    } catch (e: any) {
      alert(t('restaurantEmployeesManagement.errorTitle'), formatAxiosError(e, t('restaurantEmployeesManagement.statusChangeFailed')));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    try {
      await deleteEmployee(id);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      alert(t('restaurantEmployeesManagement.successTitle'), t('restaurantEmployeesManagement.deleteSuccess'));
    } catch (e: any) {
      alert(t('restaurantEmployeesManagement.errorTitle'), formatAxiosError(e, t('restaurantEmployeesManagement.deleteFailed')));
    }
  };

  const activeCount = employees.filter((e) => e.is_active).length;

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar navigation={navigation} title={t('restaurantEmployeesManagement.title')} showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.darkGreen} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar navigation={navigation} title={t('restaurantEmployeesManagement.title')} showBackButton onBackPress={() => navigation.goBack()} />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.darkGreen]} />}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{employees.length}</Text>
            <Text style={styles.statLabel}>{t('restaurantEmployeesManagement.total')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>{t('restaurantEmployeesManagement.active')}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('EmployeeForm', {employee: undefined})}
          activeOpacity={0.8}>
          <IconWrapper name="person-add-outline" size={24} color={Colors.white} />
          <Text style={styles.addButtonText}>{t('restaurantEmployeesManagement.newEmployee')}</Text>
        </TouchableOpacity>

        {employees.length === 0 ? (
          <View style={styles.empty}>
            <IconWrapper name="people-outline" size={56} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>{t('restaurantEmployeesManagement.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{t('restaurantEmployeesManagement.emptyText')}</Text>
          </View>
        ) : (
          employees.map((employee) => (
            <TouchableOpacity
              key={employee.id}
              style={styles.card}
              onPress={() => navigation.navigate('EmployeeForm', {employee})}
              activeOpacity={0.8}>
              <View style={styles.cardBody}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>
                    {employee.first_name} {employee.last_name}
                  </Text>
                  <View style={[styles.statusBadge, employee.is_active ? styles.statusActive : styles.statusInactive]}>
                    <Text style={styles.statusBadgeText}>{employee.is_active ? t('restaurantEmployeesManagement.statusActive') : t('restaurantEmployeesManagement.statusInactive')}</Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>{employee.email}</Text>
                <View style={styles.cardMetaRow}>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>{roleLabel(employee.role)}</Text>
                  </View>
                  {employee.phone ? <Text style={styles.cardMeta}>{employee.phone}</Text> : null}
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleToggleStatus(employee)}
                  disabled={busyId === employee.id}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  {busyId === employee.id ? (
                    <ActivityIndicator size="small" color={Colors.darkGreen} />
                  ) : (
                    <IconWrapper
                      name={employee.is_active ? 'pause-circle-outline' : 'play-circle-outline'}
                      size={22}
                      color={employee.is_active ? Colors.warning : Colors.success}
                    />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setDeleteTarget(employee)}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <IconWrapper name="trash-outline" size={22} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <ConfirmModal
        visible={deleteTarget != null}
        title={t('restaurantEmployeesManagement.deleteConfirmTitle')}
        message={t('restaurantEmployeesManagement.deleteConfirmMessage', {name: `${deleteTarget?.first_name} ${deleteTarget?.last_name}`})}
        confirmLabel={t('restaurantEmployeesManagement.deleteConfirmButton')}
        onConfirm={handleDelete}
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
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
    fontSize: 17,
    fontWeight: '600',
    fontFamily: secondaryFont,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
    fontFamily: secondaryFont,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 24,
    fontFamily: secondaryFont,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
  },
  cardBody: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
    flex: 1,
    marginRight: 8,
  },
  cardMeta: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: secondaryFont,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  roleBadge: {
    backgroundColor: Colors.olive + '30',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.darkGreen,
    fontFamily: secondaryFont,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusActive: {
    backgroundColor: Colors.success + '30',
  },
  statusInactive: {
    backgroundColor: Colors.border,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textDark,
    fontFamily: secondaryFont,
  },
  cardActions: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    marginLeft: 10,
  },
  actionBtn: {
    padding: 4,
  },
});

export default EmployeesManagementScreen;
