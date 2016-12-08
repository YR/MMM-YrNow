'use strict';

const RE_PRINTF = /%[sd]/g;

/**
 * Substitute tokens (%s, %d) in 'str'
 * @param {String} str
 * @returns {String}
 */
function printf (str, ...args) {
  const length = args.length;
  let i = 0;

  return String(str).replace(RE_PRINTF, (token) => {
    if (i >= length) return '';
    switch (token) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      default: return token;
    }
  });
};