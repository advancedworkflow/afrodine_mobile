import api from '../utils/api';

/** Demande l'envoi du lien de réinitialisation ; le lien de l'email ouvre la page web /reset-password. */
export async function requestPasswordReset(email: string): Promise<void> {
  await api.post('/auth/forgot-password', {email});
}
