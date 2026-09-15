/**
 * Minimal brace-matching helper shared by the Swift (iOS) and Groovy (Android)
 * source injectors. Skips over `//` and `/* *\/` comments and `'...'` / `"..."`
 * string literals so a `{` or `}` that appears inside one of those does not
 * throw off the depth count.
 *
 * This is intentionally not a full parser: it is good enough for the fairly
 * regular AppDelegate/SceneDelegate/build.gradle files that Expo prebuild
 * generates from its standard templates.
 *
 * @param {string} contents
 * @param {number} openIndex index of the opening `{` to start counting from
 * @returns {number} index of the matching `}`, or -1 if not found
 */
function findMatchingBrace(contents, openIndex) {
  let depth = 0;

  for (let i = openIndex; i < contents.length; i++) {
    const ch = contents[i];
    const next = contents[i + 1];

    // Skip `// ...` line comments.
    if (ch === '/' && next === '/') {
      const newlineIndex = contents.indexOf('\n', i);
      i = newlineIndex === -1 ? contents.length : newlineIndex;
      continue;
    }

    // Skip `/* ... */` block comments.
    if (ch === '/' && next === '*') {
      const endIndex = contents.indexOf('*/', i + 2);
      i = endIndex === -1 ? contents.length - 1 : endIndex + 1;
      continue;
    }

    // Skip over string literals (single or double quoted).
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      while (j < contents.length && contents[j] !== quote) {
        if (contents[j] === '\\') {
          j++;
        }
        j++;
      }
      i = j;
      continue;
    }

    if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }

  return -1;
}

module.exports = { findMatchingBrace };
