import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const VERSION_BYTE = 0x01;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const ALGO = "aes-256-gcm";

export function deriveKeyFromSecret(secret: string): Buffer {
    return createHash("sha256").update(secret, "utf8").digest();
}

export function encryptBuffer(plain: Buffer, secret: string): Buffer {
    const key = deriveKeyFromSecret(secret);
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGO, key, iv);
    const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([Buffer.from([VERSION_BYTE]), iv, encrypted, tag]);
}

export function decryptBuffer(payload: Buffer, secret: string): Buffer {
    const minLen = 1 + IV_LENGTH + TAG_LENGTH;
    if (payload.length < minLen) {
        throw new Error("Payload cifrado inválido ou truncado.");
    }
    if (payload[0] !== VERSION_BYTE) {
        throw new Error("Versão de cifra não suportada.");
    }
    const key = deriveKeyFromSecret(secret);
    const iv = payload.subarray(1, 1 + IV_LENGTH);
    const tag = payload.subarray(payload.length - TAG_LENGTH);
    const ciphertext = payload.subarray(1 + IV_LENGTH, payload.length - TAG_LENGTH);
    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
