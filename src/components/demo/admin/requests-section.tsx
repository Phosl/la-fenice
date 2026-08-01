"use client";

import { type FormEvent, useMemo, useState } from "react";
import {
  type DemoActivityRequest,
  type DemoOrder,
  type DemoRequestStatus,
  type DemoStay,
  useDemoPortal,
} from "@/lib/demo-portal";
import { formatAdminDate, formatAdminDateTime, formatPrice } from "./admin-ui";
import styles from "./admin.module.css";

const statusLabels: Record<DemoRequestStatus, string> = {
  pending: "In attesa",
  confirmed: "Confermato",
  rejected: "Rifiutato",
  fulfilled: "Completato",
  cancelled: "Annullato",
};

const nextStatuses: Record<DemoRequestStatus, DemoRequestStatus[]> = {
  pending: ["pending", "confirmed", "rejected", "cancelled"],
  confirmed: ["confirmed", "fulfilled", "cancelled"],
  rejected: ["rejected"],
  fulfilled: ["fulfilled"],
  cancelled: ["cancelled"],
};

const locationLabels = {
  room: "Camera",
  pool: "Piscina",
  beach: "Spiaggia",
} as const;

type AdminRequest =
  | { kind: "order"; data: DemoOrder; stay?: DemoStay }
  | { kind: "activity"; data: DemoActivityRequest; stay?: DemoStay };

function requestKey(request: AdminRequest) {
  return `${request.kind}:${request.data.id}`;
}

function requestDate(request: AdminRequest) {
  return request.kind === "order" ? request.data.serviceDate : request.data.requestedDate;
}

function requestTime(request: AdminRequest) {
  return request.kind === "order" ? request.data.requestedTime : request.data.preferredTime;
}

function requestTitle(request: AdminRequest) {
  if (request.kind === "activity") return request.data.activityLabelSnapshot.it;
  const firstLine = request.data.lines[0];
  if (!firstLine) return "Ordine senza articoli";
  return request.data.lines.length > 1
    ? `${firstLine.labelSnapshot.it} +${request.data.lines.length - 1}`
    : firstLine.labelSnapshot.it;
}

export function RequestsSection() {
  const { state, updateRequest } = useDemoPortal();
  const [kindFilter, setKindFilter] = useState<"all" | AdminRequest["kind"]>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | DemoRequestStatus>("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const requests = useMemo<AdminRequest[]>(() => {
    if (!state) return [];
    const stays = new Map(state.stays.map((stay) => [stay.id, stay]));
    return [
      ...state.orders.map((data) => ({ kind: "order" as const, data, stay: stays.get(data.stayId) })),
      ...state.activityRequests.map((data) => ({ kind: "activity" as const, data, stay: stays.get(data.stayId) })),
    ]
      .filter((request) => kindFilter === "all" || request.kind === kindFilter)
      .filter((request) => statusFilter === "all" || request.data.status === statusFilter)
      .sort((a, b) => b.data.createdAt.localeCompare(a.data.createdAt));
  }, [kindFilter, state, statusFilter]);

  const selected = requests.find((request) => requestKey(request) === selectedKey) ?? requests[0];

  return (
    <section aria-labelledby="requests-title" className={styles.panel}>
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.headingWithMeta}>
            <h2 className={styles.sectionHeading} id="requests-title">Richieste</h2>
            <span className={styles.sectionMeta}>
              {requests.length} {requests.length === 1 ? "risultato" : "risultati"}
            </span>
          </div>
          <p className={styles.sectionIntro}>Ordini ed esperienze, in un’unica coda.</p>
        </div>
      </div>

      <div aria-label="Filtri richieste" className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label htmlFor="request-kind-filter">Tipo</label>
          <select
            className={styles.filterSelect}
            id="request-kind-filter"
            onChange={(event) => {
              setKindFilter(event.target.value as typeof kindFilter);
              setSelectedKey(null);
            }}
            value={kindFilter}
          >
            <option value="all">Tutte</option>
            <option value="order">Ordini</option>
            <option value="activity">Attività</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="request-status-filter">Stato</label>
          <select
            className={styles.filterSelect}
            id="request-status-filter"
            onChange={(event) => {
              setStatusFilter(event.target.value as typeof statusFilter);
              setSelectedKey(null);
            }}
            value={statusFilter}
          >
            <option value="all">Tutti</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {requests.length ? (
        <div className={styles.sectionLayout}>
          <div className={styles.listPane}>
            <ul className={styles.list}>
              {requests.map((request) => {
                const key = requestKey(request);
                return (
                  <li key={key}>
                    <button
                      aria-pressed={key === requestKey(selected)}
                      className={styles.listCard}
                      onClick={() => setSelectedKey(key)}
                      type="button"
                    >
                      <span className={styles.cardTopline}>
                        <span className={styles.requestKind}>
                          {request.kind === "order" ? "Ordine" : "Attività"}
                        </span>
                        <span className={styles.statusBadge} data-status={request.data.status}>
                          {statusLabels[request.data.status]}
                        </span>
                      </span>
                      <strong className={styles.cardTitle}>{requestTitle(request)}</strong>
                      <span className={styles.cardMeta}>
                        {request.stay?.guestName ?? "Soggiorno non disponibile"} · {formatAdminDate(requestDate(request))}, {requestTime(request)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <RequestDetail key={requestKey(selected)} request={selected} updateRequest={updateRequest} />
        </div>
      ) : (
        <div className={styles.emptyState}>
          <strong>Nessuna richiesta</strong>
          <p>Prova a cambiare i filtri o invia una richiesta dall’area ospite.</p>
        </div>
      )}
    </section>
  );
}

type RequestDetailProps = {
  request: AdminRequest;
  updateRequest: ReturnType<typeof useDemoPortal>["updateRequest"];
};

function RequestDetail({ request, updateRequest }: RequestDetailProps) {
  const [status, setStatus] = useState(request.data.status);
  const [staffNote, setStaffNote] = useState(request.data.staffNote);
  const [notice, setNotice] = useState<"saved" | "error" | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      updateRequest({ kind: request.kind, id: request.data.id, status, staffNote });
      setNotice("saved");
    } catch {
      setNotice("error");
    }
  }

  return (
    <article className={styles.detailPanel}>
      <div className={styles.detailTopline}>
        <span className={styles.requestKind}>{request.kind === "order" ? "Ordine" : "Attività"}</span>
        <span className={styles.statusBadge} data-status={request.data.status}>
          {statusLabels[request.data.status]}
        </span>
      </div>
      <div>
        <h3 className={styles.detailHeading}>{requestTitle(request)}</h3>
        <p className={styles.muted}>Ricevuta {formatAdminDateTime(request.data.createdAt)}</p>
      </div>
      <div className={styles.summaryGrid}>
        <Detail label="Ospite" value={request.stay?.guestName ?? "—"} />
        <Detail label="Camera" value={request.stay?.room ?? "—"} />
        <Detail label="Giorno" value={formatAdminDate(requestDate(request))} />
        <Detail label="Orario" value={requestTime(request)} />
        {request.kind === "order" ? (
          <Detail label="Luogo" value={locationLabels[request.data.location]} />
        ) : (
          <Detail label="Partecipanti" value={String(request.data.participants)} />
        )}
      </div>

      {request.kind === "order" ? (
        <ul className={styles.lineItems}>
          {request.data.lines.map((line) => (
            <li className={styles.lineItem} key={line.id}>
              <span><strong>{line.quantity}×</strong> {line.labelSnapshot.it}</span>
              <span className={styles.price}>
                {formatPrice(
                  line.unitPriceCents === undefined
                    ? undefined
                    : line.unitPriceCents * line.quantity,
                )}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {request.data.notes ? (
        <div className={styles.inlineNotice}><strong>Nota ospite:</strong> {request.data.notes}</div>
      ) : null}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor={`request-status-${request.data.id}`}>Stato richiesta</label>
          <select
            id={`request-status-${request.data.id}`}
            onChange={(event) => setStatus(event.target.value as DemoRequestStatus)}
            value={status}
          >
            {nextStatuses[request.data.status].map((value) => (
              <option key={value} value={value}>{statusLabels[value]}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor={`staff-note-${request.data.id}`}>Nota dello staff</label>
          <textarea
            id={`staff-note-${request.data.id}`}
            maxLength={1000}
            onChange={(event) => setStaffNote(event.target.value)}
            placeholder="Dettagli della conferma o motivo del rifiuto"
            value={staffNote}
          />
        </div>
        {notice === "saved" ? <div className={styles.successNotice} role="status">Richiesta aggiornata.</div> : null}
        {notice === "error" ? <div className={styles.errorNotice} role="alert">Transizione non disponibile. Ricarica il dettaglio e riprova.</div> : null}
        <button className={styles.buttonPrimary} type="submit">Salva aggiornamento</button>
      </form>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <span className={styles.summaryItem}>
      <span className={styles.summaryLabel}>{label}</span>
      <span className={styles.summaryValue}>{value}</span>
    </span>
  );
}

export { statusLabels };
