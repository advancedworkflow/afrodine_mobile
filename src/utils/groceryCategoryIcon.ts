function normalize(name?: string | null): string {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

const africain = require('../assets/grocery-categories/africain.png');
const asiatique = require('../assets/grocery-categories/asiatique.png');
const boissons = require('../assets/grocery-categories/boissons.png');
const cereales = require('../assets/grocery-categories/cereales.png');
const condiments = require('../assets/grocery-categories/condiments.png');
const confitures = require('../assets/grocery-categories/confitures.png');
const conserves = require('../assets/grocery-categories/conserves.png');
const desserts = require('../assets/grocery-categories/desserts.png');
const epices = require('../assets/grocery-categories/epices.png');
const europeen = require('../assets/grocery-categories/europeen.png');
const farines = require('../assets/grocery-categories/farines.png');
const fastFood = require('../assets/grocery-categories/fast_food.png');
const fromages = require('../assets/grocery-categories/fromages.png');
const huiles = require('../assets/grocery-categories/huiles.png');
const infusions = require('../assets/grocery-categories/infusions.png');
const legumesSecs = require('../assets/grocery-categories/legumes_secs.png');
const legumineuses = require('../assets/grocery-categories/legumineuses.png');
const pates = require('../assets/grocery-categories/pates.png');
const petitDejeuner = require('../assets/grocery-categories/petit_dejeuner.png');
const snacks = require('../assets/grocery-categories/snacks.png');
const sucres = require('../assets/grocery-categories/sucres.png');
const tous = require('../assets/grocery-categories/tous.png');
const vegetarien = require('../assets/grocery-categories/vegetarien.png');

const GROCERY_ICON_MAP: {keywords: string[]; icon: number}[] = [
  {keywords: ['africain', 'afrique'], icon: africain},
  {keywords: ['asiatique', 'asie'], icon: asiatique},
  {keywords: ['boisson'], icon: boissons},
  {keywords: ['cereale'], icon: cereales},
  {keywords: ['condiment'], icon: condiments},
  {keywords: ['confiture'], icon: confitures},
  {keywords: ['conserve'], icon: conserves},
  {keywords: ['dessert', 'sucrerie', 'patisserie'], icon: desserts},
  {keywords: ['epice'], icon: epices},
  {keywords: ['europeen', 'europe'], icon: europeen},
  {keywords: ['farine'], icon: farines},
  {keywords: ['fast-food', 'fastfood', 'fast food', 'snack rapide'], icon: fastFood},
  {keywords: ['fromage'], icon: fromages},
  {keywords: ['huile'], icon: huiles},
  {keywords: ['infusion', 'tisane', 'the'], icon: infusions},
  {keywords: ['legume sec', 'legumes secs'], icon: legumesSecs},
  {keywords: ['legumineuse'], icon: legumineuses},
  {keywords: ['pate', 'pates'], icon: pates},
  {keywords: ['petit-dejeuner', 'petit dejeuner', 'breakfast'], icon: petitDejeuner},
  {keywords: ['snack'], icon: snacks},
  {keywords: ['sucre'], icon: sucres},
  {keywords: ['vegetarien', 'vegan', 'vegetal'], icon: vegetarien},
];

/** Icone illustree correspondant a une categorie grocery (nom libre, FR, avec ou sans accents). */
export function getGroceryCategoryIcon(categoryName?: string | null): number {
  const normalized = normalize(categoryName);
  if (!normalized || normalized === 'tous' || normalized === 'autres') {
    return tous;
  }
  for (const entry of GROCERY_ICON_MAP) {
    if (entry.keywords.some(kw => normalized.includes(kw))) {
      return entry.icon;
    }
  }
  return tous;
}

export default getGroceryCategoryIcon;
