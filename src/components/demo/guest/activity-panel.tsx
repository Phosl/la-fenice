"use client";

import { type FormEvent, useRef, useState } from "react";

import type {
  DemoActivityCatalogItem,
  DemoLocale,
  DemoPortalContextValue,
} from "@/lib/demo-portal";

import type { GuestCopy } from "./copy";
import { createClientRequestId, formatGuestPrice } from "./format";
import styles from "./guest.module.css";

type ActivityPanelProps = {
  activities: DemoActivityCatalogItem[];
  copy: GuestCopy;
  createActivityRequest: DemoPortalContextValue["createActivityRequest"];
  guestCount: number;
  locale: DemoLocale;
  selectedDate: string;
};

type SubmitStatus = "idle" | "success" | "error";

export function ActivityPanel({
  activities,
  copy,
  createActivityRequest,
  guestCount,
  locale,
  selectedDate,
}: ActivityPanelProps) {
  const [selectedActivityId, setSelectedActivityId] = useState(activities[0]?.id ?? "");
  const [participants, setParticipants] = useState(Math.max(1, Math.min(guestCount, 2)));
  const [preferredTime, setPreferredTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [pending, setPending] = useState(false);
  const submittingRef = useRef(false);
  const requestIdRef = useRef<string | null>(null);
  const selectedActivity =
    activities.find((activity) => activity.id === selectedActivityId) ?? activities[0];
  const effectiveParticipants = Math.max(1, Math.min(participants, guestCount));

  function markDraftChanged() {
    requestIdRef.current = null;
    setStatus("idle");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || !selectedActivity) return;

    submittingRef.current = true;
    setPending(true);
    setStatus("idle");

    try {
      requestIdRef.current ??= createClientRequestId("guest-activity");
      createActivityRequest({
        activityId: selectedActivity.id,
        clientRequestId: requestIdRef.current,
        notes,
        participants: effectiveParticipants,
        preferredTime,
        requestedDate: selectedDate,
      });
      setNotes("");
      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      submittingRef.current = false;
      setPending(false);
    }
  }

  return (
    <form className={styles.requestForm} onSubmit={handleSubmit}>
      <div className={styles.requestLayout}>
        <div>
          <h3 className={styles.panelTitle}>{copy.activity.title}</h3>
          <p className={styles.panelLead}>{copy.activity.lead}</p>

          {activities.length ? (
            <div className={styles.activityGrid}>
              {activities.map((activity) => (
                <button
                  aria-pressed={selectedActivity?.id === activity.id}
                  className={styles.activityOption}
                  key={activity.id}
                  onClick={() => {
                    setSelectedActivityId(activity.id);
                    markDraftChanged();
                  }}
                  type="button"
                >
                  <span className={styles.itemTopline}>
                    <strong>{activity.labels[locale]}</strong>
                    <span className={styles.price}>
                      {activity.priceCents == null
                        ? copy.order.priceOnRequest
                        : formatGuestPrice(activity.priceCents, locale)}
                    </span>
                  </span>
                  {activity.description?.[locale] ? <span>{activity.description[locale]}</span> : null}
                </button>
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>{copy.activity.emptyCatalog}</p>
          )}
        </div>

        <div className={styles.requestForm}>
          {selectedActivity ? (
            <div className={styles.summaryCard}>
              <span className={styles.eyebrow}>{copy.activity.selected}</span>
              <h4>{selectedActivity.labels[locale]}</h4>
            </div>
          ) : null}

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label htmlFor={`guest-activity-participants-${selectedDate}`}>
                {copy.activity.participantsLabel}
              </label>
              <input
                id={`guest-activity-participants-${selectedDate}`}
                max={guestCount}
                min={1}
                onChange={(event) => {
                  setParticipants(Number(event.target.value));
                  markDraftChanged();
                }}
                required
                type="number"
                value={effectiveParticipants}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor={`guest-activity-time-${selectedDate}`}>{copy.activity.timeLabel}</label>
              <input
                id={`guest-activity-time-${selectedDate}`}
                onChange={(event) => {
                  setPreferredTime(event.target.value);
                  markDraftChanged();
                }}
                required
                type="time"
                value={preferredTime}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor={`guest-activity-notes-${selectedDate}`}>{copy.activity.notesLabel}</label>
            <textarea
              id={`guest-activity-notes-${selectedDate}`}
              maxLength={1000}
              onChange={(event) => {
                setNotes(event.target.value);
                markDraftChanged();
              }}
              placeholder={copy.activity.notesPlaceholder}
              value={notes}
            />
          </div>

          {status === "success" ? (
            <div className={styles.successNotice} role="status">{copy.activity.success}</div>
          ) : null}
          {status === "error" ? (
            <div aria-live="assertive" className={styles.errorNotice} role="alert">
              {copy.activity.error}
            </div>
          ) : null}

          <button
            className={styles.primaryButton}
            disabled={pending || !selectedActivity || activities.length === 0}
            type="submit"
          >
            {pending ? copy.activity.submitting : copy.activity.submit}
          </button>
        </div>
      </div>
    </form>
  );
}
