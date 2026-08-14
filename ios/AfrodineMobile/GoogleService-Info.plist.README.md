Déposez ici le vrai fichier `GoogleService-Info.plist` téléchargé depuis la Console Firebase
(Paramètres du projet > Vos applications > app iOS > GoogleService-Info.plist), sous le nom
`GoogleService-Info.plist` (à côté de ce README, dans `ios/AfrodineMobile/`).

Bundle ID iOS attendu lors de l'enregistrement de l'app dans Firebase : `com.afrodinemobile`

Une fois le fichier déposé :
1. Ajoutez-le au projet Xcode (glisser-déposer dans le groupe `AfrodineMobile`, cocher
   "Copy items if needed" et la cible `AfrodineMobile`).
2. Ouvrez le fichier, récupérez la valeur `REVERSED_CLIENT_ID`, et remplacez le placeholder
   `com.googleusercontent.apps.REPLACE_ME` dans `Info.plist` (clé `CFBundleURLTypes`) par cette
   valeur exacte.
3. `cd ios && pod install` (nécessite macOS/Xcode — non exécutable depuis cette machine Windows).
