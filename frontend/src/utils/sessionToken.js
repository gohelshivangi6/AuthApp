import { encryptSessionPayload } from '../decrypt/decryption';

let TOKEN = null;
const initPromise = (async () => {
  const payload = {
    nonce: crypto.randomUUID(),
    time: Date.now(),
  };
  const { iv, authTag, encryptedData } = await encryptSessionPayload(payload);
  TOKEN = `${iv}:${authTag}:${encryptedData}`;
})();

export async function getSessionToken() {
  await initPromise;
  return TOKEN;
}

export function clearSessionToken() {
  TOKEN = null;
}
