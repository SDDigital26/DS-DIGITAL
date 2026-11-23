import { describe, expect, it } from "vitest";
import {
  fallbackTurn,
  initialState,
  persistableUserMessage,
  replayFallbackState,
} from "@/lib/ai/fallback";

describe("free consultant fallback", () => {
  it("requires consent before accepting or persisting task details", () => {
    const initial = initialState("ru");
    const taskBeforeConsent = "Нужен сайт для небольшой компании";
    const refused = fallbackTurn(initial, taskBeforeConsent);

    expect(refused.state.step).toBe("consent");
    expect(refused.state.consent).toBe(false);
    expect(refused.lead).toBeUndefined();
    expect(persistableUserMessage(initial, refused.state, taskBeforeConsent)).toBe("[input withheld until consent]");
  });

  it("creates a lead only after consent, task, service, and a valid contact", () => {
    const initial = initialState("ru");
    const consent = fallbackTurn(initial, "да");
    expect(consent.state.step).toBe("task");
    expect(consent.state.consent).toBe(true);
    expect(consent.lead).toBeUndefined();
    expect(persistableUserMessage(initial, consent.state, "да, мой email owner@example.com")).toBe("да");

    const task = fallbackTurn(consent.state, "Нужен сайт для небольшой компании");
    const service = fallbackTurn(task.state, "Разработка сайта");
    const invalidContact = fallbackTurn(service.state, "John Smith");
    expect(invalidContact.lead).toBeUndefined();
    expect(invalidContact.state.step).toBe("contact");

    const contact = fallbackTurn(service.state, "owner@example.com");
    expect(contact.state.step).toBe("done");
    expect(contact.lead).toMatchObject({ contact: "owner@example.com", service: "Разработка сайта" });
  });

  it("reconstructs consent and task state only from server-side user history", () => {
    const history = ["да", "Нужен сайт для небольшой компании", "Разработка сайта"];
    const state = replayFallbackState("ru", history);
    expect(state.step).toBe("contact");
    expect(state.consent).toBe(true);

    const notContact = fallbackTurn(state, "нет");
    expect(notContact.lead).toBeUndefined();
    expect(notContact.state.consent).toBe(true);

    const approved = fallbackTurn(state, "owner@example.com");
    expect(approved.lead).toMatchObject({ contact: "owner@example.com" });
  });

  it("does not persist contact details entered before consent", () => {
    const initial = initialState("en");
    const beforeConsent = fallbackTurn(initial, "owner@example.com");
    expect(persistableUserMessage(initial, beforeConsent.state, "owner@example.com")).toBe("[input withheld until consent]");
  });

  it("resets the dialog without creating a lead", () => {
    const result = fallbackTurn(initialState("en"), "restart");
    expect(result.state).toEqual(initialState("en"));
    expect(result.lead).toBeUndefined();
  });

  it("answers a knowledge question without advancing the task step", () => {
    const consent = fallbackTurn(initialState("ru"), "да");
    const question = fallbackTurn(consent.state, "Сколько стоит сайт?");

    expect(question.state.step).toBe("task");
    expect(question.state.task).toBe("");
    expect(question.lead).toBeUndefined();
    expect(replayFallbackState("ru", ["да", "Сколько стоит сайт?"]).step).toBe("task");
  });

  it("counts a task description with a question as the task, not as a question", () => {
    const consent = fallbackTurn(initialState("ru"), "да");
    const task = fallbackTurn(consent.state, "Нужен сайт для студии, сколько будет стоить?");

    expect(task.state.step).toBe("service");
    expect(task.state.task).toContain("сайт");
  });
});
