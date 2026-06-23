import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
  PanResponder,
} from 'react-native';
import IconWrapper from './IconWrapper';
import FilterDropdown from './FilterDropdown';
import {Colors} from '../utils/colors';
import {secondaryFont} from '../utils/fonts';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');
const DRAG_CLOSE_THRESHOLD = 50;
const VELOCITY_CLOSE_THRESHOLD = 0.25;

export interface PriceRangeOption {
  min: number;
  max: number | null;
  label: string;
  value: string;
}

export interface DeliveryRangeOption {
  min: number;
  max: number;
  label: string;
  value: string;
}

export interface RatingOption {
  min: number;
  label: string;
  value: string;
}

export interface FilterOptions {
  cities: string[];
  cuisine_types: string[];
  diet_types?: string[];
  price_ranges?: PriceRangeOption[];
  delivery_ranges?: DeliveryRangeOption[];
  rating_options?: RatingOption[];
}

export interface SelectedFilters {
  city?: string;
  cuisine_type?: string;
  diet_type?: string;
  price_range?: string;
  min_rating?: number;
  max_delivery_fee?: number;
}

const DEFAULT_FILTER_OPTIONS: FilterOptions = {
  cities: [],
  cuisine_types: [],
  diet_types: [],
  price_ranges: [],
  delivery_ranges: [],
  rating_options: [],
};

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters?: SelectedFilters) => void;
  onReset?: () => void;
  filterOptions?: FilterOptions;
  selectedFilters?: SelectedFilters;
  onFilterChange?: (partial: Partial<SelectedFilters>) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  onReset = () => {},
  filterOptions = DEFAULT_FILTER_OPTIONS,
  selectedFilters = {},
  onFilterChange = () => {},
}) => {
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const dragY = React.useRef(new Animated.Value(0)).current;
  const backdropOpacity = React.useRef(new Animated.Value(0)).current;
  const scrollOffsetY = React.useRef(0);

  const handleScroll = React.useCallback((e: any) => {
    scrollOffsetY.current = e.nativeEvent?.contentOffset?.y ?? 0;
  }, []);

  const shouldCaptureDrag = React.useCallback((_evt: any, gestureState: any) => {
    const scrollAtTop = scrollOffsetY.current <= 2;
    const isDownward = gestureState.dy > 12;
    return scrollAtTop && isDownward;
  }, []);

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: shouldCaptureDrag,
        onMoveShouldSetPanResponderCapture: shouldCaptureDrag,
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            dragY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          const shouldClose =
            gestureState.dy > DRAG_CLOSE_THRESHOLD ||
            (gestureState.vy > 0 && gestureState.vy > VELOCITY_CLOSE_THRESHOLD);
          if (shouldClose) {
            Animated.timing(dragY, {
              toValue: SCREEN_HEIGHT,
              duration: 200,
              useNativeDriver: false,
            }).start(() => {
              dragY.setValue(0);
              onClose();
            });
          } else {
            Animated.spring(dragY, {
              toValue: 0,
              useNativeDriver: false,
              tension: 65,
              friction: 11,
            }).start();
          }
        },
      }),
    [dragY, onClose, shouldCaptureDrag],
  );

  React.useEffect(() => {
    if (visible) {
      dragY.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: false,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropOpacity, dragY]);

  if (!visible) {
    return null;
  }

  const sheetTranslateY = Animated.add(slideAnim, dragY);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity,
            },
          ]}
        />
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{translateY: sheetTranslateY}],
            },
          ]}
          {...panResponder.panHandlers}>
          <View style={styles.draggableArea}>
            <View style={styles.handleBar} />
            <Text style={styles.slideHint}>Glissez vers le bas pour fermer</Text>
            <View style={styles.header}>
              <Text style={styles.title}>Filtrer par</Text>
              <TouchableOpacity onPress={onReset} style={styles.resetButton} activeOpacity={0.7}>
                <Text style={styles.resetText}>Réinitialiser</Text>
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentInner}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}>
            {/* Ville - dropdown */}
            <FilterDropdown<string | undefined>
              label="Ville"
              value={selectedFilters.city}
              placeholder="Toutes"
              options={[
                { value: undefined, label: 'Toutes' },
                ...(filterOptions.cities || []).map(city => ({ value: city, label: city })),
              ]}
              onSelect={city => onFilterChange({city})}
            />
            {/* Type de cuisine */}
            <Text style={styles.sectionLabel}>Type de cuisine</Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[styles.optionChip, !selectedFilters.cuisine_type && styles.optionChipActive]}
                onPress={() => onFilterChange({cuisine_type: undefined})}
                activeOpacity={0.7}>
                <Text style={[styles.optionChipText, !selectedFilters.cuisine_type && styles.optionChipTextActive]}>
                  Tous
                </Text>
              </TouchableOpacity>
              {(filterOptions.cuisine_types || []).map(cuisine => (
                <TouchableOpacity
                  key={cuisine}
                  style={[styles.optionChip, selectedFilters.cuisine_type === cuisine && styles.optionChipActive]}
                  onPress={() => onFilterChange({cuisine_type: cuisine})}
                  activeOpacity={0.7}>
                  <Text style={[styles.optionChipText, selectedFilters.cuisine_type === cuisine && styles.optionChipTextActive]}>
                    {cuisine}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Régime alimentaire */}
            {(filterOptions.diet_types?.length ?? 0) > 0 && (
              <>
                <Text style={styles.sectionLabel}>Régime alimentaire</Text>
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={[styles.optionChip, !selectedFilters.diet_type && styles.optionChipActive]}
                    onPress={() => onFilterChange({diet_type: undefined})}
                    activeOpacity={0.7}>
                    <Text style={[styles.optionChipText, !selectedFilters.diet_type && styles.optionChipTextActive]}>
                      Tous
                    </Text>
                  </TouchableOpacity>
                  {filterOptions.diet_types!.map(diet => (
                    <TouchableOpacity
                      key={diet}
                      style={[styles.optionChip, selectedFilters.diet_type === diet && styles.optionChipActive]}
                      onPress={() => onFilterChange({diet_type: diet})}
                      activeOpacity={0.7}>
                      <Text style={[styles.optionChipText, selectedFilters.diet_type === diet && styles.optionChipTextActive]}>
                        {diet}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            {/* Fourchette de prix */}
            {(filterOptions.price_ranges?.length ?? 0) > 0 && (
              <>
                <Text style={styles.sectionLabel}>Fourchette de prix</Text>
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={[styles.optionChip, !selectedFilters.price_range && styles.optionChipActive]}
                    onPress={() => onFilterChange({price_range: undefined})}
                    activeOpacity={0.7}>
                    <Text style={[styles.optionChipText, !selectedFilters.price_range && styles.optionChipTextActive]}>
                      Toutes
                    </Text>
                  </TouchableOpacity>
                  {filterOptions.price_ranges!.map(pr => (
                    <TouchableOpacity
                      key={pr.value}
                      style={[styles.optionChip, selectedFilters.price_range === pr.value && styles.optionChipActive]}
                      onPress={() => onFilterChange({price_range: pr.value})}
                      activeOpacity={0.7}>
                      <Text style={[styles.optionChipText, selectedFilters.price_range === pr.value && styles.optionChipTextActive]}>
                        {pr.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            {/* Frais de livraison max */}
            {(filterOptions.delivery_ranges?.length ?? 0) > 0 && (
              <>
                <Text style={styles.sectionLabel}>Frais de livraison max</Text>
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={[styles.optionChip, selectedFilters.max_delivery_fee == null && styles.optionChipActive]}
                    onPress={() => onFilterChange({max_delivery_fee: undefined})}
                    activeOpacity={0.7}>
                    <Text style={[styles.optionChipText, selectedFilters.max_delivery_fee == null && styles.optionChipTextActive]}>
                      Tous
                    </Text>
                  </TouchableOpacity>
                  {filterOptions.delivery_ranges!.map(dr => (
                    <TouchableOpacity
                      key={dr.value}
                      style={[styles.optionChip, selectedFilters.max_delivery_fee === dr.max && styles.optionChipActive]}
                      onPress={() => onFilterChange({max_delivery_fee: dr.max})}
                      activeOpacity={0.7}>
                      <Text style={[styles.optionChipText, selectedFilters.max_delivery_fee === dr.max && styles.optionChipTextActive]}>
                        {dr.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            {/* Note minimale */}
            {(filterOptions.rating_options?.length ?? 0) > 0 && (
              <>
                <Text style={styles.sectionLabel}>Note minimale</Text>
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={[styles.optionChip, selectedFilters.min_rating == null && styles.optionChipActive]}
                    onPress={() => onFilterChange({min_rating: undefined})}
                    activeOpacity={0.7}>
                    <Text style={[styles.optionChipText, selectedFilters.min_rating == null && styles.optionChipTextActive]}>
                      Toutes
                    </Text>
                  </TouchableOpacity>
                  {filterOptions.rating_options!.map(opt => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.optionChip, selectedFilters.min_rating === opt.min && styles.optionChipActive]}
                      onPress={() => onFilterChange({min_rating: opt.min})}
                      activeOpacity={0.7}>
                      <Text style={[styles.optionChipText, selectedFilters.min_rating === opt.min && styles.optionChipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => onApply(selectedFilters)}
              activeOpacity={0.8}>
              <Text style={styles.applyButtonText}>Appliquer les filtres</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  draggableArea: {
    paddingTop: 12,
    paddingBottom: 8,
    minHeight: 52,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray[300],
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  slideHint: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: secondaryFont,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  resetButton: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  resetText: {
    fontSize: 15,
    color: Colors.error,
    fontWeight: '600',
  },
  content: {
    flexGrow: 0,
  },
  contentInner: {
    padding: 20,
    paddingBottom: 16,
  },
  dropdownSection: {
    marginTop: 12,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textLight,
    marginBottom: 8,
    marginTop: 12,
    fontFamily: secondaryFont,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  optionChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionChipText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  optionChipTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: secondaryFont,
  },
});

export default FilterModal;
