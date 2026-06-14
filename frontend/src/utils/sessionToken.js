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

<<<<<<< HEAD
export function clearSessionToken() {
  TOKEN = null;
}

=======
>>>>>>> 4bd405fe8739ac39179a75b73d46cc98e0519ee7
axios.interceptors.request.use(async (config) => {
  await initPromise;
  if (TOKEN) {
    config.headers['X-Session-Token'] = TOKEN;
  }
  return config;
});

axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !TOKEN) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
