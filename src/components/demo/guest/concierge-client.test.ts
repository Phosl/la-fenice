// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";

import { endConciergeSession } from "./concierge-client";
import { conciergeCopy } from "./concierge-copy";

describe("concierge privacy copy", () => {
  it("explains the OpenAI chat and speech data flow in every language", () => {
    expect(conciergeCopy.en.privacyNote).toMatch(
      /question.*conversation history.*guide entries.*response text.*sensitive/iu,
    );
    expect(conciergeCopy.it.privacyNote).toMatch(
      /domanda.*cronologia.*schede.*testo della risposta.*dati sensibili/iu,
    );
    expect(conciergeCopy.de.privacyNote).toMatch(
      /Frage.*Gesprächsverlauf.*Guide-Einträge.*Antworttext.*sensiblen/iu,
    );
    expect(conciergeCopy.ru.privacyNote).toMatch(
      /вопрос.*история диалога.*карточки путеводителя.*текст ответа.*чувствительные/iu,
    );
  });

  it("localizes the suggestions label", () => {
    expect(Object.values(conciergeCopy).map((copy) => copy.suggestionsLabel)).toEqual([
      "Suggestions",
      "Suggerimenti",
      "Vorschläge",
      "Предложения",
    ]);
  });
});

describe("concierge session cleanup", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("observes an unsuccessful response without blocking logout", async () => {
    const readError = vi.fn().mockResolvedValue({
      code: "provider_unavailable",
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: readError,
    } as unknown as Response);
    vi.stubGlobal("fetch", fetchMock);

    await expect(endConciergeSession()).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/demo/concierge/session",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(readError).toHaveBeenCalledOnce();
  });
});
