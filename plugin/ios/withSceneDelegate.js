const fs = require('fs');
const { withDangerousMod } = require('@expo/config-plugins');
const { usesSceneDelegate, findSceneDelegatePath } = require('./sceneDetection');
const { ensureImport, insertBeforeClassClosingBrace } = require('./swiftMerge');

const SCENE_ACTIVE_MARKER = 'RPEntry.instance.sceneDidBecomeActive(scene)';
const SCENE_FOREGROUND_MARKER = 'RPEntry.instance.sceneWillEnterForeground(scene)';
const SCENE_BACKGROUND_MARKER = 'RPEntry.instance.sceneDidEnterBackground(scene)';

/**
 * Forwards `sceneDidBecomeActive` / `sceneWillEnterForeground` /
 * `sceneDidEnterBackground` on SceneDelegate, for scene-based projects only.
 *
 * `withAppDelegate` cannot reach SceneDelegate.swift (it is a different file,
 * and Expo config-plugins has no dedicated SceneDelegate mod), so this uses
 * `withDangerousMod` to read/write it directly. No-ops entirely on
 * non-scene-based projects -- see ./withAppDelegate.js, which injects the
 * app-level equivalents there instead. Detection is shared between the two
 * mods so exactly one of them ever adds this trio.
 */
function withTelematicsSceneDelegate(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const platformProjectRoot = config.modRequest.platformProjectRoot;

      if (!usesSceneDelegate(platformProjectRoot)) {
        return config;
      }

      const sceneDelegatePath = findSceneDelegatePath(platformProjectRoot);
      if (!sceneDelegatePath) {
        throw new Error(
          '[react-native-telematics] Detected a scene-based project (Info.plist declares ' +
            'UIApplicationSceneManifest) but could not locate a SceneDelegate.swift file under the iOS ' +
            'project directory. Add the scene lifecycle forwards manually instead (see README ' +
            '"Lifecycle handlers").'
        );
      }

      let contents = fs.readFileSync(sceneDelegatePath, 'utf8');
      contents = ensureImport(contents, 'TelematicsSDK');

      const methodsToInject = [];

      if (!contents.includes(SCENE_ACTIVE_MARKER)) {
        methodsToInject.push(`
  func sceneDidBecomeActive(_ scene: UIScene) {
    guard RPEntry.isInitialized() else { return }
    RPEntry.instance.sceneDidBecomeActive(scene)
  }
`);
      }

      if (!contents.includes(SCENE_FOREGROUND_MARKER)) {
        methodsToInject.push(`
  func sceneWillEnterForeground(_ scene: UIScene) {
    guard RPEntry.isInitialized() else { return }
    RPEntry.instance.sceneWillEnterForeground(scene)
  }
`);
      }

      if (!contents.includes(SCENE_BACKGROUND_MARKER)) {
        methodsToInject.push(`
  func sceneDidEnterBackground(_ scene: UIScene) {
    guard RPEntry.isInitialized() else { return }
    RPEntry.instance.sceneDidEnterBackground(scene)
  }
`);
      }

      if (methodsToInject.length > 0) {
        contents = insertBeforeClassClosingBrace(
          contents,
          'SceneDelegate',
          methodsToInject.join('')
        );
      }

      fs.writeFileSync(sceneDelegatePath, contents);
      return config;
    },
  ]);
}

module.exports = withTelematicsSceneDelegate;
