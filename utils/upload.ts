/**
 * Browser-side upload helper. POSTs the file as multipart/form-data to
 * `/api/upload?path=<key>` which (auth-checked) writes it to the `MEDIA` R2
 * bucket and returns a public URL.
 *
 * The default `/images/<key>` route in the Worker streams the file out via
 * the same bucket, so every stored object is reachable at `/images/<key>`.
 */

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

const upload = async (file: File, refPath: string): Promise<string | null> => {
  try {
    const id = `${refPath}/${makeId(12)}.${extFor(file)}`;
    const form = new FormData();
    form.append("file", file);

    const res = await fetch(`/api/upload?path=${encodeURIComponent(id)}`, {
      method: "POST",
      body: form,
      credentials: "same-origin",
    });

    if (!res.ok) return null;
    const data = (await res.json()) as { url?: string };
    return data.url ?? null;
  } catch (error) {
    console.error("upload failed", error);
    return null;
  }
};

export default upload;
