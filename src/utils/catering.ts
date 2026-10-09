// Référentiel traiteur partagé par les écrans client et restaurateur — miroir de
// afrodineui/src/constants/catering.js, pour que listes et prix soient les mêmes que le web et l'API.

// Occasion de l'événement choisie par le client (`occasion` de la réservation)
export const CATERING_OCCASION_IDS = ['birthday', 'christening', 'wedding', 'corporate', 'other'] as const;

// Régimes : gérés par l'offre (`dietary_options`) ou demandés par le client (`dietary_requirements`)
export const DIETARY_IDS = [
  'vegetarian',
  'vegan',
  'halal',
  'no_pork',
  'gluten_free',
  'dairy_free',
  'no_peanut',
] as const;

// Options payantes d'une offre : drapeau de disponibilité + frais associé
export const CATERING_PAID_OPTIONS = [
  {id: 'delivery', flag: 'delivery_available', fee: 'delivery_fee'},
  {id: 'setup', flag: 'setup_available', fee: 'setup_fee'},
  {id: 'equipment', flag: 'equipment_rental', fee: 'equipment_fee'},
  {id: 'staff', flag: 'staff_available', fee: 'staff_fee_per_hour', perHour: true},
] as const;

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export interface CateringOfferPricing {
  base_price?: number | string | null;
  price_per_person?: number | string | null;
}

/** Prix d'appel : prix par personne s'il existe, sinon forfait (prix de base). */
export function getOfferStartingPrice(offer: CateringOfferPricing | null) {
  return num(offer?.price_per_person) > 0
    ? {amount: num(offer!.price_per_person), perPerson: true}
    : {amount: num(offer?.base_price), perPerson: false};
}
