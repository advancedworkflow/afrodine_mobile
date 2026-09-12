import 'i18next';

// t() ne retourne jamais null dans notre config (returnNull: false côté init) : on l'aligne
// ici pour que TS infère `string` au lieu de `string | null` sur chaque appel à t().
declare module 'i18next' {
  interface CustomTypeOptions {
    returnNull: false;
  }
}
