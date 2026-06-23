# Guide de dépannage - Afrodine Mobile

## Problèmes courants et solutions

### 1. Erreur "Could not find or load main class org.gradle.wrapper.GradleWrapperMain"

**Solution** : Le fichier `gradle-wrapper.jar` était corrompu ou manquant. Il a été corrigé.

Si le problème persiste :
```bash
cd android/gradle/wrapper
# Supprimer l'ancien fichier
rm gradle-wrapper.jar
# Télécharger depuis GitHub
# Le fichier devrait faire environ 60KB
```

### 2. Erreur "Android project not found"

**Solution** : Vérifiez que le dossier `android/` existe et contient tous les fichiers nécessaires.

### 3. Erreur de l'émulateur qui crash

**Solutions** :
- Lancez l'émulateur manuellement depuis Android Studio
- Ou connectez un appareil physique via USB avec le mode développeur activé
- Vérifiez que HAXM ou Hyper-V est correctement configuré

### 4. Erreur "SDK location not found"

**Solution** : Vérifiez le fichier `android/local.properties` :
```properties
sdk.dir=C\:\\Users\\VOTRE_NOM\\AppData\\Local\\Android\\Sdk
```

### 5. Erreur de build Gradle

**Solutions** :
```bash
cd android
gradlew clean
cd ..
npm run android
```

### 6. Erreur "Could not resolve all dependencies"

**Solutions** :
- Vérifiez votre connexion internet
- Ajoutez `mavenCentral()` dans `android/build.gradle`
- Exécutez `cd android && gradlew --refresh-dependencies`

### 7. Problèmes de cache Metro

**Solution** :
```bash
npm start -- --reset-cache
```

### 8. Problèmes avec les polices Istok

**Solution** :
1. Téléchargez les fichiers .ttf de la police Istok
2. Placez-les dans `src/assets/fonts/`
3. Exécutez : `npx react-native-asset`

## Commandes utiles

```bash
# Nettoyer le build Android
cd android && gradlew clean && cd ..

# Vérifier la version de Gradle
cd android && gradlew --version

# Vérifier les dépendances
cd android && gradlew dependencies

# Lancer avec logs détaillés
npm run android -- --verbose
```

## Vérification de l'environnement

Exécutez :
```bash
npx react-native doctor
```

Cela vérifiera :
- Node.js
- JDK
- Android SDK
- Android Studio
- Etc.

