import React from 'react';
import {View, Image, StyleSheet, StatusBar} from 'react-native';
import {Colors} from '../utils/colors';

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <Image
        source={require('../assets/namke-logo-splash.png')}
        style={styles.splashLogo}
        resizeMode="contain"
      />
    </View>
  );
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
