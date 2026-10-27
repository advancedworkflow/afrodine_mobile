import React from 'react';
import {View, Image, StyleSheet, StatusBar, Platform, Modal} from 'react-native';
import {Colors} from '../utils/colors';

const SplashScreen = () => {
  const content = (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <Image
        source={require('../assets/namke-logo-splash.png')}
        style={styles.splashLogo}
        resizeMode="contain"
      />
    </View>
  );
  // iOS : App.tsx réserve le haut de l'écran (Dynamic Island) ; une Modal couvre tout l'écran
  if (Platform.OS === 'ios') {
    return (
      <Modal visible animationType="none">
        {content}
      </Modal>
    );
  }
  return content;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    width: 320,
    height: 130,
  },
});

export default SplashScreen;
