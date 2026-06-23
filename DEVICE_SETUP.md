# Configuration d'un appareil Android pour le développement

## Problème : Appareil "unauthorized"

Si vous voyez `R58W2129LLZ     unauthorized` dans `adb devices`, suivez ces étapes :

### 1. Activer le mode développeur sur votre appareil

1. Allez dans **Paramètres** → **À propos du téléphone**
2. Appuyez 7 fois sur **Numéro de build** (ou **Version MIUI** pour Xiaomi)
3. Un message confirmera que vous êtes maintenant développeur

### 2. Activer le débogage USB

1. Retournez dans **Paramètres**
2. Allez dans **Options pour les développeurs** (ou **Paramètres système** → **Options pour les développeurs**)
3. Activez **Débogage USB**
4. Activez aussi **Installer via USB** (si disponible)

### 3. Autoriser l'ordinateur

1. Débranchez et rebranchez le câble USB
2. Une popup apparaîtra sur votre téléphone : **Autoriser le débogage USB ?**
3. Cochez **Toujours autoriser depuis cet ordinateur**
4. Appuyez sur **Autoriser**

### 4. Vérifier la connexion

```bash
adb devices
```

Vous devriez voir :
```
List of devices attached
R58W2129LLZ     device
```

### 5. Si le problème persiste

```bash
# Réinitialiser le serveur ADB
adb kill-server
adb start-server
adb devices
```

### Pour Xiaomi/MIUI spécifiquement

1. **Paramètres** → **Paramètres supplémentaires** → **Options pour les développeurs**
2. Activez **Débogage USB**
3. Activez **Installer via USB**
4. Activez **Débogage USB (Paramètres de sécurité)** si disponible
5. Dans **Paramètres** → **Gestionnaire d'applications** → **Gérer les applications** → **Afficher les applications système**
6. Trouvez **USB** et activez **Afficher les fenêtres par-dessus**

### Alternative : Utiliser le Wi-Fi (si USB ne fonctionne pas)

```bash
# Connecter l'appareil via USB d'abord
adb tcpip 5555
# Notez l'adresse IP de votre téléphone (Paramètres → À propos → État → Adresse IP)
adb connect VOTRE_IP:5555
# Débranchez le câble USB
adb devices
```

