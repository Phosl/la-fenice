"use client";

import { type FormEvent, useMemo, useRef, useState } from "react";

import type {
  DemoDeliveryLocation,
  DemoLocale,
  DemoPortalContextValue,
  DemoProductCatalogItem,
} from "@/lib/demo-portal";

import type { GuestCopy, GuestShopCategory } from "./copy";
import { createClientRequestId, formatGuestPrice } from "./format";
import styles from "./guest.module.css";

type ShopPanelProps = {
  copy: GuestCopy;
  createOrder: DemoPortalContextValue["createOrder"];
  locale: DemoLocale;
  products: DemoProductCatalogItem[];
  selectedDate: string;
};

type SubmitStatus = "idle" | "success" | "error";

const shopCategories: readonly GuestShopCategory[] = [
  "all",
  "food",
  "classic-drink",
  "wine",
  "champagne",
  "raw-fish",
];

export function ShopPanel({
  copy,
  createOrder,
  locale,
  products,
  selectedDate,
}: ShopPanelProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [location, setLocation] = useState<DemoDeliveryLocation>("room");
  const [requestedTime, setRequestedTime] = useState("12:30");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState<GuestShopCategory>("all");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [pending, setPending] = useState(false);
  const submittingRef = useRef(false);
  const requestIdRef = useRef<string | null>(null);

  const selectedProducts = useMemo(
    () => products.filter((product) => (quantities[product.id] ?? 0) > 0),
    [products, quantities],
  );
  const visibleProducts = useMemo(
    () =>
      category === "all"
        ? products
        : products.filter((product) => product.category === category),
    [category, products],
  );
  const selectedUnits = selectedProducts.reduce(
    (sum, product) => sum + (quantities[product.id] ?? 0),
    0,
  );
  const pricedTotal = selectedProducts.reduce(
    (sum, product) => sum + (product.priceCents ?? 0) * (quantities[product.id] ?? 0),
    0,
  );
  const hasPriceOnRequest = selectedProducts.some((product) => product.priceCents == null);

  function changeQuantity(productId: string, delta: number) {
    setStatus("idle");
    requestIdRef.current = null;
    setQuantities((current) => {
      const nextQuantity = Math.max(0, Math.min(20, (current[productId] ?? 0) + delta));
      if (nextQuantity === 0) {
        const { [productId]: _removed, ...rest } = current;
        void _removed;
        return rest;
      }
      return { ...current, [productId]: nextQuantity };
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || selectedProducts.length === 0) return;

    submittingRef.current = true;
    setPending(true);
    setStatus("idle");

    try {
      requestIdRef.current ??= createClientRequestId("guest-order");
      createOrder({
        clientRequestId: requestIdRef.current,
        lines: selectedProducts.map((product) => ({
          catalogItemId: product.id,
          quantity: quantities[product.id] ?? 1,
        })),
        location,
        notes,
        requestedTime,
        serviceDate: selectedDate,
      });
      setQuantities({});
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
          <span className={styles.shopEyebrow}>{copy.order.shopEyebrow}</span>
          <h3 className={styles.panelTitle}>{copy.order.title}</h3>
          <p className={styles.panelLead}>{copy.order.lead}</p>

          {products.length ? (
            <>
              <div
                aria-label={copy.order.categoryLabel}
                className={styles.shopCategories}
                role="group"
              >
                {shopCategories.map((shopCategory) => {
                  const itemCount = products.filter(
                    (product) => shopCategory === "all" || product.category === shopCategory,
                  ).length;
                  return (
                    <button
                      aria-pressed={category === shopCategory}
                      className={styles.shopCategory}
                      key={shopCategory}
                      onClick={() => setCategory(shopCategory)}
                      type="button"
                    >
                      <span>{copy.order.categories[shopCategory]}</span>
                      <small>{itemCount}</small>
                    </button>
                  );
                })}
              </div>

              {visibleProducts.length ? (
                <div className={styles.catalogGrid}>
                  {visibleProducts.map((product) => {
                    const quantity = quantities[product.id] ?? 0;
                    const productName = product.labels[locale];
                    return (
                      <article className={styles.catalogItem} data-active={quantity > 0} key={product.id}>
                        <div className={styles.itemTopline}>
                          <strong>{productName}</strong>
                          <span className={styles.price}>
                            {product.priceCents == null
                              ? copy.order.priceOnRequest
                              : `${formatGuestPrice(product.priceCents, locale)} ${copy.order.each}`}
                          </span>
                        </div>
                        {product.description?.[locale] ? (
                          <p className={styles.requestMeta}>{product.description[locale]}</p>
                        ) : null}
                        <div
                          aria-label={`${copy.order.quantityFor} ${productName}`}
                          className={styles.quantityControl}
                          role="group"
                        >
                          <button
                            aria-label={`${copy.order.quantityDecrease}: ${productName}`}
                            className={styles.quantityButton}
                            disabled={quantity === 0}
                            onClick={() => changeQuantity(product.id, -1)}
                            type="button"
                          >
                            <span aria-hidden="true">−</span>
                          </button>
                          <output aria-live="polite" className={styles.quantityValue}>
                            {quantity}
                          </output>
                          <button
                            aria-label={`${copy.order.quantityIncrease}: ${productName}`}
                            className={styles.quantityButton}
                            disabled={quantity >= 20}
                            onClick={() => changeQuantity(product.id, 1)}
                            type="button"
                          >
                            <span aria-hidden="true">+</span>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className={styles.emptyState}>{copy.order.emptyCategory}</p>
              )}
            </>
          ) : (
            <p className={styles.emptyState}>{copy.order.emptyCatalog}</p>
          )}
        </div>

        <div className={styles.requestForm}>
          <fieldset className={styles.fieldset}>
            <legend>{copy.order.locationLabel}</legend>
            <div className={styles.radioCards}>
              {(["room", "pool", "beach"] as const).map((option) => (
                <label className={styles.radioCard} key={option}>
                  <input
                    checked={location === option}
                    name="guest-order-location"
                    onChange={() => setLocation(option)}
                    type="radio"
                    value={option}
                  />
                  <span>{copy.locations[option]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className={styles.field}>
            <label htmlFor={`guest-order-time-${selectedDate}`}>{copy.order.timeLabel}</label>
            <input
              id={`guest-order-time-${selectedDate}`}
              onChange={(event) => setRequestedTime(event.target.value)}
              required
              type="time"
              value={requestedTime}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor={`guest-order-notes-${selectedDate}`}>{copy.order.notesLabel}</label>
            <textarea
              id={`guest-order-notes-${selectedDate}`}
              maxLength={1000}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={copy.order.notesPlaceholder}
              value={notes}
            />
          </div>

          <aside aria-live="polite" className={styles.summaryCard}>
            <div className={styles.summaryHeading}>
              <h4>{copy.order.summaryTitle}</h4>
              <span className={styles.cartCount}>{selectedUnits}</span>
            </div>
            {selectedProducts.length ? (
              <>
                <ul className={styles.summaryList}>
                  {selectedProducts.map((product) => (
                    <li key={product.id}>
                      <span>{product.labels[locale]}</span>
                      <strong>× {quantities[product.id]}</strong>
                    </li>
                  ))}
                </ul>
                {pricedTotal > 0 ? (
                  <div className={styles.summaryTotal}>
                    <span>{copy.order.total}</span>
                    <strong>{formatGuestPrice(pricedTotal, locale)}</strong>
                  </div>
                ) : null}
                {hasPriceOnRequest ? (
                  <p className={styles.summaryEmpty}>{copy.order.totalPartlyOnRequest}</p>
                ) : null}
              </>
            ) : (
              <p className={styles.summaryEmpty}>{copy.order.summaryEmpty}</p>
            )}
          </aside>

          {status === "success" ? (
            <div className={styles.successNotice} role="status">{copy.order.success}</div>
          ) : null}
          {status === "error" ? (
            <div aria-live="assertive" className={styles.errorNotice} role="alert">
              {copy.order.error}
            </div>
          ) : null}

          <button
            className={styles.primaryButton}
            disabled={pending || selectedProducts.length === 0 || products.length === 0}
            type="submit"
          >
            {pending ? copy.order.submitting : copy.order.submit}
          </button>
        </div>
      </div>
    </form>
  );
}
