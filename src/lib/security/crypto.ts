import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function getKey() {
  const raw = process.env.ID_ENCRYPTION_KEY;
  if (!raw) throw new Error("ID_ENCRYPTION_KEY is not set");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("ID_ENCRYPTION_KEY must be 32 bytes, base64 encoded");
  return key;
}

/** Returns "iv.tag.ciphertext" (all base64) */
export function encrypt(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64")).join(".");
}

export function decrypt(payload: string) {
  const [iv, tag, data] = payload.split(".").map((s) => Buffer.from(s, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}