import { Schema } from 'mongoose';
import encryptionService from './encryption.js';

/**
 * Mark fields in the schema that need to be encrypted
 * 
 * @example
 * const UserSchema = new Schema({
 *   name: String,
 *   nic: { type: String, encrypted: true },
 *   address: { type: String, encrypted: true }
 * });
 * 
 * UserSchema.plugin(encryptionPlugin);
 */
const encryptionPlugin = (schema: Schema): void => {
  // Find all fields marked as encrypted
  const encryptedFields: string[] = [];
  
  schema.eachPath((pathname, schemaType) => {
    if (schemaType.options && schemaType.options.encrypted) {
      encryptedFields.push(pathname);
    }
  });
  
  if (encryptedFields.length === 0) {
    return; // No fields to encrypt
  }
  
  // Add encryption before saving document
  schema.pre('save', function(next) {
    encryptedFields.forEach((field) => {
      const value = this.get(field);
      
      // Skip if the field is not modified or is undefined/null
      if (!this.isModified(field) || value === undefined || value === null) {
        return;
      }
      
      // Encrypt the value
      const encryptedValue = encryptionService.encrypt(value.toString());
      this.set(field, encryptedValue);
    });
    
    next();
  });
  
  // Add decryption when document is retrieved
  schema.post('find', function(docs) {
    if (!Array.isArray(docs)) return;
    
    docs.forEach((doc) => {
      encryptedFields.forEach((field) => {
        const value = doc.get(field);
        
        if (value) {
          // Decrypt the value
          try {
            const decryptedValue = encryptionService.decrypt(value);
            if (decryptedValue) {
              doc.set(field, decryptedValue, { skipEncryption: true });
            }
          } catch (error) {
            // If decryption fails, leave the value as is
            console.error(`Failed to decrypt field ${field}: ${error}`);
          }
        }
      });
    });
  });
  
  // Add decryption for findOne
  schema.post('findOne', function(doc) {
    if (!doc) return;
    
    encryptedFields.forEach((field) => {
      const value = doc.get(field);
      
      if (value) {
        // Decrypt the value
        try {
          const decryptedValue = encryptionService.decrypt(value);
          if (decryptedValue) {
            doc.set(field, decryptedValue, { skipEncryption: true });
          }
        } catch (error) {
          // If decryption fails, leave the value as is
          console.error(`Failed to decrypt field ${field}: ${error}`);
        }
      }
    });
  });
  
  // Ensure encryption when updating documents
  schema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    if (!update) {
      return next();
    }
    
    encryptedFields.forEach((field) => {
      // Type guard to handle direct field updates
      if (update && typeof update === 'object' && field in update) {
        const value = update[field as keyof typeof update];
        if (value !== undefined) {
          const encryptedValue = encryptionService.encrypt(value.toString());
          update[field as keyof typeof update] = encryptedValue;
        }
      }
      
      // Check for $set operator
      if (update && typeof update === 'object' && '$set' in update) {
        const set = update.$set as Record<string, any>;
        if (set && typeof set === 'object' && field in set) {
          const value = set[field];
          if (value !== undefined) {
            set[field] = encryptionService.encrypt(value.toString());
          }
        }
      }
    });
    
    next();
  });
};

export default encryptionPlugin; 