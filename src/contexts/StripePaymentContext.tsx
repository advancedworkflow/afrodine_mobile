import {createContext, useContext} from 'react';

/** API Payment Sheet (@stripe/stripe-react-native useStripe), typée légèrement pour éviter une dépendance runtime web. */
export type StripeNativeApi = {
  initPaymentSheet: (params: {
    paymentIntentClientSecret: string;
    merchantDisplayName: string;
    defaultBillingDetails?: {email?: string};
  }) => Promise<{error?: {message?: string; code?: string}}>;
  presentPaymentSheet: () => Promise<{error?: {message?: string; code?: string}}>;
} | null;

export const StripePaymentContext = createContext<StripeNativeApi>(null);

export function useStripePayment(): StripeNativeApi {
  return useContext(StripePaymentContext);
}
