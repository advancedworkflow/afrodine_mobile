import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Modal,
  Image,
} from 'react-native';
import IconWrapper from './IconWrapper';
import {Colors, Radius} from '../utils/colors';
import {fontDisplay, secondaryFont} from '../utils/fonts';
import {useAuth} from '../contexts/AuthContext';

export interface OptionsMenuItem {
  label: string;
  onPress: () => void;
}

interface TopBarProps {
  navigation: any;
  title?: string;
  showNotifications?: boolean;
  showSettings?: boolean;
  showBackButton?: boolean;
  showOptionsMenu?: boolean;
  onBackPress?: () => void;
  onOptionsPress?: () => void;
  /** Si fourni, un clic sur l’icône options ouvre un menu contextuel avec ces entrées (icône à l’extrême droite). */
  optionsMenuItems?: OptionsMenuItem[];
}

const TopBar: React.FC<TopBarProps> = ({
  navigation,
  title = 'namke',
  showNotifications = true,
  showSettings = false,
  showBackButton = false,
  showOptionsMenu = false,
  onBackPress,
  onOptionsPress,
  optionsMenuItems,
}) => {
  const {isAuthenticated} = useAuth();
  const [optionsVisible, setOptionsVisible] = useState(false);

  const handleOptionsPress = () => {
    if (optionsMenuItems && optionsMenuItems.length > 0) {
      setOptionsVisible(true);
    } else {
      onOptionsPress?.();
    }
  };

  const closeAndNavigate = (fn: () => void) => {
    setOptionsVisible(false);
    fn();
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.darkGreen}
      />
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBackPress || (() => navigation.goBack())}>
              <IconWrapper name="arrow-back-outline" size={22} color={Colors.white} />
            </TouchableOpacity>
          )}
          <View style={styles.titleContainer}>
            {title === 'namke' ? (
              <Image source={require('../assets/namke-logo-white.png')} style={styles.logo} resizeMode="contain" />
            ) : (
              <Text style={styles.title}>{title}</Text>
            )}
          </View>
        </View>
        <View style={styles.rightSection}>
          {showNotifications && (
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => {
                if (isAuthenticated) {
                  navigation.navigate('Notifications');
                } else {
                  navigation.navigate('Login');
                }
              }}>
              <IconWrapper name="notifications-outline" size={22} color={Colors.white} />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          )}
          {showOptionsMenu && (
            <TouchableOpacity
              style={styles.optionsButton}
              onPress={handleOptionsPress}>
              <IconWrapper name="ellipsis-vertical" size={22} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {optionsMenuItems != null && optionsMenuItems.length > 0 && (
        <Modal
          visible={optionsVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setOptionsVisible(false)}>
          <TouchableOpacity
            style={styles.menuBackdrop}
            activeOpacity={1}
            onPress={() => setOptionsVisible(false)}>
            <View style={styles.menuBox}>
              {optionsMenuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.menuItem,
                    index === optionsMenuItems.length - 1 && styles.menuItemLast,
                  ]}
                  onPress={() => closeAndNavigate(item.onPress)}
                  activeOpacity={0.7}>
                  <Text style={styles.menuItemText}>{item.label}</Text>
                  <IconWrapper name="chevron-forward-outline" size={18} color={Colors.textLight} />
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.darkGreen,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: 12,
    paddingHorizontal: 18,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginRight: 12,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionsButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginLeft: 8,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 56 : 56,
    paddingRight: 12,
  },
  menuBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    minWidth: 180,
    overflow: 'hidden',
    shadowColor: '#2e2b25',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    color: Colors.white,
    fontFamily: fontDisplay,
  },
  logo: {
    width: 132,
    height: 34,
  },
  notificationButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    backgroundColor: Colors.terracotta,
    borderRadius: 4,
  },
});

export default TopBar;

