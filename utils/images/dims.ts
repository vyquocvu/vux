/**
 * Read intrinsic dimensions straight out of the file header — no decoder, no
 * native dependency, so the same module runs in a Worker isolate and in the
 * backfill script under Node.
 */
export interface Dimensions {
  width: number;
  height: number;
}

const MAX_DIM = 65535;

const sane = (w: unknown, h: unknown): w is number =>
  typeof w === "number" && typeof h === "number" && w > 0 && h > 0 && w <= MAX_DIM && h <= MAX_DIM;

const u32be = (b: Uint8Array, at: number): number =>
  (b[at] << 24) | (b[at + 1] << 16) | (b[at + 2] << 8) | b[at + 3];

const u32le = (b: Uint8Array, at: number): number =>
  b[at] | (b[at + 1] << 8) | (b[at + 2] << 16) | (b[at + 3] << 24);

const ascii = (b: Uint8Array, at: number, len: number): string =>
  new TextDecoder().decode(b.subarray(at, at + len));

const png = (b: Uint8Array): Dimensions | null => {
  if (b.length < 24 || ascii(b, 12, 4) !== "IHDR") return null;
  const width = u32be(b, 16);
  const height = u32be(b, 20);
  return sane(width, height) ? { width, height } : null;
};

const gif = (b: Uint8Array): Dimensions | null => {
  if (b.length < 10) return null;
  const width = b[6] | (b[7] << 8);
  const height = b[8] | (b[9] << 8);
  return sane(width, height) ? { width, height } : null;
};

/** Scan JPEG markers until a SOFn frame carries the size. */
const jpeg = (b: Uint8Array): Dimensions | null => {
  let at = 2;
  while (at + 9 < b.length) {
    if (b[at] !== 0xff) {
      at += 1;
      continue;
    }
    const marker = b[at + 1];
    // Standalone markers with no payload segment.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      at += 2;
      continue;
    }
    const size = u32be(b, at + 2) >>> 16;
    // SOF0-SOF15, skipping DHT (C4), JPEG (C8), DAC (CC).
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      const height = (b[at + 5] << 8) | b[at + 6];
      const width = (b[at + 7] << 8) | b[at + 8];
      return sane(width, height) ? { width, height } : null;
    }
    if (marker === 0xda || marker === 0xd9) break;
    at += 2 + Math.max(size, 2);
  }
  return null;
};

const webp = (b: Uint8Array): Dimensions | null => {
  if (b.length < 30 || ascii(b, 0, 4) !== "RIFF" || ascii(b, 8, 4) !== "WEBP") return null;
  const chunk = ascii(b, 12, 4);
  if (chunk === "VP8X") {
    const width = 1 + (b[24] | (b[25] << 8) | (b[26] << 16));
    const height = 1 + (b[27] | (b[28] << 8) | (b[29] << 16));
    return sane(width, height) ? { width, height } : null;
  }
  if (chunk === "VP8 ") {
    const width = (b[26] | (b[27] << 8)) & 0x3fff;
    const height = (b[28] | (b[29] << 8)) & 0x3fff;
    return sane(width, height) ? { width, height } : null;
  }
  if (chunk === "VP8L") {
    const bits = u32le(b, 21);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >> 14) & 0x3fff) + 1;
    return sane(width, height) ? { width, height } : null;
  }
  return null;
};

/**
 * AVIF/HEIF: `ispe` is a FullBox, so the size is 20 bytes and the payload sits
 * four bytes past the usual Box offset. `ispe` always lives nested under
 * `meta/iprp`, which is why we search for the box fourcc instead of walking
 * the tree.
 */
const isobmff = (b: Uint8Array): Dimensions | null => {
  const needle = [0x69, 0x73, 0x70, 0x65]; // "ispe"
  for (let at = 4; at + 16 <= b.length; at++) {
    if (b[at] !== needle[0] || b[at + 3] !== needle[3]) continue;
    if (b[at + 1] !== needle[1] || b[at + 2] !== needle[2]) continue;
    if (u32be(b, at - 4) !== 20) continue;
    const width = u32be(b, at + 8);
    const height = u32be(b, at + 12);
    if (sane(width, height)) return { width, height };
  }
  return null;
};

const svg = (text: string): Dimensions | null => {
  const vb = /viewBox\s*=\s*["'][\s,]*[\d.-]+[\s,]+[\d.-]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
  if (vb) {
    const width = Number(vb[1]);
    const height = Number(vb[2]);
    return sane(width, height) ? { width, height } : null;
  }
  const wh = /<svg[^>]*\swidth\s*=\s*["']([\d.]+)/i.exec(text);
  const hh = /<svg[^>]*\sheight\s*=\s*["']([\d.]+)/i.exec(text);
  if (wh && hh) {
    const width = Number(wh[1]);
    const height = Number(hh[1]);
    return sane(width, height) ? { width, height } : null;
  }
  return null;
};

export function readDimensions(input: ArrayBuffer | Uint8Array): Dimensions | null {
  const b = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (b.length < 12) return null;

  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return png(b);
  if (b[0] === 0xff && b[1] === 0xd8) return jpeg(b);
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP") return webp(b);
  if (ascii(b, 0, 3) === "GIF") return gif(b);
  if (b.length >= 12 && ascii(b, 4, 4) === "ftyp") return isobmff(b);

  const head = new TextDecoder().decode(b.subarray(0, Math.min(b.length, 512)));
  if (head.includes("<svg")) return svg(head);
  return null;
}
