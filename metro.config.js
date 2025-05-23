const { getDefaultConfig } = require('expo/metro-config');

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);
  return {
    ...config,
    transformer: {
      ...config.transformer,
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
    resolver: {
      ...config.resolver,
      sourceExts: [...config.resolver.sourceExts, 'ts', 'tsx'],
      assetExts: [...config.resolver.assetExts, 'png', 'jpg', 'jpeg', 'svg'],
    },
  };
})();