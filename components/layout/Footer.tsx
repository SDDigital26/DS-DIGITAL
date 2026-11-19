import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

/** Год считается один раз на этапе сборки — нельзя менять в теле prerender-компонента (Next 16). */
const BUILD_YEAR = new Date().getFullYear();

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <footer className="border-t border-white/5 bg-bg">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-lg font-bold">
            DS<span className="text-accent"> DIGITAL</span>
          </p>
          <p className="mt-2 text-sm text-secondary">{dict.home.slogan}</p>
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-2 text-sm">
          <Link href={`/${locale}/services`} className="text-secondary hover:text-white">
            {dict.nav.services}
          </Link>
          <Link href={`/${locale}/projects`} className="text-secondary hover:text-white">
            {dict.nav.projects}
          </Link>
          <Link href={`/${locale}/calculator`} className="text-secondary hover:text-white">
            {dict.calculator.title}
          </Link>
          <Link href={`/${locale}/contact`} className="text-secondary hover:text-white">
            {dict.nav.contacts}
          </Link>
        </nav>

        <nav aria-label="Legal" className="flex flex-col gap-2 text-sm">
          <Link href={`/${locale}/privacy`} className="text-secondary hover:text-white">
            {dict.footer.privacy}
          </Link>
          <Link href={`/${locale}/terms`} className="text-secondary hover:text-white">
            {dict.footer.terms}
          </Link>
        </nav>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-secondary">
        © {BUILD_YEAR} DS DIGITAL. {dict.footer.rights}
      </div>
    </footer>
  );
}
