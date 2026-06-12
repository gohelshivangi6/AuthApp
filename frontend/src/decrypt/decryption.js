const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;

export async function getKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET_KEY),
    { name: "AES-GCM" },
    false,
    ["decrypt", "encrypt"]
  );
}

export function base64ToUint8Array(base64) {
  return Uint8Array.from(
    atob(base64),
    c => c.charCodeAt(0)
  );
}

function uint8ArrayToBase64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

export async function decryptData(response) {
  const key = await getKey();

  const iv = base64ToUint8Array(response.iv);
  const authTag = base64ToUint8Array(response.authTag);
  const encrypted = base64ToUint8Array(response.encryptedData);

  // AES-GCM expects auth tag appended to ciphertext
  const combined = new Uint8Array(
    encrypted.length + authTag.length
  );

  combined.set(encrypted);
  combined.set(authTag, encrypted.length);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv
    },
    key,
    combined
  );

  return JSON.parse(
    new TextDecoder().decode(decrypted)
  );
}

export async function encryptSessionPayload(payload) {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(payload));

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  const ct = new Uint8Array(ciphertext);
  const encryptedData = ct.slice(0, -16);
  const authTag = ct.slice(-16);

  return {
    encryptedData: uint8ArrayToBase64(encryptedData),
    iv: uint8ArrayToBase64(iv),
    authTag: uint8ArrayToBase64(authTag),
  };
}