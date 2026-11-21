import { localizedSitemapXml } from "@/lib/sitemap";

export async function GET() {
  try {
    return new Response(await localizedSitemapXml("en"), {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch {
    return new Response("Sitemap temporarily unavailable", { status: 503 });
  }
}
