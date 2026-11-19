import { describe, expect, it } from "vitest";
import { generatePassword, hashPassword, verifyPassword } from "@/lib/password";

describe("password hashing", () => {
  it("хеш проверяется верным паролем", () => {
    const hash = hashPassword("correct horse battery staple");
    expect(verifyPassword("correct horse battery staple", hash)).toBe(true);
  });

  it("неверный пароль отклоняется", () => {
    const hash = hashPassword("secret-password");
    expect(verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("хеши одного пароля различаются (уникальная соль)", () => {
    const a = hashPassword("same-password");
    const b = hashPassword("same-password");
    expect(a).not.toBe(b);
    expect(verifyPassword("same-password", a)).toBe(true);
    expect(verifyPassword("same-password", b)).toBe(true);
  });

  it("формат scrypt:<salt>:<hash>", () => {
    expect(hashPassword("x").startsWith("scrypt:")).toBe(true);
  });

  it("битый хеш не падает и отклоняется", () => {
    expect(verifyPassword("x", "garbage")).toBe(false);
    expect(verifyPassword("x", "scrypt:aa:zz")).toBe(false);
  });

  it("generatePassword выдаёт пароль запрошенной длины и без повторов", () => {
    const p1 = generatePassword();
    const p2 = generatePassword();
    expect(p1).toHaveLength(20);
    expect(p1).not.toBe(p2);
  });
});
