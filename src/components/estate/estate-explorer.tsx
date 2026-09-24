"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import estatePoster from "../../../public/models/estate-context-poster.webp";
import type { EstateCopy } from "@/lib/content/types";
import type { createEstateScene } from "./estate-scene";
import styles from "./estate.module.css";

export function EstateExplorer({ copy }: { copy: EstateCopy }) {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [selected, setSelected] = useState(-1);
  const selectedRef = useRef(-1);
  const host = useRef<HTMLDivElement>(null);
  const openButton = useRef<HTMLButtonElement>(null);
  const scene = useRef<Awaited<ReturnType<typeof createEstateScene>> | null>(null);

  useEffect(() => {
    if (!active || !host.current) return;
    const element = host.current;
    const abort = new AbortController();
    function fail() {
      if (abort.signal.aborted) return;
      setStatus("error");
      setActive(false);
      openButton.current?.focus();
    }
    const timeout = window.setTimeout(() => { fail(); abort.abort(); }, 20_000);
    import("./estate-scene")
      .then(({ createEstateScene }) => createEstateScene(element, abort.signal, fail))
      .then((controller) => {
        clearTimeout(timeout);
        if (abort.signal.aborted) { controller.dispose(); return; }
        scene.current = controller;
        controller.view(selectedRef.current);
        setStatus("ready");
      })
      .catch(fail);
    return () => {
      clearTimeout(timeout);
      abort.abort();
      scene.current?.dispose();
      scene.current = null;
    };
  }, [active]);

  function select(index: number) {
    selectedRef.current = index;
    setSelected(index);
    scene.current?.view(index);
  }

  return (
    <div className={styles.explorer}>
      <div className={styles.stage} data-status={status}>
        <Image alt={copy.posterAlt} className={styles.poster} fill sizes="(max-width: 820px) 100vw, 70vw" src={estatePoster} />
        <div aria-hidden="true" className={styles.canvas} data-ready={status === "ready"} ref={host} />
        <span className={styles.badge}>3D · La Fenice</span>
        <div className={styles.activation}>
          <button
            className={styles.open}
            onClick={() => {
              if (active) { setActive(false); setStatus("idle"); }
              else { setStatus("loading"); setActive(true); }
            }}
            ref={openButton}
            type="button"
          >
            <span aria-hidden="true">{active ? "−" : "+"}</span>
            {active ? copy.close : copy.open}
          </button>
        </div>
        <p aria-live="polite" className={styles.status}>
          {status === "loading" ? copy.loading : status === "error" ? copy.error : ""}
        </p>
        {status === "ready" ? (
          <div aria-label={copy.help} className={styles.controls} role="group">
            <button aria-label={copy.rotateLeft} onClick={() => scene.current?.rotate(1)} type="button">↶</button>
            <button aria-label={copy.rotateRight} onClick={() => scene.current?.rotate(-1)} type="button">↷</button>
            <button aria-label={copy.zoomOut} onClick={() => scene.current?.zoom(-1)} type="button">−</button>
            <button aria-label={copy.zoomIn} onClick={() => scene.current?.zoom(1)} type="button">+</button>
          </div>
        ) : null}
      </div>
      <div className={styles.sidebar}>
        <button aria-pressed={selected === -1} className={styles.overview} onClick={() => select(-1)} type="button">{copy.reset} <span aria-hidden="true">↗</span></button>
        <ol className={styles.stops}>
          {copy.stops.map((stop, index) => (
            <li key={stop.title}>
              <button aria-pressed={selected === index} onClick={() => select(index)} type="button">
                <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
                <span>{stop.title}</span>
              </button>
            </li>
          ))}
        </ol>
        <p aria-live="polite" className={styles.detail}>
          {selected < 0 ? copy.lead : copy.stops[selected].text}
        </p>
        <p className={styles.help}>{copy.help}</p>
      </div>
    </div>
  );
}
