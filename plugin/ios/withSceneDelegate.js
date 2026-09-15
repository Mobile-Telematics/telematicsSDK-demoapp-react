const fs = require('fs');
const { withDangerousMod } = require('@expo/config-plugins');
const { usesSceneDelegate, findSceneDelegatePath } = require('./sceneDetection');
const {
  ensureImport,
  insertBeforeClassClosingBrace,
  detectInheritedBaseClass,
  buildForwardMethod,
} = require('./swiftMerge');

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
        // Info.plist declares a scene manifest but there is no SceneDelegate.swift
        // to inject into. The known cause is the Expo SDK 57 scene opt-in through
        // expo-build-properties: Expo then wires up its own built-in
        // EXExpoAppSceneDelegate and generates no SceneDelegate.swift.
        //
        // Falling back to the AppDelegate-level forwards would be worse than
        // failing: iOS does not call those on a scene-based app, so tracking
        // would degrade silently with nothing to point at.
        throw new Error(
          '[react-native-telematics] This project declares UIApplicationSceneManifest in ' +
            'Info.plist, but no SceneDelegate.swift was found to add the scene lifecycle forwards to. ' +
            'The SDK needs sceneDidBecomeActive / sceneWillEnterForeground / sceneDidEnterBackground, ' +
            'and iOS does not deliver the app-level equivalents once an app is scene-based, so they ' +
            'cannot be used instead.\n\n' +
            'If you opted into the iOS scene lifecycle on Expo SDK 57 through expo-build-properties, ' +
            'Expo uses its built-in scene delegate and generates no SceneDelegate.swift. Add one next ' +
            'to AppDelegate.swift and point the scene manifest at it:\n\n' +
            '    internal import Expo\n\n' +
            '    @objc(SceneDelegate)\n' +
            '    class SceneDelegate: ExpoAppSceneDelegate {}\n\n' +
            'then set UISceneDelegateClassName to "$(PRODUCT_MODULE_NAME).SceneDelegate". ' +
            'On Expo SDK 58 and newer, expo prebuild generates SceneDelegate.swift itself and this ' +
            'plugin picks it up with no extra work. See the README section on the iOS scene ' +
            'lifecycle for the per-SDK details.'
        );
      }

      let contents = fs.readFileSync(sceneDelegatePath, 'utf8');
      contents = ensureImport(contents, 'TelematicsSDK');

      // Same detection as withAppDelegate.js: the standard Expo/RN template is
      // `class SceneDelegate: UIResponder, UIWindowSceneDelegate`, where these
      // are bare protocol requirements (plain `func`, no `super`). A project
      // whose SceneDelegate instead inherits from a named base class that
      // already implements them would need `override func` + `super`, exactly
      // like AppDelegate's ExpoAppDelegate/RCTAppDelegate case -- handle it the
      // same way even though no such base class is known to ship today.
      const baseClassInfo = detectInheritedBaseClass(contents, 'SceneDelegate');
      const inherits = Boolean(baseClassInfo && baseClassInfo.inheritsImplementations);

      const methodsToInject = [];

      if (!contents.includes(SCENE_ACTIVE_MARKER)) {
        methodsToInject.push(
          buildForwardMethod(
            inherits,
            'sceneDidBecomeActive(_ scene: UIScene)',
            'sceneDidBecomeActive(scene)',
            'sceneDidBecomeActive(scene)'
          )
        );
      }

      if (!contents.includes(SCENE_FOREGROUND_MARKER)) {
        methodsToInject.push(
          buildForwardMethod(
            inherits,
            'sceneWillEnterForeground(_ scene: UIScene)',
            'sceneWillEnterForeground(scene)',
            'sceneWillEnterForeground(scene)'
          )
        );
      }

      if (!contents.includes(SCENE_BACKGROUND_MARKER)) {
        methodsToInject.push(
          buildForwardMethod(
            inherits,
            'sceneDidEnterBackground(_ scene: UIScene)',
            'sceneDidEnterBackground(scene)',
            'sceneDidEnterBackground(scene)'
          )
        );
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
