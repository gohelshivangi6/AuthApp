import api from "./apiClient";

const BASE = "/api/auth";

export function login(email, password) {
  return api.post(`${BASE}/login`, { email, password });
}

export function signup(name, email, password) {
  return api.post(`${BASE}/signup`, { name, email, password });
}

export function verify2FASetup(code, tempToken) {
  return api.post(`${BASE}/verify-2fa-setup`, { code }, {
    headers: { Authorization: `Bearer ${tempToken}` },
  });
}

export function verify2FALogin(code, tempToken) {
  return api.post(`${BASE}/verify-2fa-login`, { code }, {
    headers: { Authorization: `Bearer ${tempToken}` },
  });
}

export function forgotPassword(email) {
  return api.post(`${BASE}/forgot-password`, { email });
}

export function resetPassword(token, password) {
  return api.post(`${BASE}/reset-password`, { token, password });
}

export function logout() {
  return api.post(`${BASE}/logout`);
}

export function checkStatus() {
  return api.get(`${BASE}/me`);
}

export function updateProfile(name) {
  return api.put(`${BASE}/me`, { name });
}

export function changePassword(currentPassword, newPassword) {
  return api.put(`${BASE}/me/password`, { currentPassword, newPassword });
}

export function reactivateAccount(token, userId) {
  return api.post(`${BASE}/reactivate`, { token, userId });
}

export function getReactivateStatus(token, userId) {
  return api.get(`${BASE}/reactivate-status`, { params: { token, userId } });
}

export function ping() {
  return api.post(`${BASE}/ping`);
}

export function stayActive(token, userId) {
  return api.post(`${BASE}/stay-active`, { token, userId });
}

export function getInactivityStatus(token, userId) {
  return api.get(`${BASE}/inactivity-status`, { params: { token, userId } });
}

export function generate2FASecret() {
  return api.post(`${BASE}/2fa/generate`);
}

export function enable2FA(code, tempToken) {
  return api.post(`${BASE}/2fa/enable`, { code, tempToken });
}

export function disable2FA(password) {
  return api.post(`${BASE}/2fa/disable`, { password });
}

export function getDevEmails() {
  return api.get(`${BASE}/dev/emails`);
}
