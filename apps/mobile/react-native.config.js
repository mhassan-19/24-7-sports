// expo-router lists these as optional peers and pnpm installs them, but the app never imports them
// (checked in the Android bundle). Leaving them out of native autolinking keeps the build smaller
// and faster. Remove an entry here before using the library.
const unused = { platforms: { android: null, ios: null } };

module.exports = {
  dependencies: {
    'react-native-gesture-handler': unused,
    'react-native-reanimated': unused,
    'react-native-worklets': unused,
  },
};
