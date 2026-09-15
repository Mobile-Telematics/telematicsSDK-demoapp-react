const { findMatchingBrace } = require('../utils/braceMatch');

/**
 * Insert `import <moduleName>` after the last top-level `import ...` line,
 * or at the top of the file if none exists. No-op if already present.
 */
function ensureImport(contents, moduleName) {
  const importLine = `import ${moduleName}`;
  if (contents.includes(importLine)) {
    return contents;
  }

  const importRegex = /^import .+$/gm;
  let lastMatch = null;
  let match;
  while ((match = importRegex.exec(contents)) !== null) {
    lastMatch = match;
  }

  if (lastMatch) {
    const insertPos = lastMatch.index + lastMatch[0].length;
    return `${contents.slice(0, insertPos)}\n${importLine}${contents.slice(insertPos)}`;
  }

  return `${importLine}\n${contents}`;
}

/**
 * Find `methodRegex` (which must end by matching the method's opening `{`)
 * and insert `snippet` immediately after that brace.
 *
 * Throws a descriptive error, naming the file and the method that was
 * expected, if the method cannot be found -- per this plugin's "fail loudly
 * on ambiguity" contract, rather than silently producing a broken project.
 */
function insertAfterMethodOpeningBrace(contents, methodRegex, snippet, fileLabel, methodLabel) {
  const match = methodRegex.exec(contents);
  if (!match) {
    throw new Error(
      `[react-native-telematics] Could not find ${methodLabel} in ${fileLabel}. ` +
        'The Telematics SDK config plugin only supports the standard Expo/React Native Swift ' +
        'AppDelegate template. If this file was heavily customized, add the SDK lifecycle calls ' +
        'manually instead (see README "Lifecycle handlers").'
    );
  }

  const insertPos = match.index + match[0].length; // right after the opening brace
  return contents.slice(0, insertPos) + snippet + contents.slice(insertPos);
}

/**
 * Insert `snippet` immediately before the closing brace of `class <className>`.
 *
 * Throws a descriptive error if the class or its matching closing brace
 * cannot be located.
 */
function insertBeforeClassClosingBrace(contents, className, snippet) {
  const classRegex = new RegExp(`class\\s+${className}\\b[^{]*\\{`);
  const match = classRegex.exec(contents);
  if (!match) {
    throw new Error(
      `[react-native-telematics] Could not find "class ${className}" declaration. ` +
        'The Telematics SDK config plugin only supports the standard Expo/React Native Swift template. ' +
        'Add the SDK lifecycle calls manually instead (see README "Lifecycle handlers").'
    );
  }

  const openBraceIndex = match.index + match[0].length - 1;
  const closeBraceIndex = findMatchingBrace(contents, openBraceIndex);
  if (closeBraceIndex === -1) {
    throw new Error(
      `[react-native-telematics] Could not find the matching closing brace for "class ${className}". ` +
        'The file may be malformed or use an unsupported structure. Add the SDK lifecycle calls manually ' +
        'instead (see README "Lifecycle handlers").'
    );
  }

  return contents.slice(0, closeBraceIndex) + snippet + contents.slice(closeBraceIndex);
}

module.exports = {
  ensureImport,
  insertAfterMethodOpeningBrace,
  insertBeforeClassClosingBrace,
};
