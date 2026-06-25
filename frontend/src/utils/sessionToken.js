import { encryptSessionPayload } from '../decrypt/decryption';

let TOKEN = null;

export async function getSessionToken() {
  if (!TOKEN) {
    const payload = {
      nonce: crypto.randomUUID(),
      time: Date.now(),
    };
    const { iv, authTag, encryptedData } = await encryptSessionPayload(payload);
    TOKEN = `${iv}:${authTag}:${encryptedData}`;
  }
  return TOKEN;
}

export function clearSessionToken() {
  TOKEN = null;
}
