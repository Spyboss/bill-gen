// jose-crypto.js
// Provide Node's built-in WebCrypto to jose without custom polyfills.

import * as nodeCrypto from 'node:crypto';

const webcrypto = nodeCrypto.webcrypto;

// Expose WebCrypto globally for libraries that expect globalThis.crypto
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = webcrypto;
}

export default webcrypto;
