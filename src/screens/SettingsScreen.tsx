import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import IconWrapper from '../components/IconWrapper';
import {useAuth} from '../contexts/AuthContext';
import {Colors} from '../utils/colors';
import {secondaryFont} from '../utils/fonts';

const SettingsScreen = ({navigation}: any) => {
  const {user, logout, isRestaurant} = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const browserWindow = (globalThis as {window?: {confirm: (message?: string) => boolean}}).window;
      const ok = browserWindow
        ? browserWindow.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')
        : true;
      if (!ok) return;
      logout().catch(() => {
        Alert.alert('Erreur', 'Impossible de se déconnecter.');
      });
      return;
    }

    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // L'écran Login s'affiche automatiquement : le navigator affiche la branche "non authentifié" quand user devient null
            } catch (e) {
              Alert.alert('Erreur', 'Impossible de se déconnecter.');
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compte</Text>
        <View style={styles.settingItem}>
          <IconWrapper name="person-outline" size={24} color={Colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Nom</Text>
            <Text style={styles.settingValue}>{user?.name || 'Non défini'}</Text>
          </View>
        </View>
        <View style={styles.settingItem}>
          <IconWrapper name="mail-outline" size={24} color={Colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Email</Text>
            <Text style={styles.settingValue}>{user?.email || 'Non défini'}</Text>
          </View>
        </View>
        {isRestaurant && (
          <>
            <View style={styles.settingItem}>
              <IconWrapper name="restaurant-outline" size={24} color={Colors.primary} />
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Type de compte</Text>
                <Text style={styles.settingValue}>Restaurateur</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('RestaurantProfile')}>
              <IconWrapper name="business-outline" size={24} color={Colors.primary} />
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Profil restaurant</Text>
              </View>
              <IconWrapper name="chevron-forward" size={20} color={Colors.textLight} />
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.settingItem}>
          <IconWrapper name="notifications-outline" size={24} color={Colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Activer les notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{false: Colors.border, true: Colors.primaryLight}}
            thumbColor={notificationsEnabled ? Colors.primary : Colors.gray[400]}
          />
        </View>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('Notifications')}>
          <IconWrapper name="notifications-outline" size={24} color={Colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Voir les notifications</Text>
          </View>
          <IconWrapper name="chevron-forward" size={20} color={Colors.textLight} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Autre</Text>
        <TouchableOpacity style={styles.settingItem}>
          <IconWrapper name="help-circle-outline" size={24} color={Colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Aide</Text>
          </View>
          <IconWrapper name="chevron-forward" size={20} color={Colors.textLight} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <IconWrapper name="document-text-outline" size={24} color={Colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Conditions d'utilisation</Text>
          </View>
          <IconWrapper name="chevron-forward" size={20} color={Colors.textLight} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <IconWrapper name="log-out-outline" size={20} color={Colors.error} style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  section: {
    backgroundColor: Colors.white,
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.textLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontFamily: secondaryFont,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  settingValue: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 2,
    fontFamily: secondaryFont,
  },
  logoutButton: {
    flexDirection: 'row',
    margin: 16,
    padding: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: secondaryFont,
  },
});

export default SettingsScreen;

