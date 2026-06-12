import axios from 'axios';
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

export function getSessionToken() {
  return TOKEN;
}

axios.interceptors.request.use(async (config) => {
  await initPromise;
  if (TOKEN) {
    config.headers['X-Session-Token'] = TOKEN;
  }
  return config;
});
