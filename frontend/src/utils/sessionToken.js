import axios from 'axios';

const TOKEN = crypto.randomUUID();

export function getSessionToken() {
  return TOKEN;
}

axios.interceptors.request.use((config) => {
  config.headers['X-Session-Token'] = TOKEN;
  return config;
});
