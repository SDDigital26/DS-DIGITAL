/** Валидация загружаемых изображений (ТЗ R7): только изображения, без исполняемых расширений. */

export const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function isAllowedImage(file: { type: string; name?: string }): boolean {
  const mime = file.type.toLowerCase().split(";")[0].trim();
  if (!ALLOWED_IMAGE_MIMES.has(mime)) return false;
  const name = (file.name ?? "").toLowerCase();
  // Отвергаем двойные расширения вида "photo.php.jpg".
  return !/\.(php|phtml|js|mjs|cjs|exe|sh|bat|cmd|svg|html?|xhtml|jsp|asp|aspx)(\.|$)/i.test(name);
}

export function extensionForMime(mime: string): string | null {
  return MIME_TO_EXT[mime.toLowerCase().split(";")[0].trim()] ?? null;
}

/** Ключ объекта: uploads/YYYY/MM/<random>.<ext> */
export function objectKey(mime: string, random: string, now = new Date()): string | null {
  const ext = extensionForMime(mime);
  if (!ext) return null;
  const month = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return `uploads/${month}/${random}.${ext}`;
}
