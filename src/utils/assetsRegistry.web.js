// Mock for @react-native/assets-registry/registry on web (removed from React Native 0.87).
// On web, images are bundled by webpack as URLs, never as numeric asset IDs.
export const getAssetByID = () => null;
export const registerAsset = () => 0;
