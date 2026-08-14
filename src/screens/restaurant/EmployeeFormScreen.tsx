import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import TopBar from '../../components/TopBar';
import {Colors} from '../../utils/colors';
import {secondaryFont} from '../../utils/fonts';
import {
  createEmployee,
  updateEmployee,
  type ManagementEmployee,
  type EmployeeRole,
} from '../../services/restaurantManagement';
import {formatAxiosError} from '../../utils/formatApiError';

const ROLES: {value: EmployeeRole; label: string}[] = [
  {value: 'manager', label: 'Manager'},
  {value: 'kitchen', label: 'Cuisine'},
  {value: 'service', label: 'Service'},
  {value: 'cashier', label: 'Caisse'},
  {value: 'delivery', label: 'Livraison'},
  {value: 'staff', label: 'Staff'},
];

const EmployeeFormScreen = ({navigation, route}: any) => {
  const employee = route.params?.employee as ManagementEmployee | undefined;
  const isEdit = employee != null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<EmployeeRole>('staff');
  const [hireDate, setHireDate] = useState('');
  const [salary, setSalary] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (employee) {
      setEmail(employee.email ?? '');
      setFirstName(employee.first_name ?? '');
      setLastName(employee.last_name ?? '');
      setPhone(employee.phone ?? '');
      setRole(employee.role ?? 'staff');
      setHireDate(employee.hire_date?.slice(0, 10) ?? '');
      setSalary(employee.salary != null ? String(employee.salary) : '');
    }
  }, [employee]);

  const handleSubmit = async () => {
    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      Alert.alert('Champs requis', 'Renseignez au minimum l’email, le prénom et le nom.');
      return;
    }
    if (!isEdit && !password.trim()) {
      Alert.alert('Champ requis', 'Un mot de passe est requis pour créer un employé.');
      return;
    }
    if (!isEdit && !hireDate.trim()) {
      Alert.alert('Champ requis', 'Saisissez la date d’embauche (AAAA-MM-JJ).');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && employee) {
        await updateEmployee(employee.id, {
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim() || undefined,
          role,
          hire_date: hireDate.trim() || undefined,
          salary: salary.trim() ? parseFloat(salary.replace(',', '.')) : undefined,
        });
        Alert.alert('Succès', 'Employé mis à jour.', [{text: 'OK', onPress: () => navigation.goBack()}]);
      } else {
        await createEmployee({
          email: email.trim(),
          password: password.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim() || undefined,
          role,
          hire_date: hireDate.trim(),
          salary: salary.trim() ? parseFloat(salary.replace(',', '.')) : undefined,
        });
        Alert.alert('Succès', 'Employé créé.', [{text: 'OK', onPress: () => navigation.goBack()}]);
      }
    } catch (e: any) {
      Alert.alert('Erreur', formatAxiosError(e, 'Erreur lors de l\'enregistrement'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TopBar
        navigation={navigation}
        title={isEdit ? 'Modifier l’employé' : 'Nouvel employé'}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>Informations</Text>

          <Text style={styles.label}>Prénom *</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Prénom"
            placeholderTextColor={Colors.textLight}
          />

          <Text style={styles.label}>Nom *</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Nom"
            placeholderTextColor={Colors.textLight}
          />

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="employe@exemple.com"
            placeholderTextColor={Colors.textLight}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isEdit}
          />

          {!isEdit && (
            <>
              <Text style={styles.label}>Mot de passe *</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Mot de passe temporaire"
                placeholderTextColor={Colors.textLight}
                secureTextEntry
                autoCapitalize="none"
              />
            </>
          )}

          <Text style={styles.label}>Téléphone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+33 6 12 34 56 78"
            placeholderTextColor={Colors.textLight}
            keyboardType="phone-pad"
          />

          <Text style={styles.sectionTitle}>Rôle</Text>
          <View style={styles.roleGrid}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[styles.optionBtn, role === r.value && styles.optionBtnActive]}
                onPress={() => setRole(r.value)}>
                <Text style={[styles.optionBtnText, role === r.value && styles.optionBtnTextActive]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Emploi</Text>
          <Text style={styles.label}>Date d’embauche {!isEdit ? '*' : ''}</Text>
          <TextInput
            style={styles.input}
            value={hireDate}
            onChangeText={setHireDate}
            placeholder="2026-01-15"
            placeholderTextColor={Colors.textLight}
          />

          <Text style={styles.label}>Salaire (€)</Text>
          <TextInput
            style={styles.input}
            value={salary}
            onChangeText={setSalary}
            placeholder="Optionnel"
            placeholderTextColor={Colors.textLight}
            keyboardType="decimal-pad"
          />

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}>
            {submitting ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>{isEdit ? 'Enregistrer' : 'Créer l’employé'}</Text>
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
    color: Colors.primary,
    marginTop: 20,
    marginBottom: 12,
    fontFamily: secondaryFont,
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
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 16,
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  optionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  optionBtnTextActive: {
    color: Colors.primary,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
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

export default EmployeeFormScreen;
