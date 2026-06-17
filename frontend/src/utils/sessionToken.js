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
  console.log("token ", payload);
})();

export function clearSessionToken() {
  TOKEN = null;
}

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
    if (err.response?.status === 401) {
      clearSessionToken();
      localStorage.removeItem("persist:root");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
