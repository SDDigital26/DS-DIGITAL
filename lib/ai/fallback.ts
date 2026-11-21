import type { Locale } from "@/lib/i18n/config";

/**
 * Бесплатный детерминированный сценарий без внешней LLM/API.
 * Явное согласие запрашивается до сохранения любого пользовательского ввода.
 */
export type ConsultStep = "consent" | "task" | "service" | "contact" | "done";

export type ConsultState = {
  step: ConsultStep;
  locale: Locale;
  task: string;
  service: string;
  name: string;
  contact: string;
  consent: boolean;
};

export type FallbackTurn = {
  reply: string;
  state: ConsultState;
  lead?: { description: string; service: string; name: string; contact: string };
};

const SERVICES_HINT: Record<Locale, string[]> = {
  ru: ["Сайт", "Веб-приложение", "CRM", "AI-решение", "Автоматизация", "Telegram-бот", "API-интеграция"],
  en: ["Website", "Web application", "CRM", "AI solution", "Automation", "Telegram bot", "API integration"],
};

const TEXT = {
  ru: {
    consentAsk: "Перед началом нужно согласие: описание задачи и контакт, если вы их предоставите, будут обработаны для подготовки заявки и передачи менеджеру DS DIGITAL. Напишите «да», чтобы продолжить. До согласия введённый текст не сохраняется.",
    needConsent: "Без согласия я не буду сохранять введённый текст. Если согласны, напишите «да».",
    taskQuestion: "Спасибо. Какую задачу нужно решить? Опишите её, пожалуйста, одним предложением или подробнее.",
    serviceQuestion: "Какое направление ближе всего?",
    serviceList: "Варианты:",
    contactQuestion: "Как с вами связаться — Telegram, телефон или email?",
    done: "Готово: заявка передана в CRM. Менеджер свяжется с вами по указанному контакту.",
    needMore: "Опишите задачу чуть подробнее (хотя бы одно предложение).",
    restarted: "Начнём заново.",
  },
  en: {
    consentAsk: "Before we begin, please consent: your task description and any contact details you provide will be processed to prepare your request and share it with a DS DIGITAL manager. Type “yes” to continue. Text entered before consent is not stored.",
    needConsent: "I will not store your input without consent. Type “yes” if you agree.",
    taskQuestion: "Thank you. What task do you need to solve? Please describe it in one sentence or more.",
    serviceQuestion: "Which direction is closest?",
    serviceList: "Options:",
    contactQuestion: "How can we reach you — Telegram, phone or email?",
    done: "Done: the request is in the CRM. A manager will contact you using the details you provided.",
    needMore: "Please describe the task in a bit more detail (at least one sentence).",
    restarted: "Restarting.",
  },
} as const;

export function initialState(locale: Locale): ConsultState {
  return { step: "consent", locale, task: "", service: "", name: "", contact: "", consent: false };
}

function looksLikeContact(value: string): boolean {
  const v = value.trim();
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return true;
  if (/^[+\d][\d\s()\-]{6,}$/.test(v)) return true;
  const telegram = v.replace(/^https?:\/\/(t\.me|telegram\.me)\//i, "");
  return /^@?[A-Za-z0-9_]{4,32}$/.test(telegram);
}

function isYes(value: string): boolean {
  return /^(да|yes|ок|ok|конечно|sure|agree|согласен|согласна)(?:[\s!,.?]|$)/i.test(value.trim());
}

function isRestart(value: string): boolean {
  return /^(заново|reset|start over|restart|начать заново)$/i.test(value.trim());
}

/** Для шага до согласия хранит только нормализованный yes, reset или нейтральный маркер. */
export function persistableUserMessage(state: ConsultState, next: ConsultState, message: string): string {
  if (state.consent || state.step !== "consent") return message;
  if (next.consent) return state.locale === "ru" ? "да" : "yes";
  if (isRestart(message)) return "restart";
  return "[input withheld until consent]";
}

export function fallbackTurn(state: ConsultState, message: string): FallbackTurn {
  const t = TEXT[state.locale];
  const text = message.trim();
  const next: ConsultState = { ...state };

  if (isRestart(text)) {
    return { reply: `${t.restarted} ${t.consentAsk}`, state: initialState(state.locale) };
  }

  if (next.step === "consent") {
    if (!isYes(text)) return { reply: t.needConsent, state: next };
    next.consent = true;
    next.step = "task";
    return { reply: t.taskQuestion, state: next };
  }

  if (next.step === "task") {
    if (text.length < 10) return { reply: t.needMore, state: next };
    next.task = text;
    next.step = "service";
    return { reply: `${t.serviceQuestion} ${t.serviceList} ${SERVICES_HINT[state.locale].join(", ")}.`, state: next };
  }

  if (next.step === "service") {
    next.service = text.slice(0, 80);
    next.step = "contact";
    return { reply: t.contactQuestion, state: next };
  }

  if (next.step === "contact") {
    if (!looksLikeContact(text)) return { reply: t.contactQuestion, state: next };
    next.contact = text.slice(0, 120);
    next.step = "done";
    return {
      reply: t.done,
      state: next,
      lead: { description: next.task, service: next.service, name: next.name, contact: next.contact },
    };
  }

  return { reply: t.done, state: next };
}

/** Восстанавливает состояние только по серверной истории сообщений пользователя. */
export function replayFallbackState(locale: Locale, userMessages: string[]): ConsultState {
  return userMessages.reduce((state, message) => fallbackTurn(state, message).state, initialState(locale));
}
