import React from 'react';
import {StripePaymentContext} from '../contexts/StripePaymentContext';

type Props = {
  children: React.ReactNode;
  stripeReady?: boolean;
};

export function StripePaymentBridge({children}: Props) {
  return (
    <StripePaymentContext.Provider value={null}>
      {children}
    </StripePaymentContext.Provider>
  );
}
