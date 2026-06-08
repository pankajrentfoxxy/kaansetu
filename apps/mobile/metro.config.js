const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Stub out native-only modules when bundling for web
const WEB_STUBS = [
  'expo-camera',
  'expo-location',
  'expo-document-picker',
  'expo-image-picker',
  'expo-secure-store',
];

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && WEB_STUBS.some((m) => moduleName === m || moduleName.startsWith(m + '/'))) {
    return { type: 'empty' };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
