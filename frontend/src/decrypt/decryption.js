const SECRET_KEY = "12345678901234567890123456789012";

export async function getKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET_KEY),
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
}

export function base64ToUint8Array(base64) {
  return Uint8Array.from(
    atob(base64),
    c => c.charCodeAt(0)
  );
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

// async function getKey() {
//   return crypto.subtle.importKey(
//     "raw",
//     new TextEncoder().encode(SECRET_KEY),
//     { name: "AES-GCM" },
//     false,
//     ["decrypt"]
//   );
// }

// function base64ToUint8Array(base64) {
//   return Uint8Array.from(
//     atob(base64),
//     c => c.charCodeAt(0)
//   );
// }

// export async function decryptData(response) {
//   const key = await getKey();

//   const decrypted = await crypto.subtle.decrypt(
//     {
//       name: "AES-GCM",
//       iv: base64ToUint8Array(response.iv),
//     },
//     key,
//     base64ToUint8Array(response.encryptedData)
//   );

//   return JSON.parse(
//     new TextDecoder().decode(decrypted)
//   );
// }