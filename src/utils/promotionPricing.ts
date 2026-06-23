/**
 * Calcul du prix d'une promotion selon le format et la durée (aligné sur la partie web).
 */

const DEFAULT_BASE_PRICES: Record<string, number> = {
  floating_left: 7,
  top_banner: 10,
  section: 5,
};

const DEFAULT_PRICE_PER_SECOND: Record<string, number> = {
  floating_left: 0.5,
  top_banner: 0.7,
  section: 0.3,
};

const MIN_DURATION = 5;

export type DisplayFormat = 'floating_left' | 'top_banner' | 'section';
export type MediaType = 'image' | 'video';

/**
 * Calcule le prix d'une promotion selon le format, la durée et le type de média.
 */
export function calculatePromotionPrice(
  displayFormat: DisplayFormat,
  slideDuration: number,
  mediaType: MediaType = 'image',
): number {
  const basePrice = DEFAULT_BASE_PRICES[displayFormat] ?? 0;
  const pricePerSecond = DEFAULT_PRICE_PER_SECOND[displayFormat] ?? 0;
  if (!basePrice) return 0;

  let total = basePrice;
  if (slideDuration > MIN_DURATION) {
    const extraSeconds = slideDuration - MIN_DURATION;
    total += extraSeconds * pricePerSecond;
  }
  if (mediaType === 'video') {
    total *= 1.25;
  }
  return total;
}

export function formatPromotionPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function getFormatDescription(format: DisplayFormat): string {
  const descriptions: Record<DisplayFormat, string> = {
    floating_left: 'Flottant à gauche',
    top_banner: 'Bande en haut',
    section: 'Section promotions',
  };
  return descriptions[format] ?? format;
}

export const DISPLAY_FORMATS: DisplayFormat[] = ['floating_left', 'top_banner', 'section'];

export const DURATION_OPTIONS = [5, 10, 15, 20, 25, 30];

export const MIN_SLIDE_DURATION = 5;
export const MAX_SLIDE_DURATION = 30;
