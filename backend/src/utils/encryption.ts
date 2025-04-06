import CryptoJS from 'crypto-js';
import logger from './logger.js';

// Default encryption key (32 characters) for development only
const DEFAULT_KEY = 'a5f3d8c1b4e2a9f7d6c3b5a2e4f8c9d6';

/**
 * Encryption utility for sensitive data
 * Uses AES encryption with a secret key from environment variables
 */
class EncryptionService {
  private secretKey: string;

  constructor() {
    // Get secret key from environment variables or use default
    const secretKey = process.env.ENCRYPTION_KEY || DEFAULT_KEY;
    
    if (secretKey.length < 32) {
      logger.warn('ENCRYPTION_KEY should be at least 32 characters, using default key');
      this.secretKey = DEFAULT_KEY;
    } else {
      this.secretKey = secretKey;
    }
    
    logger.info('Encryption service initialized');
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