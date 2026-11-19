import { notFound } from "next/navigation";

/**
 * Несовпавшие пути внутри языкового сегмента (/ru/anything)
 * → notFound() → рендерит app/[locale]/not-found.tsx,
 * а не дефолтную 404 Next.js.
 */
export default function CatchAllPage() {
  notFound();
}
