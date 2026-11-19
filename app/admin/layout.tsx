import type { Metadata } from "next";
import "../globals.css";

/**
 * Корневой layout админки.
 * /admin — не локализованный раздел: интерфейс на русском (правило проекта),
 * индексация запрещена (robots noindex + robots.txt disallow).
 */
export const metadata: Metadata = {
  title: { default: "Админка | DS DIGITAL", template: "%s | DS DIGITAL Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full bg-bg text-white">{children}</body>
    </html>
  );
}
