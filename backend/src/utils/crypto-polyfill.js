// crypto-polyfill.js
// Expose Node's crypto module without insecure fallbacks.

import * as crypto from 'node:crypto';

if (typeof globalThis.crypto === 'undefined') {
  // Optionally expose WebCrypto if needed by libraries
  globalThis.crypto = crypto.webcrypto ?? globalThis.crypto;
}

export default crypto;
