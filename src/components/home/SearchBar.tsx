import React, {useState, useEffect, useRef} from 'react';
import {View, TextInput, StyleSheet, TouchableOpacity, Text} from 'react-native';
import IconWrapper from '../IconWrapper';
import {Colors} from '../../utils/colors';
import {useSearch} from '../../contexts/SearchContext';

export type SearchSuggestion = {
  id: string;
  title: string;
  subtitle?: string;
  type: 'dish' | 'restaurant';
  restaurantId?: string;
};

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onPress?: () => void;
  onFilterPress?: () => void;
  showResults?: boolean;
  /** Mettre le focus sur le champ à l'affichage (page recherche) */
  autoFocus?: boolean;
  /** Lance la recherche automatiquement pendant la saisie (debounce) */
  liveSearch?: boolean;
  /** Callback de saisie debounce pour charger les suggestions live */
  onLiveQueryChange?: (query: string) => void;
  /** Suggestions live à afficher sous l'input */
  suggestions?: SearchSuggestion[];
  /** Action au clic sur une suggestion */
  onSuggestionPress?: (item: SearchSuggestion) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Rechercher un plat ou restaurant...',
  onSearch,
  onPress,
  onFilterPress,
  showResults = false,
  autoFocus = false,
  liveSearch = false,
  onLiveQueryChange,
  suggestions = [],
  onSuggestionPress,
}) => {
  const {searchQuery, setSearchQuery, isSearching} = useSearch();
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [isFocused, setIsFocused] = useState(false);
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== searchQuery) {
        setSearchQuery(localQuery);
        // Recherche dynamique optionnelle (utilisée dans la page de résultats)
        if (liveSearch && onSearchRef.current) {
          onSearchRef.current(localQuery);
        }
        if (onLiveQueryChange) {
          onLiveQueryChange(localQuery);
        }
      }
    }, 300); // Debounce pour synchroniser le texte avec le contexte

    return () => clearTimeout(timer);
  }, [localQuery, searchQuery, setSearchQuery, liveSearch, onLiveQueryChange]);

  const handleClear = () => {
    setLocalQuery('');
    setSearchQuery('');
    if (onLiveQueryChange) onLiveQueryChange('');
    if (onSearchRef.current) {
      onSearchRef.current('');
    }
  };

  const showSuggestions =
    isFocused &&
    localQuery.trim().length > 0 &&
    Array.isArray(suggestions) &&
    suggestions.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.searchIcon}
            onPress={() => {
              if (onSearchRef.current) {
                onSearchRef.current(localQuery);
              }
            }}
            activeOpacity={0.7}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <IconWrapper
              name="search"
              size={20}
              color={Colors.gray[400]}
            />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={Colors.gray[400]}
            value={localQuery}
            onChangeText={setLocalQuery}
            onPressIn={onPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              // Laisse le temps au onPress de la suggestion de se déclencher
              setTimeout(() => setIsFocused(false), 120);
            }}
            returnKeyType="search"
            autoFocus={autoFocus}
            onSubmitEditing={() => {
              if (onSearchRef.current) {
                onSearchRef.current(localQuery);
              }
            }}
          />
          {localQuery.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <IconWrapper name="close-circle" size={20} color={Colors.gray[400]} />
            </TouchableOpacity>
          )}
          {isSearching && (
            <View style={styles.loadingIndicator}>
              <Text style={styles.loadingText}>...</Text>
            </View>
          )}
        </View>
        {onFilterPress && (
          <TouchableOpacity onPress={onFilterPress} style={styles.filterButton} activeOpacity={0.7}>
            <IconWrapper name="filter-outline" size={22} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
      {showSuggestions && (
        <View style={styles.suggestionsPanel}>
          {suggestions.map(item => (
            <TouchableOpacity
              key={`${item.type}-${item.id}`}
              style={styles.suggestionItem}
              activeOpacity={0.8}
              onPress={() => {
                setLocalQuery(item.title);
                setSearchQuery(item.title);
                setIsFocused(false);
                onSuggestionPress?.(item);
              }}>
              <IconWrapper
                name={item.type === 'dish' ? 'restaurant-outline' : 'storefront-outline'}
                size={18}
                color={Colors.textLight}
              />
              <View style={styles.suggestionTextWrap}>
                <Text style={styles.suggestionTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.subtitle ? (
                  <Text style={styles.suggestionSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    zIndex: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputContainer: {
    flex: 1,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.gray[50],
    borderWidth: 1,
    borderColor: Colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    flex: 1,
    height: 48,
    paddingLeft: 48,
    paddingRight: 40,
    backgroundColor: Colors.gray[50],
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    fontSize: 14,
    color: Colors.text,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  loadingIndicator: {
    position: 'absolute',
    right: 12,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textLight,
  },
  suggestionsPanel: {
    marginTop: 8,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
    gap: 10,
  },
  suggestionTextWrap: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  suggestionSubtitle: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
});

export default SearchBar;
