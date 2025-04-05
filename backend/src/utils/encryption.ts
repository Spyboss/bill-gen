import CryptoJS from 'crypto-js';
import logger from './logger.js';

/**
 * Encryption utility for sensitive data
 * Uses AES encryption with a secret key from environment variables
 */
class EncryptionService {
  private secretKey: string;

  constructor() {
    // Get secret key from environment variables
    const secretKey = process.env.ENCRYPTION_KEY;
    
    if (!secretKey || secretKey.length < 32) {
      logger.error('ENCRYPTION_KEY must be at least 32 characters');
      throw new Error('Invalid encryption key configuration');
    }
    
    this.secretKey = secretKey;
  }

  /**
   * Encrypt a string value
   * @param value Plain text value to encrypt
   * @returns Encrypted value as a string
   */
  encrypt(value: string): string {
    if (!value) return '';
    
    try {
      return CryptoJS.AES.encrypt(value, this.secretKey).toString();
    } catch (error) {
      logger.error(`Encryption error: ${(error as Error).message}`);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt an encrypted string value
   * @param encryptedValue Encrypted value to decrypt
   * @returns Decrypted plain text
   */
  decrypt(encryptedValue: string): string {
    if (!encryptedValue) return '';
    
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedValue, this.secretKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      logger.error(`Decryption error: ${(error as Error).message}`);
      throw new Error('Failed to decrypt data');
    }
  }
}

// Export a singleton instance
const encryptionService = new EncryptionService();
export default encryptionService; 