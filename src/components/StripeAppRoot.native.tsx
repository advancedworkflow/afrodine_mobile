import React, {useEffect} from 'react';
import {StripeProvider} from '@stripe/stripe-react-native';
import {StripePaymentBridge} from './StripePaymentBridge';
import {API_BASE_URL} from '../utils/api';
import {
  StripeBootstrapProvider,
  useStripeBootstrap,
} from '../contexts/StripeBootstrapContext';

type Props = {
  children: React.ReactNode;
};

/**
 * Sous-arbre : une seule source de clé publique (fetch + merge depuis la réponse commande).
 */
function StripeAppRootInner({children}: Props) {
  const {publishableKey, mergePublishableKey} = useStripeBootstrap();

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/config/stripe-publishable-key`)
      .then(r => (r.ok ? r.json() : Promise.resolve({})))
      .then((d: {publishable_key?: string}) => {
        if (!cancelled) {
          mergePublishableKey(d?.publishable_key);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [mergePublishableKey]);

  return (
    <StripeProvider publishableKey={publishableKey}>
      <StripePaymentBridge stripeReady={!!publishableKey}>
        {children}
      </StripePaymentBridge>
    </StripeProvider>
  );
}

/**
 * Charge la clé publique Stripe (GET /config + champ order) et enveloppe l’app pour le Payment Sheet natif.
 */
export function StripeAppRoot({children}: Props) {
  return (
    <StripeBootstrapProvider>
      <StripeAppRootInner>{children}</StripeAppRootInner>
    </StripeBootstrapProvider>
  );
}
