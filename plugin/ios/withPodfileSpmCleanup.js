const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('@expo/config-plugins');

// Marker written by plugin 3.1.x (./withPodfileSpmAppTarget.js).
const OLD_SPM_MARKER =
  '# @react-native-telematics-sdk spm-app-target-fix (do not edit -- managed by the react-native-telematics config plugin)';
const CLEANUP_MARKER =
  '# @react-native-telematics-sdk spm-cleanup (removes the TelematicsSDK Swift package added by plugin 3.1.x)';
const TELEMATICS_SPM_URL =
  'https://github.com/Mobile-Telematics/telematicsSDK-iOS-new-SPM.git';
const POST_INSTALL_REGEX = /^([ \t]*)post_install\s+do\s*\|[^|]*\|[ \t]*$/m;

/**
 * TEMPORARY (pre-release 3.2.0, which vendors TelematicsSDK as an xcframework):
 * cleans up after plugin 3.1.x on projects prebuilt WITHOUT `--clean`.
 *
 * 3.1.x injected a Podfile `post_install` block that attached the remote
 * TelematicsSDK Swift package (7.2.0) to the app target and saved that into the
 * app's .xcodeproj. Left in place, the app ends up with two TelematicsSDK
 * frameworks (SPM 7.2.0 + vendored 7.3.0). This mod:
 *  1. removes that block from the Podfile, and
 *  2. adds a small `post_install` step that deletes the package reference and
 *     the product dependency from the app project on the next `pod install`.
 * It does nothing on fresh projects (no 3.1.x marker). Drop it, together with
 * re-enabling withPodfileSpmAppTarget, once 7.3.0 is published on SPM.
 */
function withTelematicsPodfileSpmCleanup(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile'
      );
      if (!fs.existsSync(podfilePath)) {
        return config;
      }
      const contents = fs.readFileSync(podfilePath, 'utf8');
      const updated = cleanupPodfile(contents);
      if (updated !== contents) {
        fs.writeFileSync(podfilePath, updated);
      }
      return config;
    },
  ]);
}

function cleanupPodfile(contents) {
  if (!contents.includes(OLD_SPM_MARKER)) {
    return contents;
  }
  let result = removeOldSpmBlock(contents);
  if (!result.includes(CLEANUP_MARKER)) {
    result = addCleanupStep(result);
  }
  return result;
}

function removeOldSpmBlock(contents) {
  const lines = contents.split('\n');
  const start = lines.findIndex((l) => l.trim() === OLD_SPM_MARKER);
  if (start === -1) {
    return contents;
  }
  const indent = lines[start].slice(0, lines[start].indexOf('#'));
  // The 3.1.x block ends with `<indent>  end` right after `telematics_project.save`.
  const save = lines.findIndex(
    (l, i) => i > start && l.trim() === 'telematics_project.save'
  );
  const end =
    save === -1
      ? -1
      : lines.findIndex((l, i) => i > save && l === `${indent}  end`);
  if (end === -1) {
    throw new Error(
      '[react-native-telematics] Found the 3.1.x TelematicsSDK SPM block in ios/Podfile but could not ' +
        'find where it ends. Delete it manually, or run `npx expo prebuild --clean`.'
    );
  }
  lines.splice(start, end - start + 1);
  return lines.join('\n');
}

function addCleanupStep(contents) {
  const match = POST_INSTALL_REGEX.exec(contents);
  if (!match) {
    return contents;
  }
  const i = `${match[1]}  `;
  const snippet = [
    `${i}${CLEANUP_MARKER}`,
    `${i}installer.aggregate_targets.map(&:user_project).uniq(&:path).each do |telematics_project|`,
    `${i}  telematics_changed = false`,
    `${i}  telematics_project.targets.each do |t|`,
    `${i}    next unless t.respond_to?(:package_product_dependencies)`,
    `${i}    t.package_product_dependencies.select { |d| d.product_name == 'TelematicsSDK' }.each do |d|`,
    `${i}      t.frameworks_build_phase.files.select { |f| f.product_ref == d }.each(&:remove_from_project)`,
    `${i}      d.remove_from_project`,
    `${i}      telematics_changed = true`,
    `${i}    end`,
    `${i}  end`,
    `${i}  telematics_project.root_object.package_references.select { |r|`,
    `${i}    r.respond_to?(:repositoryURL) && r.repositoryURL == '${TELEMATICS_SPM_URL}'`,
    `${i}  }.each do |r|`,
    `${i}    r.remove_from_project`,
    `${i}    telematics_changed = true`,
    `${i}  end`,
    `${i}  telematics_project.save if telematics_changed`,
    `${i}end`,
  ].join('\n');
  const at = match.index + match[0].length;
  return `${contents.slice(0, at)}\n${snippet}${contents.slice(at)}`;
}

module.exports = withTelematicsPodfileSpmCleanup;
module.exports.cleanupPodfile = cleanupPodfile;
