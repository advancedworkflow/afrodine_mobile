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

## Configuration des notifications push

1. Créez un projet Firebase
2. Téléchargez `google-services.json` et placez-le dans `android/app/`
3. Configurez les notifications dans Firebase Console

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

