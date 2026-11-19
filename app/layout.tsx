import type { ReactNode } from "react";

/**
 * Корневой layout — только передаёт children.
 * <html>/<body> рендерятся в app/[locale]/layout.tsx, где известен язык (ТЗ §15).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
