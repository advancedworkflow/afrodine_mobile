import {Alert, Platform} from 'react-native';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

/**
 * Remplacement de `Alert.alert` : sur web, `Alert.alert` de react-native-web
 * est un no-op total (aucun texte d'erreur/confirmation n'apparaît jamais).
 * Ici on retombe sur `window.alert`/`window.confirm`. Signature volontairement
 * compatible avec `Alert.alert` pour un remplacement direct des appels existants.
 */
export function alert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    const win = (globalThis as {window?: Window}).window;
    if (buttons && buttons.length > 1) {
      const cancelButton = buttons.find(b => b.style === 'cancel');
      const confirmButton = buttons.find(b => b !== cancelButton) ?? buttons[buttons.length - 1];
      const ok = win?.confirm ? win.confirm(text) : true;
      if (ok) confirmButton?.onPress?.();
      else cancelButton?.onPress?.();
      return;
    }
    win?.alert?.(text);
    buttons?.[0]?.onPress?.();
    return;
  }
  Alert.alert(title, message, buttons);
}
