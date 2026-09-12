import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Colors} from '../../utils/colors';
import {fontDisplay, fontHeading} from '../../utils/fonts';

interface SectionHeaderProps {
  title: string;
  seeAllText?: string;
  onSeeAllPress?: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  seeAllText = 'Voir tout',
  onSeeAllPress,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {onSeeAllPress && (
        <TouchableOpacity onPress={onSeeAllPress}>
          <Text style={styles.seeAll}>{seeAllText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    color: Colors.text,
    fontFamily: fontDisplay,
  },
  seeAll: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: fontHeading,
  },
});

export default SectionHeader;

