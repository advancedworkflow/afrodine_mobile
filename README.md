# Afrodine Mobile App

Application mobile React Native pour Afrodine - Plateforme de commande de plats africains.

## Fonctionnalités

- ✅ Splash screen avec logo Afrodine
- ✅ Authentification (Login/Signup)
- ✅ Navigation bottom menu
- ✅ Top bar avec notifications et paramètres
- ✅ Notifications push
- ✅ Mode invité (navigation sans compte)
- ✅ Profil et paramètres (nécessitent une connexion)
- ✅ Dashboard restaurateur (si compte restaurateur)

## Installation

```bash
# Installer les dépendances
npm install

# iOS
cd ios && pod install && cd ..
npm run ios

# Android
npm run android
```

## Configuration

### Police Istok

Ajoutez la police Istok dans `src/assets/fonts/` et configurez-la dans `react-native.config.js`:

```js
module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./src/assets/fonts/'],
};
```

### Notifications Push

Configurez Firebase pour les notifications push dans `android/app/google-services.json` et `ios/GoogleService-Info.plist`.

### API Base URL

Modifiez `API_BASE_URL` dans `src/utils/api.ts` selon votre environnement.

## Structure

```
src/
├── screens/          # Écrans de l'application
├── components/       # Composants réutilisables
├── navigation/       # Configuration de navigation
├── contexts/         # Contextes React (Auth, etc.)
├── services/         # Services API
├── utils/            # Utilitaires (colors, api, etc.)
└── assets/           # Images, fonts, etc.
```

## Couleurs

- Primary: #10b981 (Dark grass green)
- Primary Dark: #002b11
- Secondary: #000000

## Navigation

- **Utilisateurs réguliers**: Home, Restaurants, Cart, Profile
- **Restaurateurs**: Dashboard, Orders, Menu, Analytics
- **Invités**: Accès limité (pas de profil/paramètres)

