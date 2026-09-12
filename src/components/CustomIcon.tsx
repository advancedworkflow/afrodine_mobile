import React from 'react';
import IconWrapper from './IconWrapper';

// Tracés vectoriels repris tels quels des maquettes "Namke App Mobile"
// (icônes de la tab bar : accueil / cuisiniers / traiteur / panier / profil).
export type CustomIconName = 'home' | 'cook' | 'catering' | 'cart' | 'profile';

// require() défensif (même pattern que IconWrapper.getIconSource) : tant que
// l'app native n'a pas été rebuild avec le module natif react-native-svg
// (pod install / nouveau build Android), on retombe sur IconWrapper au lieu
// de faire planter tout le bundle au chargement.
let Svg: any = null;
let Path: any = null;
let Circle: any = null;
try {
  const svgLib = require('react-native-svg');
  Svg = svgLib.default ?? svgLib.Svg;
  Path = svgLib.Path;
  Circle = svgLib.Circle;
} catch (_) {
  Svg = null;
}

interface CustomIconProps {
  name: CustomIconName;
  /** Nom IconWrapper (Ionicons) utilisé tant que react-native-svg n'est pas disponible. */
  fallbackName: string;
  size?: number;
  color?: string;
}

const CustomIcon: React.FC<CustomIconProps> = ({name, fallbackName, size = 22, color = '#051004'}) => {
  if (!Svg || !Path || !Circle) {
    return <IconWrapper name={fallbackName} size={size} color={color} />;
  }

  const common = {
    fill: 'none' as const,
    stroke: color,
    strokeWidth: 2.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'home' && (
        <>
          <Path d="M3 10.5 12 3l9 7.5" {...common} />
          <Path d="M5 9.5V21h14V9.5" {...common} />
        </>
      )}
      {name === 'cook' && (
        <Path
          d="M17 21a1 1 0 0 0 1-1v-5.35c0-.46.32-.85.73-1.05a4 4 0 0 0-2.13-7.58 5 5 0 0 0-9.19 0 4 4 0 0 0-2.14 7.58c.42.2.73.59.73 1.05V20a1 1 0 0 0 1 1Z"
          {...common}
        />
      )}
      {name === 'catering' && (
        <>
          <Path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z" {...common} />
          <Path d="M7 21h10" {...common} />
        </>
      )}
      {name === 'cart' && (
        <>
          <Circle cx={8} cy={21} r={1} fill={color} stroke="none" />
          <Circle cx={19} cy={21} r={1} fill={color} stroke="none" />
          <Path
            d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            {...common}
          />
        </>
      )}
      {name === 'profile' && (
        <>
          <Circle cx={12} cy={8} r={4} {...common} />
          <Path d="M4 21a8 8 0 0 1 16 0" {...common} />
        </>
      )}
    </Svg>
  );
};

export default CustomIcon;
