/**
 * @format
 * Web entry point for React Native Web
 */

import {AppRegistry} from 'react-native';
import AppModule from './App.web';
import appConfig from './app.json';

const appName = appConfig.name;

// Ensure we register a component (handle default vs module object)
const App = AppModule && (typeof AppModule.default === 'function' ? AppModule.default : AppModule);
if (typeof App !== 'function') {
  console.error('App.web did not export a valid component', AppModule);
}

AppRegistry.registerComponent(appName, () => App);

// Start the app on web
if (typeof document !== 'undefined') {
  const rootTag = document.getElementById('root');
  if (rootTag) {
    AppRegistry.runApplication(appName, {
      initialProps: {},
      rootTag: rootTag,
    });
  }
}
