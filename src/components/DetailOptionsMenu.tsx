import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Modal, type StyleProp, type ViewStyle} from 'react-native';
import IconWrapper from './IconWrapper';
import {Colors, Radius, Shadows} from '../utils/colors';
import {secondaryFont} from '../utils/fonts';

// Site public utilisé pour les liens partagés (pages /restaurant/:id du front web)
export const SHARE_BASE_URL = 'https://namke.de';

export interface DetailOption {
  icon: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface DetailOptionsMenuProps {
  options: DetailOption[];
  buttonStyle?: StyleProp<ViewStyle>;
}

/** Bouton ⋮ des pages de détail : ouvre une feuille d'actions en bas de l'écran. */
const DetailOptionsMenu: React.FC<DetailOptionsMenuProps> = ({options, buttonStyle}) => {
  const [visible, setVisible] = useState(false);

  const run = (fn: () => void) => {
    setVisible(false);
    // Laisse la feuille se fermer avant d'ouvrir une autre modale (partage natif, signalement)
    setTimeout(fn, 250);
  };

  return (
    <>
      <TouchableOpacity style={buttonStyle} onPress={() => setVisible(true)} activeOpacity={0.8}>
        <IconWrapper name="ellipsis-vertical" size={22} color={Colors.darkGreen} />
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={styles.sheet}>
            {options.map((o, i) => (
              <TouchableOpacity
                key={o.label}
                style={[styles.item, i === options.length - 1 && styles.itemLast]}
                onPress={() => run(o.onPress)}
                activeOpacity={0.7}>
                <IconWrapper name={o.icon} size={22} color={o.destructive ? Colors.error : Colors.darkGreen} />
                <Text style={[styles.itemText, o.destructive && {color: Colors.error}]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 36,
  },
  sheet: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  itemText: {
    fontSize: 18,
    color: Colors.text,
    fontFamily: secondaryFont,
  },
});

export default DetailOptionsMenu;
