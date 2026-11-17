const ALLOWED_PREFIX = /^(images|audios)\//;

/** Reject traversal and odd characters before an object is written or served. */
export const normalizeMediaKey = (raw: string): string | null => {
  const key = raw.trim().replace(/\\/g, "/").replace(/\/+/g, "/");
  if (!key || key.length > 512) return null;
  if (key.includes("..") || key.includes("\0") || key.startsWith("/")) return null;
  if (!ALLOWED_PREFIX.test(key)) return null;
  const rest = key.slice(key.indexOf("/") + 1);
  if (!rest || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(rest)) return null;
  return key;
};
