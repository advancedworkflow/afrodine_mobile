import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ScrollView, Image} from 'react-native';
import {Colors} from '../../utils/colors';
import {getGroceryCategoryIcon} from '../../utils/groceryCategoryIcon';

export interface Category {
  id: string;
  name: string;
}

interface CategoryGridProps {
  categories?: Category[];
  selectedCategoryId?: string | null;
  onCategoryPress?: (category: Category) => void;
}

/** Mappe les catégories API / DB (id, name) vers le format UI (id, name). */
export function mapApiCategoriesToUi(apiCategories: {id: number; name: string}[]): Category[] {
  return apiCategories.map((c) => ({
    id: String(c.id),
    name: c.name,
  }));
}

const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories = [],
  selectedCategoryId = null,
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
      {displayCategories.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Aucune catégorie pour le moment</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.grid}>
          {displayCategories.map(category => {
            const isActive = selectedCategoryId === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryItem}
                onPress={() => onCategoryPress?.(category)}>
                <View
                  style={[
                    styles.iconContainer,
                    isActive ? styles.iconContainerActive : null,
                  ]}>
                  <Image
                    source={getGroceryCategoryIcon(category.name)}
                    style={styles.iconImage}
                    resizeMode="cover"
                  />
                </View>
                <Text
                  style={[styles.categoryName, isActive ? styles.categoryNameActive : null]}
                  numberOfLines={1}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
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
    paddingRight: 16,
  },
  categoryItem: {
    width: 76,
    alignItems: 'center',
    marginRight: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
    backgroundColor: Colors.gray[100],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconContainerActive: {
    backgroundColor: Colors.category.orange.bg,
    borderColor: Colors.category.orange.icon,
  },
  iconImage: {
    width: '100%',
    height: '100%',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
  },
  categoryNameActive: {
    fontWeight: '700',
    color: Colors.category.orange.icon,
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
