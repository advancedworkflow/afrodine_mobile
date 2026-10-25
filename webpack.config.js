const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Charger .env si le module dotenv est disponible (sinon utiliser les variables du shell)
try {
  require('dotenv').config();
} catch (_) {
  // dotenv non installé : REACT_APP_API_URL peut être défini dans le terminal ou un .env chargé par l'IDE
}

// Définit les variables d'environnement pour Babel
process.env.PLATFORM = 'web';
process.env.BABEL_ENV = 'web';

// URL du backend : REACT_APP_API_URL (défaut http://localhost:8000)
const API_BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Fichiers PWA copiés tels quels à la racine du build (manifest, service worker, icônes)
const PWA_FILES = ['manifest.webmanifest', 'sw.js', 'icons/icon-192.png', 'icons/icon-512.png',
  'icons/apple-touch-icon.png', 'icons/favicon-32.png'];
class CopyPwaFilesPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('CopyPwaFilesPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {name: 'CopyPwaFilesPlugin', stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL},
        () => {
          for (const file of PWA_FILES) {
            const src = path.resolve(__dirname, 'web', file);
            compilation.fileDependencies.add(src);
            compilation.emitAsset(file, new webpack.sources.RawSource(fs.readFileSync(src)));
          }
        },
      );
    });
  }
}

module.exports = {
  mode: 'development',
  entry: './index.web.js',
  output: {
    path: path.resolve(__dirname, 'web-build'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  resolve: {
    extensions: ['.web.js', '.web.tsx', '.web.ts', '.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      'react-native$': 'react-native-web',
      'react-native-splash-screen': path.resolve(__dirname, 'src/utils/splashScreen.web.js'),
      'react-native-vector-icons/Ionicons': '@expo/vector-icons/Ionicons',
      'expo-font': path.resolve(__dirname, 'src/utils/expoFont.web.js'),
      '@react-native-firebase/messaging': path.resolve(__dirname, 'src/utils/firebaseMessaging.web.js'),
      '@react-native-google-signin/google-signin': path.resolve(__dirname, 'src/utils/googleSignin.web.js'),
      'react-native-webview': path.resolve(__dirname, 'src/utils/webview.web.js'),
      '@react-native/assets-registry/registry': path.resolve(__dirname, 'src/utils/assetsRegistry.web.js'),
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
  },
  module: {
    rules: [
      {
        // Paquets ESM (react-navigation, async-storage) : imports relatifs sans extension
        test: /\.m?js$/,
        resolve: {fullySpecified: false},
      },
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules\/(?!(react-native-.*|@react-navigation|@react-native-.*)\/)/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            // Utilise babel.config.js pour la configuration
            // Les presets et plugins sont définis dans babel.config.js
            // Les variables d'environnement sont passées via process.env
            sourceType: 'unambiguous',
          },
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg|bmp|webp)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name].[hash][ext]',
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[hash][ext]',
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './web/index.html',
      filename: 'index.html',
    }),
    new CopyPwaFilesPlugin(),
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(true), // Toujours true en mode développement
      // process.env.NODE_ENV suit --mode (webpack le définit) : React en version production au build
      'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL || 'http://localhost:8000'),
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'web-build'),
    },
    compress: true,
    port: 3001,
    hot: true,
    open: true,
    historyApiFallback: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
    // Proxy API vers le backend (URL lue depuis REACT_APP_API_URL, défaut port 8000)
    proxy: {
      '/favoris': { target: API_BACKEND_URL, changeOrigin: true },
      '/management': { target: API_BACKEND_URL, changeOrigin: true },
      '/users': { target: API_BACKEND_URL, changeOrigin: true },
      '/restaurants': { target: API_BACKEND_URL, changeOrigin: true },
      '/orders': { target: API_BACKEND_URL, changeOrigin: true },
      '/dishes': { target: API_BACKEND_URL, changeOrigin: true },
      '/categories': { target: API_BACKEND_URL, changeOrigin: true },
      '/profiles': { target: API_BACKEND_URL, changeOrigin: true },
      '/menu': { target: API_BACKEND_URL, changeOrigin: true },
      '/promotions': { target: API_BACKEND_URL, changeOrigin: true },
      '/notifications': { target: API_BACKEND_URL, changeOrigin: true },
      '/auth': { target: API_BACKEND_URL, changeOrigin: true },
      '/wallet': { target: API_BACKEND_URL, changeOrigin: true },
      '/complete-payment': { target: API_BACKEND_URL, changeOrigin: true },
      '/catering': { target: API_BACKEND_URL, changeOrigin: true },
      '/supplements': { target: API_BACKEND_URL, changeOrigin: true },
      '/admin': { target: API_BACKEND_URL, changeOrigin: true },
    },
  },
  devtool: 'source-map',
};

