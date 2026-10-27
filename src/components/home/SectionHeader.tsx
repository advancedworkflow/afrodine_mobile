import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Colors} from '../../utils/colors';
import {fontDisplay, fontHeading} from '../../utils/fonts';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  seeAllText?: string;
  onSeeAllPress?: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  seeAllText,
  onSeeAllPress,
}) => {
  const {t} = useTranslation();
  const resolvedSeeAllText = seeAllText ?? t('sectionHeader.seeAll');
  return (
    <View style={styles.wrap}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        {onSeeAllPress && (
          <TouchableOpacity onPress={onSeeAllPress}>
            <Text style={styles.seeAll}>{resolvedSeeAllText}</Text>
          </TouchableOpacity>
        )}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    color: Colors.text,
    fontFamily: fontDisplay,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: fontHeading,
    marginTop: 4,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: fontHeading,
  },
});

export default SectionHeader;

