module.exports = function (api) {
  // Configure le cache en premier
  api.cache.forever();
  
  // Détecte si on est en mode web (via variable d'environnement uniquement)
  // On évite api.env() pour éviter les conflits de cache
  const isWeb = process.env.PLATFORM === 'web' || process.env.BABEL_ENV === 'web';
  
  return {
    presets: isWeb 
      ? [
          [
            '@babel/preset-env',
            {
              targets: { browsers: ['last 2 versions'] },
              modules: 'auto', // Détecte automatiquement le type de module
            },
          ],
          [
            '@babel/preset-react',
            {
              runtime: 'automatic', // Utilise la nouvelle transformation JSX automatique
            },
          ],
          '@babel/preset-typescript',
        ]
      : ['module:metro-react-native-babel-preset'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.web.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            ...(isWeb && { 'react-native$': 'react-native-web' }),
          },
        },
      ],
      ...(isWeb ? [
        '@babel/plugin-proposal-class-properties',
        [
          '@babel/plugin-transform-runtime',
          {
            helpers: true,
            regenerator: true,
            useESModules: false,
          },
        ],
      ] : []),
    ],
  };
};
