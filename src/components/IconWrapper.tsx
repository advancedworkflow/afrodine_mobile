import React from 'react';
import {Platform, View} from 'react-native';

function getIconSource() {
  if (Platform.OS === 'web') {
    try {
      return {type: 'react-icons' as const, io5: require('react-icons/io5')};
    } catch {
      return {type: 'expo' as const};
    }
  }
  return {type: 'native' as const, RNIcon: require('react-native-vector-icons/Ionicons').default};
}

const iconSource = getIconSource();

function toIo5Name(name: string): string {
  const pascal = name
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join('');
  return `Io${pascal}`;
}

interface IconWrapperProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

const IconWrapper: React.FC<IconWrapperProps> = ({name, size = 24, color = '#000', style}) => {
  if (Platform.OS === 'web' && iconSource.type === 'react-icons' && iconSource.io5) {
    const IoName = toIo5Name(name);
    const IconSvg = (iconSource.io5 as Record<string, React.ComponentType<{size?: number; color?: string; style?: any}> | undefined>)[IoName];
    if (IconSvg) {
      const px = `${size}px`;
      const svgStyle = {
        display: 'block' as const,
        flexShrink: 0,
        width: px,
        height: px,
        minWidth: px,
        minHeight: px,
        color: color,
      };
      return (
        <View style={[{display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: px, height: px}, style]}>
          <IconSvg size={size} color={color} style={svgStyle} />
        </View>
      );
    }
  }

  if (Platform.OS === 'web' && iconSource.type === 'expo') {
    const {Ionicons} = require('@expo/vector-icons');
    return (
      <View style={[{display: 'inline-flex', alignItems: 'center', justifyContent: 'center'}, style]}>
        <Ionicons name={name as any} size={size} color={color} style={{display: 'block'}} />
      </View>
    );
  }

  if (iconSource.type === 'native' && iconSource.RNIcon) {
    const RNIcon = iconSource.RNIcon;
    return <RNIcon name={name} size={size} color={color} style={style} />;
  }

  return null;
};

export default IconWrapper;