# Générer l’APK Android (Afrodine Mobile)

## Prérequis

- **Node.js** (>= 16) et **npm** installés
- **JDK 17** (ou 11) installé et `JAVA_HOME` configuré
- **Android SDK** installé (Android Studio ou ligne de commande)
- Variable d’environnement **ANDROID_HOME** pointant vers le SDK Android

## Étapes

### 1. Installer les dépendances

À la racine du projet `afrodine_mobile` :

```bash
npm install
```

### 2. Lancer la build de l’APK release

**Windows (PowerShell ou CMD) :**

```bash
cd android
gradlew.bat assembleRelease
```

**Ou avec le script npm (depuis la racine du projet) :**

```bash
npm run android:build-apk
```

**macOS / Linux :**

```bash
cd android
./gradlew assembleRelease
```

La première exécution peut prendre plusieurs minutes (téléchargement de Gradle et des dépendances).

### 3. Récupérer l’APK

Une fois la build terminée, l’APK se trouve ici :

```
android/app/build/outputs/apk/release/app-release.apk
```

Tu peux copier ce fichier sur ton téléphone et l’installer (il faut autoriser l’installation depuis des sources inconnues dans les paramètres Android).

## Build debug (tests)

Pour une version debug (signée avec la clé debug) :

```bash
cd android
gradlew.bat assembleDebug
```

APK généré : `android/app/build/outputs/apk/debug/app-debug.apk`

## Signature release pour la Play Store

Pour publier sur le Play Store, il faut signer l’APK avec une clé release (keystore). À faire ensuite :

1. Créer un keystore (une seule fois) :
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore afrodine-release.keystore -alias afrodine -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Configurer `android/app/build.gradle` avec `signingConfigs.release` pointant vers ce keystore (et retirer `signingConfig signingConfigs.debug` du `buildTypes.release`).
3. Ne jamais commiter le keystore ou les mots de passe dans le dépôt.

Actuellement, le build release utilise la clé **debug** pour produire un APK installable (tests / distribution interne uniquement).
