"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CONCIERGE_MAX_HISTORY,
  CONCIERGE_MAX_MESSAGE_LENGTH,
  type ConciergeApiErrorCode,
  type ConciergeCategory,
  type ConciergeGuideItem,
  type ConciergeLocale,
  type ConciergeSessionStatus,
  type ConciergeVoice,
} from "@/lib/concierge/contract";
import type { DemoGuideCatalogItem } from "@/lib/demo-portal";

import {
  ConciergeClientError,
  getConciergeSessionStatus,
  requestConciergeSpeech,
  sendConciergeMessage,
} from "./concierge-client";
import { conciergeCopy } from "./concierge-copy";
import styles from "./concierge.module.css";
import {
  CONCIERGE_STORED_MESSAGE_LIMIT,
  clearConciergeConversation,
  createConciergeConversation,
  loadConciergeConversation,
  saveConciergeConversation,
  type ConciergeConversation,
  type ConciergeStoredMessage,
} from "./concierge-storage";
import {
  guestDemoCopy,
  guestDemoLocales,
  isGuestDemoLocale,
} from "./copy";
import { guideCopy } from "./guide-copy";

interface VirtualConciergeProps {
  stayId: string;
  defaultLocale: ConciergeLocale;
  category: ConciergeCategory;
  guideItems: DemoGuideCatalogItem[];
  onRequest: (item: DemoGuideCatalogItem) => void;
}

type AudioState = { id: string; status: "loading" | "playing" } | null;

function guideDto(
  items: readonly DemoGuideCatalogItem[],
  locale: ConciergeLocale,
): ConciergeGuideItem[] {
  return items.slice(0, 40).map((item) => ({
    id: item.id,
    category: item.category,
    label: item.labels[locale],
    description: item.description?.[locale],
    address: item.address,
    bookingNote: item.bookingNote?.[locale],
    requestable: item.requestable,
  }));
}

function clientErrorCode(error: unknown): ConciergeApiErrorCode {
  return error instanceof ConciergeClientError
    ? error.code
    : "provider_unavailable";
}

function createMessage(
  input: Omit<ConciergeStoredMessage, "createdAt">,
): ConciergeStoredMessage {
  return { ...input, createdAt: new Date().toISOString() };
}

export function VirtualConcierge({
  stayId,
  defaultLocale,
  category,
  guideItems,
  onRequest,
}: VirtualConciergeProps) {
  const [conversation, setConversation] = useState<ConciergeConversation>(() =>
    createConciergeConversation(stayId, defaultLocale),
  );
  const [storageReady, setStorageReady] = useState(false);
  const [sessionStatus, setSessionStatus] =
    useState<ConciergeSessionStatus | null>(null);
  const [input, setInput] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<ConciergeApiErrorCode | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatAbortRef = useRef<AbortController | null>(null);
  const audioAbortRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const locale = conversation.locale;
  const copy = conciergeCopy[locale];
  const isReady = Boolean(
    sessionStatus?.configured && sessionStatus.authenticated,
  );

  const activeItems = useMemo(
    () => guideItems.filter((item) => item.active),
    [guideItems],
  );
  const itemsById = useMemo(
    () => new Map(activeItems.map((item) => [item.id, item])),
    [activeItems],
  );
  const latestSuggestions = useMemo(() => {
    const assistant = [...conversation.messages]
      .reverse()
      .find(
        (message) =>
          message.role === "assistant" && message.locale === locale,
      );
    return assistant?.suggestedPrompts.length
      ? assistant.suggestedPrompts
      : copy.quickPrompts;
  }, [conversation.messages, copy.quickPrompts, locale]);

  const stopAudio = useCallback(() => {
    audioAbortRef.current?.abort();
    audioAbortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setAudioState(null);
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setConversation(loadConciergeConversation(stayId, defaultLocale));
      setStorageReady(true);
    });
    return () => {
      active = false;
    };
  }, [defaultLocale, stayId]);

  useEffect(() => {
    if (storageReady) saveConciergeConversation(conversation);
  }, [conversation, storageReady]);

  useEffect(() => {
    let active = true;
    void getConciergeSessionStatus()
      .then((status) => {
        if (!active) return;
        setSessionStatus(status);
        if (!status.configured) setErrorCode("not_configured");
        else if (!status.authenticated) setErrorCode("not_authenticated");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setSessionStatus({ authenticated: false, configured: false });
        setErrorCode(clientErrorCode(error));
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [conversation.messages.length, pendingQuestion]);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && audioState) stopAudio();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [audioState, stopAudio]);

  useEffect(
    () => () => {
      chatAbortRef.current?.abort();
      audioAbortRef.current?.abort();
      if (audioRef.current) audioRef.current.pause();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    },
    [],
  );

  async function submitQuestion(question: string) {
    const message = question.trim();
    if (!message || pendingQuestion || !isReady) return;

    stopAudio();
    setInput("");
    setErrorCode(null);
    setPendingQuestion(message);
    const controller = new AbortController();
    chatAbortRef.current = controller;

    try {
      const response = await sendConciergeMessage(
        {
          locale,
          message,
          category,
          history: conversation.messages
            .slice(-CONCIERGE_MAX_HISTORY)
            .map(({ role, content }) => ({ role, content })),
          guide: guideDto(activeItems, locale),
        },
        controller.signal,
      );

      const userMessage = createMessage({
        id: globalThis.crypto.randomUUID(),
        role: "user",
        content: message,
        locale,
        recommendationIds: [],
        suggestedPrompts: [],
      });
      const assistantMessage = createMessage({
        id: response.messageId,
        role: "assistant",
        content: response.answer,
        locale,
        recommendationIds: response.recommendationIds,
        suggestedPrompts: response.suggestedPrompts,
        speechToken: response.speechToken,
      });
      setConversation((current) => ({
        ...current,
        messages: [...current.messages, userMessage, assistantMessage].slice(
          -CONCIERGE_STORED_MESSAGE_LIMIT,
        ),
      }));
    } catch (error) {
      if (controller.signal.aborted) return;
      setInput(message);
      setErrorCode(clientErrorCode(error));
    } finally {
      if (chatAbortRef.current === controller) chatAbortRef.current = null;
      setPendingQuestion(null);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitQuestion(input);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitQuestion(input);
    }
  }

  function changeLocale(nextLocale: ConciergeLocale) {
    stopAudio();
    setErrorCode(null);
    setConversation((current) => ({ ...current, locale: nextLocale }));
  }

  function changeVoice(voice: ConciergeVoice) {
    stopAudio();
    setConversation((current) => ({ ...current, voice }));
  }

  function startNewConversation() {
    if (!confirmClear && conversation.messages.length) {
      setConfirmClear(true);
      window.setTimeout(() => setConfirmClear(false), 4_000);
      return;
    }
    stopAudio();
    setConversation(
      clearConciergeConversation(stayId, locale, conversation.voice),
    );
    setConfirmClear(false);
    setErrorCode(isReady ? null : errorCode);
  }

  async function playMessage(message: ConciergeStoredMessage) {
    if (audioState?.id === message.id) {
      stopAudio();
      return;
    }
    if (!message.speechToken) {
      setErrorCode("invalid_speech_token");
      return;
    }

    stopAudio();
    setErrorCode(null);
    const controller = new AbortController();
    audioAbortRef.current = controller;
    setAudioState({ id: message.id, status: "loading" });
    try {
      const blob = await requestConciergeSpeech(
        {
          locale: message.locale,
          voice: conversation.voice,
          messageId: message.id,
          text: message.content,
          speechToken: message.speechToken,
        },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audioUrlRef.current = url;
      audio.addEventListener("ended", stopAudio, { once: true });
      audio.addEventListener(
        "error",
        () => {
          stopAudio();
          setErrorCode("provider_unavailable");
        },
        { once: true },
      );
      await audio.play();
      setAudioState({ id: message.id, status: "playing" });
    } catch (error) {
      if (controller.signal.aborted) return;
      stopAudio();
      setErrorCode(clientErrorCode(error));
    }
  }

  return (
    <section
      aria-labelledby="virtual-concierge-title"
      className={styles.concierge}
      lang={locale}
    >
      <div className={styles.intro}>
        <span className={styles.mark} aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M5 17.5c3.5-1 5.1-3.4 5.2-7.3 2.8 1 5 3.4 5.6 6.5" />
            <path d="M8.4 7.1c2.4-.2 4.1.6 5.3 2.5 1.6-.2 3 .2 4.3 1.2" />
            <path d="M6.1 19.7c4.2-1.4 8.1-1.2 11.8.5" />
          </svg>
        </span>
        <span className={styles.eyebrow}>{copy.eyebrow}</span>
        <h2 id="virtual-concierge-title">{copy.title}</h2>
        <p className={styles.lead}>{copy.lead}</p>

        <div className={styles.settings}>
          <div className={styles.setting}>
            <label htmlFor="concierge-language">{copy.languageLabel}</label>
            <select
              id="concierge-language"
              onChange={(event) => {
                if (isGuestDemoLocale(event.target.value)) {
                  changeLocale(event.target.value);
                }
              }}
              value={locale}
            >
              {guestDemoLocales.map((optionLocale) => (
                <option key={optionLocale} value={optionLocale}>
                  {guestDemoCopy[optionLocale].languageName}
                </option>
              ))}
            </select>
          </div>

          <fieldset className={styles.setting}>
            <legend>{copy.voiceLegend}</legend>
            <div className={styles.voiceChoice}>
              {(["female", "male"] as const).map((voice) => (
                <button
                  aria-pressed={conversation.voice === voice}
                  key={voice}
                  onClick={() => changeVoice(voice)}
                  type="button"
                >
                  {copy.voices[voice]}
                </button>
              ))}
            </div>
          </fieldset>

          <p className={styles.aiDisclosure}>{copy.aiDisclosure}</p>
          <p className={styles.privacyNote}>{copy.privacyNote}</p>
        </div>
      </div>

      <div className={styles.chat}>
        <header className={styles.chatHeader}>
          <div>
            <strong>{copy.chatTitle}</strong>
            <span
              className={styles.availability}
              data-ready={isReady ? "true" : "false"}
            >
              {sessionStatus === null
                ? copy.checking
                : isReady
                  ? copy.ready
                  : copy.unavailable}
            </span>
          </div>
          <button
            className={styles.newConversation}
            disabled={Boolean(pendingQuestion)}
            onClick={startNewConversation}
            type="button"
          >
            {confirmClear ? copy.confirmNewConversation : copy.newConversation}
          </button>
        </header>

        <div
          aria-label={copy.chatTitle}
          aria-live="polite"
          aria-relevant="additions"
          className={styles.messages}
          role="log"
        >
          <div className={styles.welcome}>
            <div className={styles.messageBubble}>
              <span className={styles.messageMeta}>{copy.assistantName}</span>
              <p>{copy.welcome}</p>
            </div>
          </div>

          {conversation.messages.map((message) => {
            const recommendations = message.recommendationIds
              .map((id) => itemsById.get(id))
              .filter((item): item is DemoGuideCatalogItem => Boolean(item));
            return (
              <article
                className={styles.message}
                data-role={message.role}
                key={message.id}
                lang={message.locale}
              >
                <div className={styles.messageBubble}>
                  <span className={styles.messageMeta}>
                    {message.role === "assistant" ? copy.assistantName : copy.guestName}
                  </span>
                  <p>{message.content}</p>
                </div>

                {message.role === "assistant" && message.speechToken ? (
                  <div className={styles.messageActions}>
                    <button
                      aria-label={`${audioState?.id === message.id ? copy.stop : copy.listen}: ${message.content.slice(0, 70)}`}
                      disabled={Boolean(audioState && audioState.id !== message.id)}
                      onClick={() => void playMessage(message)}
                      type="button"
                    >
                      {audioState?.id === message.id ? copy.stop : copy.listen}
                    </button>
                  </div>
                ) : null}

                {recommendations.length ? (
                  <div className={styles.recommendations}>
                    {recommendations.map((item) => (
                      <aside className={styles.recommendation} key={item.id}>
                        <strong>{item.labels[locale]}</strong>
                        <span>
                          {guideCopy[locale].filters.categories[item.category]}
                        </span>
                        <div className={styles.recommendationActions}>
                          {item.websiteUrl ? (
                            <a href={item.websiteUrl} rel="noreferrer" target="_blank">
                              {copy.officialSite} ↗
                            </a>
                          ) : null}
                          {item.mapsUrl ? (
                            <a href={item.mapsUrl} rel="noreferrer" target="_blank">
                              {copy.maps} ↗
                            </a>
                          ) : null}
                          {item.requestable ? (
                            <button onClick={() => onRequest(item)} type="button">
                              {copy.request}
                            </button>
                          ) : null}
                        </div>
                      </aside>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}

          {pendingQuestion ? (
            <>
              <article className={styles.message} data-role="user" lang={locale}>
                <div className={styles.messageBubble}>
                  <span className={styles.messageMeta}>{copy.guestName}</span>
                  <p>{pendingQuestion}</p>
                </div>
              </article>
              <div className={styles.thinking} role="status">
                {copy.sending}
              </div>
            </>
          ) : null}
          <div ref={messagesEndRef} />
        </div>

        <div aria-label={copy.suggestionsLabel} className={styles.quickPrompts}>
          {latestSuggestions.map((prompt) => (
            <button
              disabled={!isReady || Boolean(pendingQuestion)}
              key={prompt}
              onClick={() => void submitQuestion(prompt)}
              type="button"
            >
              {prompt}
            </button>
          ))}
        </div>

        <form className={styles.composer} onSubmit={handleSubmit}>
          <label htmlFor="concierge-question">{copy.inputLabel}</label>
          <textarea
            disabled={!isReady || Boolean(pendingQuestion)}
            id="concierge-question"
            maxLength={CONCIERGE_MAX_MESSAGE_LENGTH}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={copy.inputPlaceholder}
            rows={2}
            value={input}
          />
          <button
            disabled={!isReady || Boolean(pendingQuestion) || !input.trim()}
            type="submit"
          >
            {pendingQuestion ? copy.sending : copy.send}
          </button>
          {errorCode ? (
            <p className={styles.error} role="alert">
              {copy.errors[errorCode]}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
