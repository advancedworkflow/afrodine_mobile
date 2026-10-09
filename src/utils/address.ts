/**
 * Fusionne les lignes d'un formulaire d'adresse (ligne 1, ligne 2, ligne 3 facultatives)
 * en une seule chaîne, pour l'envoi au backend, l'affichage ou la géolocalisation sur la carte.
 */
export function mergeAddressLines(...lines: Array<string | undefined | null>): string {
  return lines
    .map(line => (line || '').trim())
    .filter(Boolean)
    .join(', ');
}
