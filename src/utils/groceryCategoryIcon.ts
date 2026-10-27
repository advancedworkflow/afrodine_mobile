function normalize(name?: string | null): string {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

const epicerie = require('../assets/food-icons/epicerie.png');
const salades = require('../assets/food-icons/salades.png');
const soupes = require('../assets/food-icons/soupes.png');
const petitDejeuner = require('../assets/food-icons/petit-dejeuner.png');
const patisseries = require('../assets/food-icons/patisseries.png');
const boulangerie = require('../assets/food-icons/boulangerie.png');
const glaces = require('../assets/food-icons/glaces.png');
const desserts = require('../assets/food-icons/desserts.png');
const sucreries = require('../assets/food-icons/sucreries.png');
const bubbleTea = require('../assets/food-icons/bubble-tea.png');
const smoothies = require('../assets/food-icons/smoothies.png');
const boissons = require('../assets/food-icons/boissons.png');
const vegan = require('../assets/food-icons/vegan.png');
const grillades = require('../assets/food-icons/grillades.png');
const barbecue = require('../assets/food-icons/barbecue.png');
const poissonsGrilles = require('../assets/food-icons/poissons-grilles.png');
const fruitsDeMer = require('../assets/food-icons/fruits-de-mer.png');
const ailesDePoulet = require('../assets/food-icons/ailes-de-poulet.png');
const fromages = require('../assets/food-icons/fromages.png');
const pates = require('../assets/food-icons/pates.png');
const hotDogs = require('../assets/food-icons/hot-dogs.png');
const burgers = require('../assets/food-icons/burgers.png');
const clubSandwich = require('../assets/food-icons/club-sandwich.png');
const sandwichs = require('../assets/food-icons/sandwichs.png');
const wraps = require('../assets/food-icons/wraps.png');
const tacos = require('../assets/food-icons/tacos.png');
const burritos = require('../assets/food-icons/burritos.png');
const kebabs = require('../assets/food-icons/kebabs.png');
const pizza = require('../assets/food-icons/pizza.png');
const sushi = require('../assets/food-icons/sushi.png');
const thai = require('../assets/food-icons/thai.png');
const dimSum = require('../assets/food-icons/dim-sum.png');
const poke = require('../assets/food-icons/poke.png');
const ramen = require('../assets/food-icons/ramen.png');
const indien = require('../assets/food-icons/indien.png');
const mediterraneen = require('../assets/food-icons/mediterraneen.png');
const platsAfricains = require('../assets/food-icons/plats-africains.png');
const snacks = require('../assets/food-icons/snacks.png');
const cadeaux = require('../assets/food-icons/cadeaux.png');
const cuisineLocale = require('../assets/food-icons/cuisine-locale.png');
// Rayons d'épicerie sans équivalent dans le jeu food-icons
const cereales = require('../assets/grocery-categories/cereales.png');
const condiments = require('../assets/grocery-categories/condiments.png');
const confitures = require('../assets/grocery-categories/confitures.png');
const conserves = require('../assets/grocery-categories/conserves.png');
const epices = require('../assets/grocery-categories/epices.png');
const farines = require('../assets/grocery-categories/farines.png');
const huiles = require('../assets/grocery-categories/huiles.png');
const infusions = require('../assets/grocery-categories/infusions.png');
const legumesSecs = require('../assets/grocery-categories/legumes_secs.png');
const legumineuses = require('../assets/grocery-categories/legumineuses.png');

// Icônes illustrées des catégories (plats de l'accueil et rayons d'épicerie), par mots-clés
// normalisés (minuscules, sans accents). Ordre = priorité : le plus spécifique d'abord.
const CATEGORY_ICON_MAP: {keywords: string[]; icon: number}[] = [
  {keywords: ['entree', 'salade'], icon: salades},
  {keywords: ['soupe'], icon: soupes},
  {keywords: ['petit-dejeuner', 'petit dejeuner', 'breakfast'], icon: petitDejeuner},
  {keywords: ['patisserie', 'viennoiserie'], icon: patisseries},
  {keywords: ['boulangerie', 'pain'], icon: boulangerie},
  {keywords: ['glace'], icon: glaces},
  {keywords: ['dessert'], icon: desserts},
  {keywords: ['sucrerie', 'bonbon', 'sucre'], icon: sucreries},
  {keywords: ['bubble'], icon: bubbleTea},
  {keywords: ['smoothie', 'jus'], icon: smoothies},
  {keywords: ['boisson'], icon: boissons},
  {keywords: ['vegetarien', 'vegan', 'vegetal'], icon: vegan},
  {keywords: ['grillade'], icon: grillades},
  {keywords: ['barbecue', 'bbq'], icon: barbecue},
  {keywords: ['poisson'], icon: poissonsGrilles},
  {keywords: ['fruits de mer', 'fruit de mer'], icon: fruitsDeMer},
  {keywords: ['poulet'], icon: ailesDePoulet},
  {keywords: ['fromage'], icon: fromages},
  {keywords: ['pates', 'pate'], icon: pates},
  {keywords: ['hot dog', 'hot-dog'], icon: hotDogs},
  {keywords: ['burger', 'fast-food', 'fastfood', 'fast food'], icon: burgers},
  {keywords: ['club'], icon: clubSandwich},
  {keywords: ['sandwich'], icon: sandwichs},
  {keywords: ['wrap'], icon: wraps},
  {keywords: ['tacos'], icon: tacos},
  {keywords: ['burrito'], icon: burritos},
  {keywords: ['kebab'], icon: kebabs},
  {keywords: ['pizza'], icon: pizza},
  {keywords: ['sushi'], icon: sushi},
  {keywords: ['thai'], icon: thai},
  {keywords: ['dim sum'], icon: dimSum},
  {keywords: ['poke'], icon: poke},
  {keywords: ['ramen', 'asiatique', 'asie'], icon: ramen},
  {keywords: ['indien'], icon: indien},
  {keywords: ['mediterraneen', 'europeen', 'europe'], icon: mediterraneen},
  {keywords: ['africain', 'afrique', 'plat'], icon: platsAfricains},
  {keywords: ['snack'], icon: snacks},
  {keywords: ['cadeau'], icon: cadeaux},
  {keywords: ['local'], icon: cuisineLocale},
  {keywords: ['cereale'], icon: cereales},
  {keywords: ['condiment'], icon: condiments},
  {keywords: ['confiture'], icon: confitures},
  {keywords: ['conserve'], icon: conserves},
  {keywords: ['epice'], icon: epices},
  {keywords: ['farine'], icon: farines},
  {keywords: ['huile'], icon: huiles},
  {keywords: ['infusion', 'tisane', 'the'], icon: infusions},
  {keywords: ['legume sec', 'legumes secs'], icon: legumesSecs},
  {keywords: ['legumineuse'], icon: legumineuses},
];

/** Icône illustrée d'une catégorie de plats ou d'épicerie (nom libre, FR, avec ou sans accents). */
export function getGroceryCategoryIcon(categoryName?: string | null): number {
  const normalized = normalize(categoryName);
  if (!normalized || normalized === 'tous' || normalized === 'autres') {
    return epicerie;
  }
  for (const entry of CATEGORY_ICON_MAP) {
    if (entry.keywords.some(kw => normalized.includes(kw))) {
      return entry.icon;
    }
  }
  return epicerie;
}

export default getGroceryCategoryIcon;
