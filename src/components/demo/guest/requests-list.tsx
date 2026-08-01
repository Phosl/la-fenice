"use client";

import { useMemo, useState } from "react";

import type {
  DemoActivityRequest,
  DemoLocale,
  DemoOrder,
  DemoPortalContextValue,
} from "@/lib/demo-portal";

import type { GuestCopy } from "./copy";
import { formatGuestPrice } from "./format";
import styles from "./guest.module.css";

type RequestsListProps = {
  activityRequests: DemoActivityRequest[];
  cancelActivityRequest: DemoPortalContextValue["cancelActivityRequest"];
  cancelOrder: DemoPortalContextValue["cancelOrder"];
  copy: GuestCopy;
  locale: DemoLocale;
  orders: DemoOrder[];
};

type RequestItem =
  | { kind: "order"; request: DemoOrder }
  | { kind: "activity"; request: DemoActivityRequest };

export function RequestsList({
  activityRequests,
  cancelActivityRequest,
  cancelOrder,
  copy,
  locale,
  orders,
}: RequestsListProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelErrorId, setCancelErrorId] = useState<string | null>(null);
  const requests = useMemo<RequestItem[]>(
    () =>
      [
        ...orders.map((request) => ({ kind: "order" as const, request })),
        ...activityRequests.map((request) => ({ kind: "activity" as const, request })),
      ].sort((left, right) => right.request.createdAt.localeCompare(left.request.createdAt)),
    [activityRequests, orders],
  );

  function cancelRequest(item: RequestItem) {
    if (item.request.status !== "pending" || cancellingId) return;
    setCancellingId(item.request.id);
    setCancelErrorId(null);
    try {
      if (item.kind === "order") cancelOrder(item.request.id);
      else cancelActivityRequest(item.request.id);
    } catch {
      setCancelErrorId(item.request.id);
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <section aria-labelledby="guest-requests-title" className={styles.requestsSection}>
      <div>
        <h2 className={styles.sectionTitle} id="guest-requests-title">
          {copy.requests.title}
        </h2>
        <p className={styles.sectionLead}>{copy.requests.lead}</p>
      </div>

      {requests.length ? (
        <div className={styles.requestsList}>
          {requests.map((item) => {
            const isOrder = item.kind === "order";
            const title = isOrder
              ? item.request.lines.map((line) => line.labelSnapshot[locale]).join(", ")
              : item.request.activityLabelSnapshot[locale];
            const status = item.request.status;

            return (
              <article className={styles.requestCard} key={`${item.kind}-${item.request.id}`}>
                <header className={styles.requestCardHeader}>
                  <div>
                    <span className={styles.requestType}>
                      {isOrder ? copy.requests.order : copy.requests.activity}
                    </span>
                    <h3>{title}</h3>
                  </div>
                  <span className={styles.status} data-status={status}>
                    {copy.statuses[status]}
                  </span>
                </header>

                {isOrder ? (
                  <>
                    <p className={styles.requestMeta}>
                      {copy.locations[item.request.location]} · {copy.requests.at} {item.request.requestedTime}
                    </p>
                    <ul className={styles.requestLines}>
                      {item.request.lines.map((line) => (
                        <li key={line.id}>
                          {copy.requests.quantity} {line.quantity} · {line.labelSnapshot[locale]}
                          {line.unitPriceCents == null
                            ? ` · ${copy.order.priceOnRequest}`
                            : ` · ${formatGuestPrice(line.unitPriceCents * line.quantity, locale)}`}
                        </li>
                      ))}
                    </ul>
                    {item.request.notes ? (
                      <p className={styles.requestMeta}>“{item.request.notes}”</p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p className={styles.requestMeta}>
                      {item.request.participants} {copy.requests.participants} · {copy.requests.at}{" "}
                      {item.request.preferredTime}
                    </p>
                    {item.request.notes ? (
                      <p className={styles.requestMeta}>“{item.request.notes}”</p>
                    ) : null}
                  </>
                )}

                {item.request.staffNote ? (
                  <div className={styles.staffNote}>
                    <strong>{copy.requests.staffNote}</strong>
                    <span>{item.request.staffNote}</span>
                  </div>
                ) : null}

                {status === "pending" ? (
                  <button
                    className={styles.cancelButton}
                    disabled={cancellingId === item.request.id}
                    onClick={() => cancelRequest(item)}
                    type="button"
                  >
                    {cancellingId === item.request.id
                      ? copy.requests.cancelling
                      : copy.requests.cancel}
                  </button>
                ) : null}

                {cancelErrorId === item.request.id ? (
                  <div aria-live="assertive" className={styles.errorNotice} role="alert">
                    {copy.requests.cancelError}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <p className={styles.emptyState}>{copy.requests.empty}</p>
      )}
    </section>
  );
}
