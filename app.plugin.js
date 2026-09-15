// Entry point Expo looks for when a project lists "react-native-telematics"
// in app.json/app.config.js `plugins`. Plain CommonJS, no build step, so this
// file must be directly requireable from the package root.

try {
  require.resolve('@expo/config-plugins');
} catch (e) {
  throw new Error(
    '[react-native-telematics] The Expo config plugin requires "@expo/config-plugins", which was not found. ' +
      'It ships as part of the "expo" package in any Expo project, so this usually means "expo" itself is not ' +
      'installed. If it is, try reinstalling dependencies; otherwise add "@expo/config-plugins" directly.'
  );
}

module.exports = require('./plugin/index.js');
