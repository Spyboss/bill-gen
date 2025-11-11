// crypto-polyfill.cjs - CommonJS version
const crypto = require('crypto');

// Make crypto available globally
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = crypto;
}

module.exports = crypto;
