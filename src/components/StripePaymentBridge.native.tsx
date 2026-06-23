import React from 'react';
import {useStripe} from '@stripe/stripe-react-native';
import {StripePaymentContext} from '../contexts/StripePaymentContext';

type Props = {
  children: React.ReactNode;
  /** Si false : pas d’initialisation Stripe native (fallback navigateur). */
  stripeReady: boolean;
};

/**
 * Fournit les méthodes Payment Sheet uniquement lorsque `stripeReady` est true
 * (clé publique chargée + StripeProvider monté).
 */
export function StripePaymentBridge({children, stripeReady}: Props) {
  if (!stripeReady) {
    return (
      <StripePaymentContext.Provider value={null}>
        {children}
      </StripePaymentContext.Provider>
    );
  }
  return <StripePaymentBridgeInner>{children}</StripePaymentBridgeInner>;
}

function StripePaymentBridgeInner({children}: {children: React.ReactNode}) {
  const stripe = useStripe();
  return (
    <StripePaymentContext.Provider value={stripe}>
      {children}
    </StripePaymentContext.Provider>
  );
}
