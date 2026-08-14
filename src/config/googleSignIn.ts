// Web Client ID Google/Firebase (Console Firebase > Authentification > Google > Web SDK
// configuration, ou Google Cloud Console > Identifiants > OAuth 2.0 Client IDs > type "Web").
// C'est le MÊME identifiant sur Android, iOS et Web — c'est lui que le backend utilise pour
// vérifier les id_token (voir afrodineapi GOOGLE_CLIENT_ID).
//
// Note : contrairement à REACT_APP_API_URL, cette valeur n'est PAS injectée depuis .env dans
// les builds natifs (Metro n'inline pas les .env ici, seul le build web via webpack le fait).
// Pour Android/iOS, remplacez directement le fallback ci-dessous par la vraie valeur.
export const GOOGLE_WEB_CLIENT_ID =
  (typeof process !== 'undefined' && process.env?.REACT_APP_GOOGLE_WEB_CLIENT_ID) ||
  'REPLACE_ME.apps.googleusercontent.com';
