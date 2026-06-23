import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import IconWrapper from './IconWrapper';
import {Colors} from '../utils/colors';
import {secondaryFont} from '../utils/fonts';

export interface FilterDropdownOption<T = string | number | undefined> {
  value: T;
  label: string;
}

interface FilterDropdownProps<T = string | number | undefined> {
  label: string;
  value: T | undefined | null;
  options: FilterDropdownOption<T>[];
  onSelect: (value: T) => void;
  placeholder?: string;
  getOptionLabel?: (value: T) => string;
}

function FilterDropdown<T = string | number | undefined>({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Tous',
  getOptionLabel,
}: FilterDropdownProps<T>) {
  const [open, setOpen] = useState(false);

  const displayValue =
    value === undefined || value === null
      ? placeholder
      : getOptionLabel
        ? getOptionLabel(value)
        : (options.find(o => o.value === value)?.label ?? String(value));

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}>
        <Text style={styles.triggerText} numberOfLines={1}>
          {displayValue}
        </Text>
        <IconWrapper name="chevron-down" size={18} color={Colors.textLight} />
      </TouchableOpacity>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={12}>
                <IconWrapper name="close-outline" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => `${item.value}-${item.label}`}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.optionRow,
                    item.value === value && styles.optionRowActive,
                  ]}
                  onPress={() => {
                    onSelect(item.value);
                    setOpen(false);
                  }}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.optionText,
                      item.value === value && styles.optionTextActive,
                    ]}>
                    {item.label}
                  </Text>
                  {item.value === value ? (
                    <IconWrapper name="checkmark" size={20} color={Colors.primary} />
                  ) : null}
                </TouchableOpacity>
              )}
              style={styles.optionList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minWidth: 0,
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textLight,
    marginBottom: 4,
    fontFamily: secondaryFont,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  triggerText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    fontFamily: secondaryFont,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  optionList: {
    maxHeight: 320,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.gray[100],
  },
  optionRowActive: {
    backgroundColor: Colors.gray[50],
  },
  optionText: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: secondaryFont,
  },
  optionTextActive: {
    fontWeight: '600',
    color: Colors.primary,
  },
});

export default FilterDropdown;
