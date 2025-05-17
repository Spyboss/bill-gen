// jose-crypto.js
// This file provides a direct implementation for jose to use instead of relying on the crypto module

import * as crypto from 'crypto';

// Create a TextEncoder implementation if not available
if (typeof TextEncoder === 'undefined') {
  globalThis.TextEncoder = class TextEncoder {
    encode(input) {
      const buf = Buffer.from(input, 'utf8');
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    }
  };
}

// Create a TextDecoder implementation if not available
if (typeof TextDecoder === 'undefined') {
  globalThis.TextDecoder = class TextDecoder {
    decode(input) {
      return Buffer.from(input).toString('utf8');
    }
  };
}

// Create a crypto.subtle implementation if not available
if (!crypto.subtle) {
  crypto.subtle = {
    // Simple HMAC implementation using Node.js crypto
    async importKey(format, keyData, algorithm, extractable, keyUsages) {
      return { type: algorithm.name, key: keyData };
    },
    
    async sign(algorithm, key, data) {
      if (algorithm.name === 'HMAC') {
        const hmac = crypto.createHmac('sha256', Buffer.from(key.key));
        hmac.update(Buffer.from(data));
        return new Uint8Array(hmac.digest());
      }
      throw new Error(`Unsupported algorithm: ${algorithm.name}`);
    },
    
    async verify(algorithm, key, signature, data) {
      if (algorithm.name === 'HMAC') {
        const hmac = crypto.createHmac('sha256', Buffer.from(key.key));
        hmac.update(Buffer.from(data));
        const expected = hmac.digest();
        
        // Compare signatures
        if (expected.length !== signature.length) {
          return false;
        }
        
        let result = 0;
        for (let i = 0; i < expected.length; i++) {
          result |= expected[i] ^ signature[i];
        }
        
        return result === 0;
      }
      throw new Error(`Unsupported algorithm: ${algorithm.name}`);
    }
  };
}

// Ensure crypto is available globally
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = crypto;
}

export default crypto;
