// Expo detects the pnpm monorepo (hoisted node_modules) and watches the workspace packages.
const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
