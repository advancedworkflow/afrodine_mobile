import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';

type StripeBootstrapValue = {
  /** Clé publique actuellement utilisée par StripeProvider */
  publishableKey: string;
  /** Fusionne une clé (ex. renvoyée par POST /orders) si aucune n’est encore chargée */
  mergePublishableKey: (key: string | undefined | null) => void;
};

const StripeBootstrapContext = createContext<StripeBootstrapValue | null>(null);

export function StripeBootstrapProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [publishableKey, setPublishableKey] = useState('');

  const mergePublishableKey = useCallback((key: string | undefined | null) => {
    const t = (key || '').trim();
    if (!t) {
      return;
    }
    setPublishableKey(prev => (prev.length > 0 ? prev : t));
  }, []);

  const value = useMemo(
    () => ({publishableKey, mergePublishableKey}),
    [publishableKey, mergePublishableKey],
  );

  return (
    <StripeBootstrapContext.Provider value={value}>
      {children}
    </StripeBootstrapContext.Provider>
  );
}

export function useStripeBootstrap(): StripeBootstrapValue {
  const ctx = useContext(StripeBootstrapContext);
  if (!ctx) {
    throw new Error('useStripeBootstrap must be used within StripeBootstrapProvider');
  }
  return ctx;
}
