const { withAppDelegate } = require('@expo/config-plugins');
const { usesSceneDelegate } = require('./sceneDetection');
const {
  ensureImport,
  insertAfterMethodOpeningBrace,
  insertBeforeClassClosingBrace,
} = require('./swiftMerge');

// Idempotency markers. Each is the exact string this plugin injects for that
// piece, so a second `expo prebuild` run can detect it already ran and skip.
const INIT_MARKER = 'RPEntry.initializeSDK()';
const HANDLE_BG_SESSION_MARKER =
  'RPEntry.instance.application(application, handleEventsForBackgroundURLSession:';
const MEMORY_WARNING_MARKER = 'RPEntry.instance.applicationDidReceiveMemoryWarning(application)';
const WILL_TERMINATE_MARKER = 'RPEntry.instance.applicationWillTerminate(application)';
const PERFORM_FETCH_MARKER = 'RPEntry.instance.application(application) {';
const APP_LEVEL_BACKGROUND_MARKER = 'RPEntry.instance.applicationDidEnterBackground(application)';
const APP_LEVEL_FOREGROUND_MARKER = 'RPEntry.instance.applicationWillEnterForeground(application)';
const APP_LEVEL_ACTIVE_MARKER = 'RPEntry.instance.applicationDidBecomeActive(application)';

// Matches `func application(_ application: UIApplication, didFinishLaunchingWithOptions ...) -> Bool {`
// across the single- or multi-line signatures Expo/RN templates use, ending on
// the method's opening brace so the caller can insert right after it.
const DID_FINISH_LAUNCHING_REGEX =
  /func\s+application\s*\(\s*_\s*application\s*:\s*UIApplication\s*,\s*didFinishLaunchingWithOptions[\s\S]*?\)\s*(?:->\s*Bool\s*)?\{/;

/**
 * Adds `import TelematicsSDK`, initializes the SDK in
 * `application(_:didFinishLaunchingWithOptions:)`, and forwards the
 * AppDelegate-level lifecycle methods (background URL session, memory
 * warning, will-terminate, background fetch).
 *
 * Also adds `applicationDidBecomeActive` / `applicationWillEnterForeground` /
 * `applicationDidEnterBackground` here, but ONLY when the project has no
 * SceneDelegate -- those three are not called by iOS on scene-based apps, so
 * on a scene-based project they belong on SceneDelegate instead (see
 * ./withSceneDelegate.js). The two mods share the same detection logic so
 * exactly one of them injects that trio, never both.
 */
function withTelematicsAppDelegate(config) {
  return withAppDelegate(config, (config) => {
    if (config.modResults.language !== 'swift') {
      throw new Error(
        '[react-native-telematics] Expected a Swift AppDelegate (config.modResults.language === "swift"), ' +
          `but found "${config.modResults.language}". This config plugin only supports the Swift AppDelegate ` +
          'template used by modern Expo/React Native projects. If your project uses an Objective-C AppDelegate, ' +
          'integrate the Telematics SDK manually instead (see README "Lifecycle handlers").'
      );
    }

    let contents = config.modResults.contents;
    const platformProjectRoot = config.modRequest.platformProjectRoot;
    const sceneBased = usesSceneDelegate(platformProjectRoot);

    contents = ensureImport(contents, 'TelematicsSDK');

    if (!contents.includes(INIT_MARKER)) {
      const initSnippet =
        '\n    // react-native-telematics: initialize SDK\n' +
        '    RPEntry.initializeSDK()\n' +
        '    RPEntry.instance.application(application, didFinishLaunchingWithOptions: launchOptions)\n';
      contents = insertAfterMethodOpeningBrace(
        contents,
        DID_FINISH_LAUNCHING_REGEX,
        initSnippet,
        'AppDelegate.swift',
        'application(_:didFinishLaunchingWithOptions:)'
      );
    }

    const methodsToInject = [];

    if (!contents.includes(HANDLE_BG_SESSION_MARKER)) {
      methodsToInject.push(`
  func application(_ application: UIApplication, handleEventsForBackgroundURLSession identifier: String, completionHandler: @escaping () -> Void) {
    guard RPEntry.isInitialized() else { return }
    RPEntry.instance.application(application, handleEventsForBackgroundURLSession: identifier, completionHandler: completionHandler)
  }
`);
    }

    if (!contents.includes(MEMORY_WARNING_MARKER)) {
      methodsToInject.push(`
  func applicationDidReceiveMemoryWarning(_ application: UIApplication) {
    guard RPEntry.isInitialized() else { return }
    RPEntry.instance.applicationDidReceiveMemoryWarning(application)
  }
`);
    }

    if (!contents.includes(WILL_TERMINATE_MARKER)) {
      methodsToInject.push(`
  func applicationWillTerminate(_ application: UIApplication) {
    guard RPEntry.isInitialized() else { return }
    RPEntry.instance.applicationWillTerminate(application)
  }
`);
    }

    if (!contents.includes(PERFORM_FETCH_MARKER)) {
      methodsToInject.push(`
  func application(_ application: UIApplication, performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    guard RPEntry.isInitialized() else { return }
    RPEntry.instance.application(application) {
      completionHandler(.newData)
    }
  }
`);
    }

    // Scene-based apps get these three on SceneDelegate instead (see withSceneDelegate.js);
    // iOS never calls the app-level equivalents when a scene delegate is present.
    if (!sceneBased) {
      if (!contents.includes(APP_LEVEL_BACKGROUND_MARKER)) {
        methodsToInject.push(`
  func applicationDidEnterBackground(_ application: UIApplication) {
    guard RPEntry.isInitialized() else { return }
    RPEntry.instance.applicationDidEnterBackground(application)
  }
`);
      }

      if (!contents.includes(APP_LEVEL_FOREGROUND_MARKER)) {
        methodsToInject.push(`
  func applicationWillEnterForeground(_ application: UIApplication) {
    guard RPEntry.isInitialized() else { return }
    RPEntry.instance.applicationWillEnterForeground(application)
  }
`);
      }

      if (!contents.includes(APP_LEVEL_ACTIVE_MARKER)) {
        methodsToInject.push(`
  func applicationDidBecomeActive(_ application: UIApplication) {
    guard RPEntry.isInitialized() else { return }
    RPEntry.instance.applicationDidBecomeActive(application)
  }
`);
      }
    }

    if (methodsToInject.length > 0) {
      contents = insertBeforeClassClosingBrace(contents, 'AppDelegate', methodsToInject.join(''));
    }

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withTelematicsAppDelegate;
