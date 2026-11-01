/**
 * Browser-side upload helper. Images are re-encoded to WebP and capped at
 * `MAX_EDGE` before they leave the tab, then POSTed as multipart/form-data to
 * `/api/upload?path=<key>`, which (auth-checked) writes to the `MEDIA` R2
 * bucket and returns a public URL plus the stored object's dimensions.
 *
 * The default `/images/<key>` route in the Worker streams the file out via the
 * same bucket, so every stored object is reachable at `/images/<key>`.
 */

export interface UploadResult {
  url: string;
  key: string;
  width: number | null;
  height: number | null;
}

const MAX_EDGE = 1600;
const WEBP_QUALITY = 0.82;

const makeId = (length: number): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  const arr = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) out += chars[arr[i] % chars.length];
  return out.toLowerCase();
};

const extFor = (file: File): string => {
  const [_, ext] = file.name.split(".");
  if (ext) return ext.toLowerCase();
  const [mime] = file.type.split("/");
  return mime || "bin";
};

// Animated GIFs and vector SVGs do not survive a canvas round-trip.
const NOT_TRANSCODEABLE = /^(image\/svg\+xml|image\/gif)$/;

/** Downscale + WebP-encode an image, or hand back the original when the
 *  browser cannot decode it or the re-encode would not have helped. */
async function prepareImage(file: File): Promise<{ file: File; width: number; height: number }> {
  if (NOT_TRANSCODEABLE.test(file.type)) return { file, width: 0, height: 0 };

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return { file, width: 0, height: 0 };
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
    );
    if (!blob || blob.size >= file.size) return { file, width: 0, height: 0 };

    return { file: new File([blob], "image.webp", { type: "image/webp" }), width, height };
  } catch {
    return { file, width: 0, height: 0 };
  } finally {
    bitmap.close();
  }
}

const upload = async (file: File, refPath: string): Promise<UploadResult | null> => {
  try {
    const isImage = refPath === "images";
    const prepared = isImage ? await prepareImage(file) : { file, width: 0, height: 0 };
    const ext = prepared.file === file ? extFor(file) : "webp";
    const id = `${refPath}/${makeId(12)}.${ext}`;

    const form = new FormData();
    form.append("file", prepared.file);

    const res = await fetch(`/api/upload?path=${encodeURIComponent(id)}`, {
      method: "POST",
      body: form,
      credentials: "same-origin",
    });

    if (!res.ok) return null;
    const data = (await res.json()) as Partial<UploadResult>;
    if (!data.url) return null;
    return {
      url: data.url,
      key: data.key ?? id,
      width: data.width ?? (prepared.width || null),
      height: data.height ?? (prepared.height || null),
    };
  } catch (error) {
    console.error("upload failed", error);
    return null;
  }
};

export default upload;
