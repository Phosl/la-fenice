"use client";

import { useMemo, useState } from "react";

import type {
  DemoGuideRequest,
  DemoLocale,
  DemoPortalContextValue,
} from "@/lib/demo-portal";

import { formatGuestDate } from "./format";
import type { GuideCopy } from "./guide-copy";
import styles from "./guide.module.css";

type GuideRequestsProps = {
  cancelGuideRequest: DemoPortalContextValue["cancelGuideRequest"];
  copy: GuideCopy;
  locale: DemoLocale;
  requests: DemoGuideRequest[];
};

export function GuideRequests({
  cancelGuideRequest,
  copy,
  locale,
  requests,
}: GuideRequestsProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelErrorId, setCancelErrorId] = useState<string | null>(null);
  const sortedRequests = useMemo(
    () => [...requests].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [requests],
  );

  function handleCancel(request: DemoGuideRequest) {
    if (request.status !== "pending" || cancellingId) return;
    setCancellingId(request.id);
    setCancelErrorId(null);
    try {
      cancelGuideRequest(request.id);
    } catch {
      setCancelErrorId(request.id);
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <section aria-labelledby="guide-requests-title" className={styles.requestsSection}>
      <header className={styles.sectionHeading}>
        <span className={styles.eyebrow}>{copy.requests.eyebrow}</span>
        <h2 id="guide-requests-title">{copy.requests.title}</h2>
        <p>{copy.requests.lead}</p>
      </header>

      {sortedRequests.length ? (
        <div className={styles.requestsList}>
          {sortedRequests.map((request) => (
            <article className={styles.requestCard} key={request.id}>
              <header className={styles.requestHeader}>
                <div>
                  <h3>{request.guideLabelSnapshot[locale]}</h3>
                  <p className={styles.requestMeta}>
                    {copy.requests.date}: {formatGuestDate(request.requestedDate, locale)} ·{" "}
                    {copy.requests.at} {request.preferredTime} · {request.participants}{" "}
                    {copy.requests.participants}
                  </p>
                </div>
                <span className={styles.status} data-status={request.status}>
                  {copy.statuses[request.status]}
                </span>
              </header>

              {request.notes ? (
                <p className={styles.requestNote}>
                  <strong>{copy.requests.notes}</strong>
                  <span>{request.notes}</span>
                </p>
              ) : null}

              {request.staffNote ? (
                <p className={styles.staffNote}>
                  <strong>{copy.requests.staffNote}</strong>
                  <span>{request.staffNote}</span>
                </p>
              ) : null}

              {request.status === "pending" ? (
                <button
                  className={styles.cancelButton}
                  disabled={cancellingId === request.id}
                  onClick={() => handleCancel(request)}
                  type="button"
                >
                  {cancellingId === request.id
                    ? copy.requests.cancelling
                    : copy.requests.cancel}
                </button>
              ) : null}

              {cancelErrorId === request.id ? (
                <p aria-live="assertive" className={styles.formError} role="alert">
                  {copy.requests.cancelError}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.emptyRequests}>{copy.requests.empty}</p>
      )}
    </section>
  );
}
