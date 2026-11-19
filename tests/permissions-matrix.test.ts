import { describe, expect, it } from "vitest";
import { MATRIX, can, permissionsFor } from "@/lib/permissions-matrix";

const ALL_PERMISSIONS = [
  "dashboard",
  "content",
  "media",
  "seo",
  "leads",
  "leads_export",
  "settings",
  "users",
] as const;

describe("permissions матрица (ТЗ §18)", () => {
  it("OWNER имеет все права", () => {
    for (const permission of ALL_PERMISSIONS) {
      expect(can("OWNER", permission)).toBe(true);
    }
    expect(permissionsFor("OWNER")).toHaveLength(ALL_PERMISSIONS.length);
  });

  it("все роли видят дашборд", () => {
    for (const role of ["OWNER", "ADMIN", "EDITOR", "MANAGER"] as const) {
      expect(can(role, "dashboard")).toBe(true);
    }
  });

  it("MANAGER: только лиды (просмотр/комментарии/статусы/экспорт), не контент", () => {
    expect(can("MANAGER", "leads")).toBe(true);
    expect(can("MANAGER", "leads_export")).toBe(true);
    expect(can("MANAGER", "content")).toBe(false);
    expect(can("MANAGER", "media")).toBe(false);
    expect(can("MANAGER", "seo")).toBe(false);
    expect(can("MANAGER", "settings")).toBe(false);
    expect(can("MANAGER", "users")).toBe(false);
  });

  it("EDITOR: контент и медиа, без лидов/SEO/настроек", () => {
    expect(can("EDITOR", "content")).toBe(true);
    expect(can("EDITOR", "media")).toBe(true);
    expect(can("EDITOR", "seo")).toBe(false);
    expect(can("EDITOR", "leads")).toBe(false);
    expect(can("EDITOR", "leads_export")).toBe(false);
    expect(can("EDITOR", "settings")).toBe(false);
    expect(can("EDITOR", "users")).toBe(false);
  });

  it("ADMIN: всё кроме пользователей", () => {
    expect(can("ADMIN", "content")).toBe(true);
    expect(can("ADMIN", "media")).toBe(true);
    expect(can("ADMIN", "seo")).toBe(true);
    expect(can("ADMIN", "leads")).toBe(true);
    expect(can("ADMIN", "leads_export")).toBe(true);
    expect(can("ADMIN", "settings")).toBe(true);
    expect(can("ADMIN", "users")).toBe(false); // только OWNER
  });

  it("MANAGER и EDITOR не могут экспортировать/менять чужое", () => {
    expect(MATRIX.MANAGER).not.toContain("content");
    expect(MATRIX.EDITOR).not.toContain("leads");
    expect(MATRIX.EDITOR).not.toContain("leads_export");
  });
});
