import { notFound } from "next/navigation";

// Catch-all должен доходить до notFound() во время запроса, а не prerender.
export const instant = false;

/**
 * Несовпавшие пути внутри языкового сегмента (/ru/anything)
 * → notFound() → рендерит app/[locale]/not-found.tsx,
 * а не дефолтную 404 Next.js.
 */
export default function CatchAllPage() {
  notFound();
}
