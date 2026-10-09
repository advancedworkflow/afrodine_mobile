import api from '../utils/api';

export interface TwoFactorStatus {
  enabled: boolean;
}

export interface Enable2FAResult {
  secret: string;
  backup_codes: string[];
  totp_uri: string;
  enabled: boolean;
}

export interface Verify2FAResult {
  valid: boolean;
  method?: string;
  message: string;
}

export async function getTwoFactorStatus(): Promise<TwoFactorStatus> {
  const {data} = await api.get<TwoFactorStatus>('/auth/2fa/status');
  return data;
}

export async function enableTwoFactor(currentPassword: string): Promise<Enable2FAResult> {
  const {data} = await api.post<Enable2FAResult>('/auth/2fa/enable', {
    current_password: currentPassword,
  });
  return data;
}

export async function verifyTwoFactorCode(otpCode: string): Promise<Verify2FAResult> {
  const {data} = await api.post<Verify2FAResult>('/auth/2fa/verify', {otp_code: otpCode});
  return data;
}

export async function disableTwoFactor(currentPassword: string): Promise<void> {
  await api.post('/auth/2fa/disable', {current_password: currentPassword});
}
