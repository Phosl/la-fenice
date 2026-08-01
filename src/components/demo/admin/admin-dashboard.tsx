"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDemoPortal } from "@/lib/demo-portal";
import { AdminModal, ConfirmModal } from "./admin-ui";
import { CatalogSection } from "./catalog-section";
import { RequestsSection } from "./requests-section";
import { StaysSection } from "./stays-section";
import styles from "./admin.module.css";

type AdminTab = "requests" | "stays" | "catalog";

const tabs: Array<{ id: AdminTab; label: string }> = [
  { id: "requests", label: "Richieste" },
  { id: "stays", label: "Soggiorni" },
  { id: "catalog", label: "Catalogo" },
];

export function AdminDashboard() {
  const router = useRouter();
  const { logout, ready, resetDemo, session, state, today } = useDemoPortal();
  const [tab, setTab] = useState<AdminTab>("requests");
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (ready && session?.role !== "admin") {
      router.replace("/demo/admin/login");
    }
  }, [ready, router, session]);

  if (!ready || !state || session?.role !== "admin") {
    return (
      <div aria-live="polite" className={styles.loadingState}>
        <span aria-hidden="true" className={styles.spinner} />
        <span>Caricamento del pannello…</span>
      </div>
    );
  }

  const pendingRequests = [
    ...state.orders.filter((order) => order.status === "pending"),
    ...state.activityRequests.filter((request) => request.status === "pending"),
  ].length;
  const todayOrders = state.orders.filter((order) => order.serviceDate === today).length;
  const activeStays = state.stays.filter((stay) => stay.active).length;
  const activeCatalog = state.catalog.filter((item) => item.active).length;

  async function handleReset() {
    if (resetting) return;
    setResetting(true);
    await resetDemo();
    router.replace("/demo/admin/login");
  }

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, activeTab: AdminTab) {
    const currentIndex = tabs.findIndex((item) => item.id === activeTab);
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextTab = tabs[nextIndex].id;
    setTab(nextTab);
    requestAnimationFrame(() => document.getElementById(`admin-tab-${nextTab}`)?.focus());
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.dashboardHeader}>
        <div>
          <span className="eyebrow">La Fenice · Demo staff</span>
          <h1 className={styles.dashboardTitle}>Gestione ospiti</h1>
        </div>
        <div className={styles.dashboardActions}>
          <button className={styles.buttonGhost} onClick={() => setShowInfo(true)} type="button">
            Come funziona
          </button>
          <button className={styles.buttonDanger} onClick={() => setShowReset(true)} type="button">
            Ripristina demo
          </button>
          <button
            className={styles.button}
            onClick={() => {
              logout();
              router.replace("/demo/admin/login");
            }}
            type="button"
          >
            Esci
          </button>
        </div>
      </header>

      <div aria-label="Riepilogo" className={styles.statsGrid}>
        <Stat label="Da gestire" value={pendingRequests} />
        <Stat label="Ordini di oggi" value={todayOrders} />
        <Stat label="Soggiorni attivi" value={activeStays} />
        <Stat label="Voci disponibili" value={activeCatalog} />
      </div>

      <div aria-label="Sezioni amministrazione" className={styles.tabs} role="tablist">
        {tabs.map((item) => (
          <button
            aria-controls={`admin-panel-${item.id}`}
            aria-selected={tab === item.id}
            className={styles.tabButton}
            id={`admin-tab-${item.id}`}
            key={item.id}
            onClick={() => setTab(item.id)}
            onKeyDown={(event) => handleTabKeyDown(event, item.id)}
            role="tab"
            tabIndex={tab === item.id ? 0 : -1}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div
        aria-labelledby={`admin-tab-${tab}`}
        id={`admin-panel-${tab}`}
        role="tabpanel"
        tabIndex={0}
      >
        {tab === "requests" ? <RequestsSection /> : null}
        {tab === "stays" ? <StaysSection /> : null}
        {tab === "catalog" ? <CatalogSection /> : null}
      </div>

      {showReset ? (
        <ConfirmModal
          confirmLabel={resetting ? "Ripristino…" : "Ripristina tutti i dati"}
          description="Soggiorni, richieste e modifiche al catalogo saranno sostituiti dai dati iniziali. L’operazione non è annullabile."
          onCancel={() => {
            if (!resetting) setShowReset(false);
          }}
          onConfirm={() => void handleReset()}
          pending={resetting}
          title="Ripristinare la demo?"
        />
      ) : null}

      {showInfo ? (
        <AdminModal onClose={() => setShowInfo(false)} title="Una demo locale e sicura">
          <div className={styles.form}>
            <p className={styles.loginCopy}>
              Questo pannello simula il flusso operativo senza database: tutto viene salvato nel
              browser corrente e sincronizzato tra le sue schede.
            </p>
            <div className={styles.inlineNotice}>
              Gli accessi sono dimostrativi. Nessuna password o richiesta viene inviata online.
            </div>
            <button className={styles.buttonPrimary} onClick={() => setShowInfo(false)} type="button">
              Ho capito
            </button>
          </div>
        </AdminModal>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statValue}>{String(value).padStart(2, "0")}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}
