import { requirePagePermission } from "@/lib/permissions";
import { getSiteSettings } from "@/lib/site-settings";
import { SiteSettingsForm } from "@/components/admin/SiteSettingsForm";
import { AiProviderForm } from "@/components/admin/AiProviderForm";
import { TelegramBotForm } from "@/components/admin/TelegramBotForm";

export const metadata = { title: "Настройки сайта" };

/** /admin/settings — контакты, эффекты, AI, тексты согласия, noindex (ТЗ §17). */
export default async function AdminSettingsPage() {
  await requirePagePermission("settings");
  const settings = await getSiteSettings();

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Настройки сайта</h1>
        <p className="mt-1 text-sm text-secondary">
          Здесь меняются контакты, режим эффектов, AI-консультант, текст согласия и индексация. Изменения
          применяются на сайте без деплоя.
        </p>
      </header>

      <SiteSettingsForm initial={settings} />
      <AiProviderForm />
      <TelegramBotForm />
    </div>
  );
}
