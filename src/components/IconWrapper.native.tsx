import React from 'react';

const RNIcon = require('react-native-vector-icons/Ionicons').default;

interface IconWrapperProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

const IconWrapper: React.FC<IconWrapperProps> = ({name, size = 24, color = '#000', style}) => {
  return <RNIcon name={name} size={size} color={color} style={style} />;
};

export default IconWrapper;
