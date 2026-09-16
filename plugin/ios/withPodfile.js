const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('@expo/config-plugins');

const PROPERTIES_KEY = 'ios.useFrameworks';
const REQUIRED_LINKAGE = 'dynamic';

const USE_FRAMEWORKS_DYNAMIC_REGEX = /use_frameworks!\s*\(?\s*:linkage\s*=>\s*:dynamic\s*\)?/;
// An unconditional `use_frameworks!` call: not one guarded by a trailing `if ...`
// (modern Expo Podfile templates emit exactly that pattern, driven by
// Podfile.properties.json, which is not a real conflicting directive).
const UNCONDITIONAL_USE_FRAMEWORKS_REGEX = /^\s*use_frameworks!(?!.*\bif\b).*$/m;
const PLATFORM_LINE_REGEX = /^platform\s+:ios.*$/m;

/**
 * Ensures the generated Podfile ends up with dynamic linkage
 * (`use_frameworks! :linkage => :dynamic`). TelematicsSDK is a dynamic
 * framework pulled in via SPM (`spm_dependency` in the podspec); without
 * dynamic linkage the app can end up linking against it without embedding
 * it, which crashes at launch (dyld) rather than failing the build -- see
 * README "iOS dependency manager notes (CocoaPods + Swift Package Manager)".
 *
 * Modern Expo prebuild templates don't hard-code `use_frameworks!` in the
 * Podfile; they call it conditionally based on `Podfile.properties.json`
 * (the same mechanism the `expo-build-properties` plugin's `ios.useFrameworks`
 * option drives). When the generated Podfile uses that pattern, this sets the
 * property instead of touching the Podfile text -- it's the non-destructive,
 * template-friendly way to do it, and cannot conflict with edits from other
 * plugins. Falls back to editing the Podfile text directly for
 * Podfiles that don't use that mechanism.
 *
 * Never overrides an existing, different linkage setting -- that would
 * silently change the rest of the integrator's dependency graph, so this
 * throws instead and asks them to reconcile it by hand.
 */
function withTelematicsPodfile(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const platformProjectRoot = config.modRequest.platformProjectRoot;
      const podfilePath = path.join(platformProjectRoot, 'Podfile');
      const podfileContents = fs.readFileSync(podfilePath, 'utf8');

      if (podfileContents.includes(`podfile_properties['${PROPERTIES_KEY}']`)) {
        ensureViaPodfileProperties(platformProjectRoot);
      } else {
        ensureViaPodfileText(podfilePath, podfileContents);
      }

      return config;
    },
  ]);
}

function ensureViaPodfileProperties(platformProjectRoot) {
  const propertiesPath = path.join(platformProjectRoot, 'Podfile.properties.json');

  let properties = {};
  if (fs.existsSync(propertiesPath)) {
    try {
      properties = JSON.parse(fs.readFileSync(propertiesPath, 'utf8'));
    } catch (e) {
      throw new Error(
        `[react-native-telematics] Could not parse ${propertiesPath} as JSON: ${e.message}. Fix or remove ` +
          'it and re-run prebuild.'
      );
    }
  }

  const current = properties[PROPERTIES_KEY];
  if (current === REQUIRED_LINKAGE) {
    return; // Already set correctly (e.g. by a previous prebuild run) -- idempotent no-op.
  }

  if (current) {
    throw new Error(
      `[react-native-telematics] ${propertiesPath} sets "${PROPERTIES_KEY}": "${current}", but TelematicsSDK ` +
        `is a dynamic framework pulled in via Swift Package Manager and requires "${REQUIRED_LINKAGE}". Remove ` +
        'the conflicting setting (for example from an expo-build-properties config) or set it to "dynamic" ' +
        '(see README "iOS dependency manager notes").'
    );
  }

  properties[PROPERTIES_KEY] = REQUIRED_LINKAGE;
  fs.writeFileSync(propertiesPath, `${JSON.stringify(properties, null, 2)}\n`);
}

function ensureViaPodfileText(podfilePath, contents) {
  if (USE_FRAMEWORKS_DYNAMIC_REGEX.test(contents)) {
    return; // Already present -- idempotent no-op.
  }

  if (UNCONDITIONAL_USE_FRAMEWORKS_REGEX.test(contents)) {
    throw new Error(
      `[react-native-telematics] Found an existing "use_frameworks!" directive in ${podfilePath} that is not ` +
        '":linkage => :dynamic". TelematicsSDK is a dynamic framework pulled in via Swift Package Manager and ' +
        'requires `use_frameworks! :linkage => :dynamic`. Update the Podfile manually to avoid conflicting with ' +
        'your existing configuration (see README "iOS dependency manager notes").'
    );
  }

  const platformLineMatch = PLATFORM_LINE_REGEX.exec(contents);
  const insertion = 'use_frameworks! :linkage => :dynamic\n';
  const updated = platformLineMatch
    ? `${contents.slice(0, platformLineMatch.index + platformLineMatch[0].length)}\n${insertion}${contents.slice(platformLineMatch.index + platformLineMatch[0].length)}`
    : insertion + contents;

  fs.writeFileSync(podfilePath, updated);
}

module.exports = withTelematicsPodfile;
