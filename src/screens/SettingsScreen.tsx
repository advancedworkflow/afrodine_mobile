import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import {alert} from '../utils/alert';
import IconWrapper from '../components/IconWrapper';
import {useAuth} from '../contexts/AuthContext';
import {Colors, Radius} from '../utils/colors';
import {fontButton, fontHeading, fontUI} from '../utils/fonts';

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
        alert('Erreur', 'Impossible de se déconnecter.');
      });
      return;
    }

    alert(
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
              alert('Erreur', 'Impossible de se déconnecter.');
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
            trackColor={{false: Colors.border, true: Colors.olive}}
            thumbColor={Colors.background}
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
    backgroundColor: Colors.surface,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: Radius.lg,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    color: Colors.textLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: fontHeading,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: fontUI,
    color: Colors.text,
  },
  settingValue: {
    fontSize: 13,
    fontFamily: fontUI,
    color: Colors.textLight,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    margin: 16,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: Colors.error,
    fontSize: 16,
    fontFamily: fontButton,
  },
});

export default SettingsScreen;

