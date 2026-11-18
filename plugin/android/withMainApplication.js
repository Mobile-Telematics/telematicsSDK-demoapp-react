const { withMainApplication } = require('@expo/config-plugins');

const IMPORT_KOTLIN =
  'import com.reactnativetelematicssdk.TelematicsSdkInitializer';
const IMPORT_JAVA =
  'import com.reactnativetelematicssdk.TelematicsSdkInitializer;';
// Idempotency marker: the call itself, so a second prebuild skips it.
const INIT_MARKER = 'TelematicsSdkInitializer.initialize(this)';

const SUPER_ON_CREATE_REGEX = /^([ \t]*)super\.onCreate\(\)[ \t]*;?[ \t]*$/m;

/**
 * Initializes the Telematics SDK in `MainApplication.onCreate()`.
 *
 * The SDK's tracking service can be started by the system with no UI and no
 * JS running (sticky restart after the process was killed, boot, background
 * trip detection). If the SDK is only initialized from JS (`initializeSdk()`),
 * that service runs against an uninitialized SDK and can crash in
 * `SdkService.onDestroy`. `Application.onCreate()` runs on every process
 * start, before any service, which is what the native SDK expects. This is
 * the Android counterpart of the AppDelegate init done by ./ios/withAppDelegate.js.
 */
function withTelematicsMainApplication(config) {
  return withMainApplication(config, (config) => {
    const { language } = config.modResults;
    let contents = config.modResults.contents;

    if (contents.includes(INIT_MARKER)) {
      return config;
    }

    const isKotlin = language === 'kt';
    contents = ensureImport(contents, isKotlin ? IMPORT_KOTLIN : IMPORT_JAVA);

    const match = SUPER_ON_CREATE_REGEX.exec(contents);
    if (!match) {
      throw new Error(
        '[react-native-telematics] Could not find "super.onCreate()" in MainApplication to initialize ' +
          'the Telematics SDK after it. Add `TelematicsSdkInitializer.initialize(this)` to ' +
          'MainApplication.onCreate() manually (see README "Android: initialize in Application").'
      );
    }
    const indent = match[1];
    const call = isKotlin ? INIT_MARKER : `${INIT_MARKER};`;
    const insertAt = match.index + match[0].length;
    contents = `${contents.slice(0, insertAt)}\n${indent}${call}${contents.slice(insertAt)}`;

    config.modResults.contents = contents;
    return config;
  });
}

function ensureImport(contents, importLine) {
  if (contents.includes(importLine)) {
    return contents;
  }
  // Insert after the package declaration's following import block start.
  const packageMatch = /^package [^\n]+\n/m.exec(contents);
  if (!packageMatch) {
    return `${importLine}\n${contents}`;
  }
  const at = packageMatch.index + packageMatch[0].length;
  return `${contents.slice(0, at)}\n${importLine}${contents.slice(at)}`;
}

module.exports = withTelematicsMainApplication;
module.exports.INIT_MARKER = INIT_MARKER;
