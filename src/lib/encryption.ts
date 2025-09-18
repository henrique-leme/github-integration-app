import CryptoJS from 'crypto-js';
import { envSchema } from './schemas';
import { ApiErrorHandler } from './apiUtils';

const environment = envSchema.parse(process.env);

export function encrypt(textToEncrypt: string): string {
  if (!textToEncrypt) {
    throw new ApiErrorHandler(
      'Text to encrypt cannot be empty',
      400,
      'ENCRYPTION_INPUT_EMPTY'
    );
  }

  return CryptoJS.AES.encrypt(textToEncrypt, environment.ENCRYPTION_KEY).toString();
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) {
    throw new ApiErrorHandler(
      'Encrypted text cannot be empty',
      400,
      'DECRYPTION_INPUT_EMPTY'
    );
  }

  try {
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedText, environment.ENCRYPTION_KEY);
    const decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedText) {
      throw new ApiErrorHandler(
        'Failed to decrypt data - invalid ciphertext',
        500,
        'DECRYPTION_INVALID_CIPHERTEXT'
      );
    }

    return decryptedText;
  } catch {
    throw new ApiErrorHandler(
      'Failed to decrypt data - decryption process failed',
      500,
      'DECRYPTION_PROCESS_FAILED'
    );
  }
}