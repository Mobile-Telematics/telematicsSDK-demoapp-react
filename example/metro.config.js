const path = require('path');
// Build a list of regex patterns to exclude (block list)
const escape = require('escape-string-regexp');
const pak = require('../package.json');

const root = path.resolve(__dirname, '..');

const modules = Object.keys({
  ...pak.peerDependencies,
});
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Create blocklist regexes to exclude peer dependency copies from root
const blockList = modules.map(
  (m) => new RegExp(`^${escape(path.join(root, 'node_modules', m))}\\/.*$`)
);

const config = {
  projectRoot: __dirname,
  watchFolders: [root],

  // Ensure only one version is used for peerDependencies by blocking
  // versions in the repo root and resolving to example's node_modules
  resolver: {
    blockList,
    extraNodeModules: modules.reduce((acc, name) => {
      acc[name] = path.join(__dirname, 'node_modules', name);
      return acc;
    }, {}),
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'cjs', 'json'],
  },

  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(defaultConfig, config);
