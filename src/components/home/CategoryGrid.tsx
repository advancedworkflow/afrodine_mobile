import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ScrollView, Image} from 'react-native';
import {Colors} from '../../utils/colors';
import {fontHeading, fontUI} from '../../utils/fonts';
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
  if (displayCategories.length === 0) {
    return null;
  }
  return (
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
            onPress={() => onCategoryPress?.(category)}
            activeOpacity={0.85}>
            <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
              <Image
                source={getGroceryCategoryIcon(category.name)}
                style={styles.iconImage}
                resizeMode="cover"
              />
            </View>
            <Text
              style={[styles.categoryName, isActive && styles.categoryNameActive]}
              numberOfLines={1}>
              {category.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    paddingHorizontal: 22,
    gap: 18,
  },
  categoryItem: {
    width: 62,
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  iconContainerActive: {
    backgroundColor: Colors.terracotta,
  },
  iconImage: {
    width: '100%',
    height: '100%',
  },
  categoryName: {
    fontSize: 12,
    fontFamily: fontUI,
    color: Colors.textLight,
    textAlign: 'center',
  },
  categoryNameActive: {
    fontFamily: fontHeading,
    color: Colors.text,
  },
});

export default CategoryGrid;
