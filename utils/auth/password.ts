/**
 * Password hashing on top of Web Crypto PBKDF2.
 *
 * Why not bcrypt? `bcrypt-ts` is pure JS but pulls in `bcrypt` as a peer dep
 * in some setups. PBKDF2 with 600k iterations of HMAC-SHA-256 meets OWASP's
 * 2024 recommendation and works everywhere.
 *
 * Stored format: `pbkdf2$<iterations>$<saltHex>$<hashHex>`.
 */
const ITERATIONS = 600_000;
const KEY_BITS = 256;

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  const view = new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < view.length; i++) {
    out += view[i].toString(16).padStart(2, "0");
  }
  return out;
}

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
}

async function deriveBits(password: string, salt: Uint8Array, iterations: number): Promise<ArrayBuffer> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password) as BufferSource,
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    baseKey,
    KEY_BITS,
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await deriveBits(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toHex(salt.buffer)}$${toHex(bits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = parseInt(parts[1], 10);
  if (!Number.isFinite(iterations) || iterations < 100_000) return false;
  const salt = fromHex(parts[2]);
  const expected = fromHex(parts[3]);
  const bits = new Uint8Array(await deriveBits(password, salt, iterations));
  if (bits.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < bits.length; i++) mismatch |= bits[i] ^ expected[i];
  return mismatch === 0;
}
