import { ImageResponse } from "next/og";

/**
 * Дефолтная OG-картинка (1200×630) для всех страниц локали.
 * Генерируется на билде (next/og), отдельные страницы могут
 * переопределить её через /admin/seo (поле ogImage).
 */

export const alt = "DS DIGITAL — BUILD. AUTOMATE. SCALE.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #05070d 0%, #0a1020 55%, #101a3a 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "linear-gradient(135deg, #176BFF, #8B5CFF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            D
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: 2 }}>DS DIGITAL</div>
            <div style={{ fontSize: 20, color: "#9fb0cf" }}>Digital Development Studio</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            borderLeft: "6px solid #176BFF",
            paddingLeft: 28,
          }}
        >
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: 1 }}>
            BUILD. AUTOMATE. SCALE.
          </div>
          <div style={{ fontSize: 30, color: "#c3cfe6" }}>
            Сайты · Веб-приложения · CRM · AI-решения · Автоматизация
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 24, color: "#9fb0cf" }}>
            Проекты, услуги и цены — на сайте · заявка за 1 минуту
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#ffffff",
              background: "linear-gradient(135deg, #176BFF, #8B5CFF)",
              padding: "12px 28px",
              borderRadius: 14,
            }}
          >
            Обсудить проект
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
