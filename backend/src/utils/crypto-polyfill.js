// crypto-polyfill.js
// This file provides a polyfill for the Node.js crypto module when using ES modules

// Use dynamic import for Node.js crypto module
let crypto;
try {
  // Try to import as ES module
  const module = await import('node:crypto');
  crypto = module.default;
} catch (error) {
  // Fallback to require if dynamic import fails
  try {
    // @ts-ignore
    crypto = globalThis.require('crypto');
  } catch (requireError) {
    console.error('Failed to import crypto module:', requireError);
    // Create a minimal crypto object with randomBytes
    crypto = {
      randomBytes: (size) => {
        const array = new Uint8Array(size);
        for (let i = 0; i < size; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return {
          toString: (encoding) => {
            if (encoding === 'hex') {
              return Array.from(array)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            }
            return array.toString();
          }
        };
      }
    };
  }
}

// Make crypto available globally
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = crypto;
}

export default crypto;
