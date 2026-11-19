import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/admin/LoginForm";

// Динамический раздел: данные из cookies/БД (Next 16 cacheComponents)
export const instant = false;

export const metadata = { title: "Вход" };

export default async function AdminLoginPage() {
  // Уже вошли — сразу в панель
  const user = await getCurrentUser();
  if (user) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="flex w-full flex-col items-center gap-8">
        <div className="text-center">
          <p className="text-xl font-bold">
            DS<span className="text-accent"> DIGITAL</span>
          </p>
          <h1 className="mt-6 text-2xl font-semibold">Вход в админку</h1>
          <p className="mt-2 text-sm text-secondary">
            Доступ только для сотрудников студии
          </p>
        </div>

        <LoginForm />

        <Link href="/" className="text-sm text-secondary hover:text-white">
          ← На сайт
        </Link>
      </div>
    </main>
  );
}
