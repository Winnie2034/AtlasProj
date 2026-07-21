import { createCipheriv, createDecipheriv, createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const scryptOptions = { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

const derivePasswordKey = (password: string, salt: Buffer) =>
  new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, scryptOptions, (error, key) => (error ? reject(error) : resolve(key)));
  });

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await derivePasswordKey(password, salt);
  return `${salt.toString("base64url")}.${hash.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [saltValue, hashValue] = storedHash.split(".");
  if (!saltValue || !hashValue) return false;

  const expected = Buffer.from(hashValue, "base64url");
  const actual = await derivePasswordKey(password, Buffer.from(saltValue, "base64url"));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export const newSessionToken = () => randomBytes(32).toString("base64url");
export const hashSessionToken = (token: string) => createHash("sha256").update(token).digest("hex");

export type EncryptedValue = { ciphertext: string; iv: string; tag: string };

export function encryptValue(value: string, key: Buffer): EncryptedValue {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return {
    ciphertext: ciphertext.toString("base64url"),
    iv: iv.toString("base64url"),
    tag: cipher.getAuthTag().toString("base64url"),
  };
}

export function decryptValue(value: EncryptedValue, key: Buffer) {
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(value.iv, "base64url"));
  decipher.setAuthTag(Buffer.from(value.tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(value.ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
