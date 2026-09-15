const fs = require('fs');
const path = require('path');

// Directories that never contain the app's own source, and that either don't
// exist yet at prebuild time or would make the search slow/incorrect if walked.
const SKIP_DIRS = new Set(['Pods', 'build', 'DerivedData', '.git', 'node_modules']);

/**
 * Depth-first search for the first file named `fileName` under `rootDir`.
 * @returns {string|null}
 */
function findFile(rootDir, fileName, maxDepth = 6) {
  function walk(dir, depth) {
    if (depth > maxDepth) {
      return null;
    }

    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      return null;
    }

    // Check files at this level first so we prefer shallower matches.
    for (const entry of entries) {
      if (entry.isFile() && entry.name === fileName) {
        return path.join(dir, entry.name);
      }
    }

    for (const entry of entries) {
      if (entry.isDirectory() && !SKIP_DIRS.has(entry.name)) {
        const found = walk(path.join(dir, entry.name), depth + 1);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  return walk(rootDir, 0);
}

function findSceneDelegatePath(platformProjectRoot) {
  return findFile(platformProjectRoot, 'SceneDelegate.swift');
}

function hasSceneDelegate(platformProjectRoot) {
  return findSceneDelegatePath(platformProjectRoot) !== null;
}

/**
 * Best-effort check of Info.plist for a scene manifest, used as a fallback signal
 * alongside `hasSceneDelegate` (a project can declare UIApplicationSceneManifest
 * without shipping a file literally named SceneDelegate.swift).
 */
function infoPlistHasSceneManifest(platformProjectRoot) {
  const infoPlistPath = findFile(platformProjectRoot, 'Info.plist');
  if (!infoPlistPath) {
    return false;
  }
  try {
    const raw = fs.readFileSync(infoPlistPath, 'utf8');
    return raw.includes('UIApplicationSceneManifest');
  } catch (e) {
    return false;
  }
}

function usesSceneDelegate(platformProjectRoot) {
  return (
    hasSceneDelegate(platformProjectRoot) || infoPlistHasSceneManifest(platformProjectRoot)
  );
}

module.exports = {
  findFile,
  findSceneDelegatePath,
  hasSceneDelegate,
  infoPlistHasSceneManifest,
  usesSceneDelegate,
};
