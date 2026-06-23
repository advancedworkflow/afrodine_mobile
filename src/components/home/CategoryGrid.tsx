import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ScrollView} from 'react-native';
import IconWrapper from '../IconWrapper';
import {Colors} from '../../utils/colors';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: {bg: string; icon: string};
}

interface CategoryGridProps {
  categories?: Category[];
  onCategoryPress?: (category: Category) => void;
}

function normalizeCategoryName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

type ColorSet = {bg: string; icon: string};

/** Associe chaque catégorie (nom normalisé ou mots-clés) à une icône et une couleur. */
const CATEGORY_ICON_MAP: { keywords: string[]; icon: string; color: ColorSet }[] = [
  { keywords: ['africain', 'afrique'], icon: 'restaurant', color: Colors.category.orange },
  { keywords: ['europeen', 'europe', 'pizza', 'pates', 'steak'], icon: 'pizza', color: Colors.category.red },
  { keywords: ['asiatique', 'asia', 'sushi', 'riz', 'nouilles'], icon: 'restaurant', color: Colors.category.yellow },
  { keywords: ['fast-food', 'fastfood', 'burger', 'frites', 'snack'], icon: 'fast-food', color: Colors.category.orange },
  { keywords: ['vegetarien', 'vegan', 'vegane', 'legumes', 'salade', 'vert'], icon: 'leaf', color: Colors.category.green },
  { keywords: ['dessert', 'desserts', 'glace', 'gateau', 'sucré', 'sucr', 'patisserie'], icon: 'ice-cream', color: Colors.category.purple },
  { keywords: ['boisson', 'boissons', 'cafe', 'the', 'jus', 'soda', 'alcool', 'vin', 'biere'], icon: 'cafe', color: Colors.category.blue },
  { keywords: ['viande', 'viandes', 'grill', 'barbecue'], icon: 'flame', color: Colors.category.red },
  { keywords: ['poisson', 'fruits de mer', 'fruit de mer', 'seafood', 'mer'], icon: 'fish', color: Colors.category.blue },
  { keywords: ['entree', 'entrées', 'entrees', 'tapas', 'starter'], icon: 'restaurant', color: Colors.category.yellow },
  { keywords: ['soupe', 'soupes'], icon: 'restaurant', color: Colors.category.orange },
];

const DEFAULT_ICON = 'restaurant';
const DEFAULT_COLOR: ColorSet = { bg: Colors.gray[100], icon: Colors.gray[600] };

function getIconAndColorForCategory(name: string): { icon: string; color: ColorSet } {
  const normalized = normalizeCategoryName(name);
  for (const entry of CATEGORY_ICON_MAP) {
    if (entry.keywords.some(kw => normalized.includes(kw))) {
      return { icon: entry.icon, color: entry.color };
    }
  }
  return { icon: DEFAULT_ICON, color: DEFAULT_COLOR };
}

/** Mappe les catégories API / DB (id, name) vers le format UI (id, name, icon, color). */
export function mapApiCategoriesToUi(apiCategories: {id: number; name: string}[]): Category[] {
  return apiCategories.map((c) => {
    const { icon, color } = getIconAndColorForCategory(c.name);
    return {
      id: String(c.id),
      name: c.name,
      icon,
      color,
    };
  });
}

const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories = [],
  onCategoryPress,
}) => {
  const displayCategories = Array.isArray(categories) ? categories : [];
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Catégories</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>Voir tout</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.grid}>
        {displayCategories.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucune catégorie pour le moment</Text>
          </View>
        ) : (
        displayCategories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryItem}
            onPress={() => onCategoryPress?.(category)}>
            <View
              style={[
                styles.iconContainer,
                {backgroundColor: category.color.bg},
              ]}>
              <IconWrapper name={category.icon} size={24} color={category.color.icon} />
            </View>
            <Text style={styles.categoryName}>{category.name}</Text>
          </TouchableOpacity>
        ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primaryLight,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
  },
  emptyState: {
    width: '100%',
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
  },
});

export default CategoryGrid;

