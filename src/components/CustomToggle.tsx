import React from 'react';
import {TouchableOpacity, View, StyleSheet} from 'react-native';
import {Colors} from '../utils/colors';

interface CustomToggleProps {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
}

/**
 * Toggle personnalisé (pilule verte / grise) — reproduit exactement le style de la
 * maquette D1 (paramètres du profil), plutôt que le <Switch> natif dont l'apparence
 * varie selon l'OS.
 */
const CustomToggle = ({value, onValueChange, disabled}: CustomToggleProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={[styles.track, value ? styles.trackOn : styles.trackOff, disabled && styles.disabled]}>
      <View style={[styles.thumb, value && styles.thumbOn]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  track: {
    width: 52,
    height: 30,
    borderRadius: 999,
    padding: 3,
    justifyContent: 'center',
  },
  trackOn: {
    backgroundColor: Colors.olive,
    alignItems: 'flex-end',
  },
  trackOff: {
    backgroundColor: 'rgba(5,16,4,0.2)',
    alignItems: 'flex-start',
  },
  disabled: {
    opacity: 0.5,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.namkeWhite,
  },
  thumbOn: {},
});

export default CustomToggle;
