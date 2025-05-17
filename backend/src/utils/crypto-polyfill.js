// crypto-polyfill.js
// This file provides a polyfill for the Node.js crypto module when using ES modules

import crypto from 'node:crypto';

// Make crypto available globally
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = crypto;
}

export default crypto;
