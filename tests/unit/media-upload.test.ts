import { describe, expect, it } from "vitest";
import { extensionForMime, isAllowedImage, objectKey } from "@/lib/media-upload";

describe("media upload validation", () => {
  it("allows real image mimes", () => {
    expect(isAllowedImage({ type: "image/webp", name: "shot.webp" })).toBe(true);
    expect(isAllowedImage({ type: "image/png", name: "screen.png" })).toBe(true);
  });

  it("rejects scripts and double extensions", () => {
    expect(isAllowedImage({ type: "application/x-php", name: "x.php" })).toBe(false);
    expect(isAllowedImage({ type: "image/jpeg", name: "x.php.jpg" })).toBe(false);
    expect(isAllowedImage({ type: "image/svg+xml", name: "x.svg" })).toBe(false);
  });

  it("maps mime to extension and builds a safe key", () => {
    expect(extensionForMime("image/jpeg")).toBe("jpg");
    const key = objectKey("image/webp", "abc123", new Date("2026-11-23T00:00:00Z"));
    expect(key).toBe("uploads/2026/11/abc123.webp");
  });
});
