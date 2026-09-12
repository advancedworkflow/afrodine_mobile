# Guide de configuration - Afrodine Mobile

## Prérequis

1. **Node.js** (version 16 ou supérieure)
2. **Android Studio** avec Android SDK
3. **Java JDK** (version 11 ou supérieure)

## Installation

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configuration Android

#### Créer le fichier `android/local.properties`

Créez le fichier `android/local.properties` avec le chemin vers votre Android SDK :

```properties
sdk.dir=C\:\\Users\\VOTRE_NOM\\AppData\\Local\\Android\\Sdk
```

Remplacez `VOTRE_NOM` par votre nom d'utilisateur Windows.

#### Générer la clé de debug (si nécessaire)

```bash
cd android/app
keytool -genkey -v -keystore debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000
cd ../..
```

### 3. Lancer l'application

#### Démarrer Metro Bundler

```bash
npm start
```

#### Dans un autre terminal, lancer Android

```bash
npm run android
```

## Configuration des notifications push (Firebase Cloud Messaging)

Le code d'intégration FCM (`@react-native-firebase/app`/`messaging`, permissions, handlers
foreground/background, enregistrement du token côté backend) est déjà en place. Il ne manque
que les fichiers de configuration du projet Firebase réel, volontairement exclus du repo
(voir `.gitignore`) car spécifiques à chaque environnement.

### Android

1. Dans la [console Firebase](https://console.firebase.google.com/), créez (ou ouvrez) le projet.
2. Ajoutez une app Android avec le package name `com.afrodine_mobile`.
3. Téléchargez `google-services.json` et placez-le dans `android/app/` (remplace
   `android/app/google-services.json.example`).
4. Le plugin Gradle s'applique automatiquement dès que ce fichier existe (voir
   `android/app/build.gradle`) — aucune autre étape n'est nécessaire.

### iOS

1. Dans le même projet Firebase, ajoutez une app iOS avec le bundle ID `com.afrodinemobile`.
2. Téléchargez `GoogleService-Info.plist` et placez-le dans `ios/AfrodineMobile/` (voir
   `ios/AfrodineMobile/GoogleService-Info.plist.README.md` pour l'ajout au projet Xcode).
3. Dans ce même fichier, récupérez la valeur `REVERSED_CLIENT_ID` et remplacez le placeholder
   `com.googleusercontent.apps.REPLACE_ME` dans `ios/AfrodineMobile/Info.plist`
   (`CFBundleURLSchemes`) — nécessaire pour Google Sign-In, pas pour FCM lui-même.
4. Lancez `pod install` depuis `ios/` (macOS uniquement — non exécutable depuis Windows).

### Vérification

- Dans Firebase Console → Cloud Messaging, envoyez un message de test à un token récupéré via
  les logs (`registerDeviceToken` logue les erreurs mais pas le token ; ajoutez temporairement
  un `console.log(fcmToken)` dans `notificationService.ts` si besoin).
- Le backend doit exposer `/users/me/device-tokens` (voir `afrodineapi`) pour recevoir le token.

## Police Istok

1. Téléchargez les fichiers de police Istok (.ttf)
2. Placez-les dans `src/assets/fonts/`
3. Exécutez : `npx react-native-asset`

## Dépannage

### Erreur "SDK location not found"
- Vérifiez que `android/local.properties` existe et contient le bon chemin

### Erreur "Could not find or load main class"
- Vérifiez que Java JDK est installé et configuré

### Erreur de build Gradle
- Exécutez : `cd android && ./gradlew clean && cd ..`

