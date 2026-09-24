import { webcrypto } from "node:crypto";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

import { guestDemoCopy } from "@/components/demo/guest/copy";
import { ShopPanel } from "@/components/demo/guest/shop-panel";

import { DemoPortalProvider, useDemoPortal } from "./context";
import { createDemoPortalSeed } from "./seed";
import { DEMO_SESSION_STORAGE_KEY, DEMO_STATE_STORAGE_KEY } from "./storage";
import type { DemoPortalState, DemoProductCatalogItem, DemoSession } from "./types";

const copy = guestDemoCopy.it;

function GuestShop() {
  const { ready, state, today, createOrder } = useDemoPortal();
  if (!ready || !state) return null;
  return (
    <>
      <pre data-testid="portal-state">{JSON.stringify(state)}</pre>
      <ShopPanel
        copy={copy}
        createOrder={createOrder}
        locale="it"
        products={state.catalog.filter((item): item is DemoProductCatalogItem => item.kind === "product" && item.active)}
        selectedDate={today}
      />
    </>
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
  sessionStorage.clear();
});

it.each(["QuotaExceededError", "SecurityError"])(
  "preserves the dining cart on %s and persists exactly one order on retry",
  async (errorName) => {
    vi.stubGlobal("crypto", webcrypto);
    const seed = await createDemoPortalSeed();
    const guest = seed.accounts.find((account) => account.role === "guest")!;
    const session: DemoSession = {
      accountId: guest.id,
      loginCode: guest.loginCode,
      role: guest.role,
      credentialVersion: guest.credentialVersion,
      createdAt: seed.updatedAt,
    };
    const storedBytes = JSON.stringify(seed);
    localStorage.setItem(DEMO_STATE_STORAGE_KEY, storedBytes);
    sessionStorage.setItem(DEMO_SESSION_STORAGE_KEY, JSON.stringify(session));
    const user = userEvent.setup();
    render(<DemoPortalProvider><GuestShop /></DemoPortalProvider>);
    await screen.findByRole("heading", { name: copy.order.title });

    const lunch = screen.getByRole("group", { name: `${copy.order.quantityFor} Menu del giorno` });
    const pizza = screen.getByRole("group", { name: `${copy.order.quantityFor} Pizza Fenice` });
    await user.click(within(lunch).getByRole("button", { name: `${copy.order.quantityIncrease}: Menu del giorno` }));
    await user.click(within(lunch).getByRole("button", { name: `${copy.order.quantityIncrease}: Menu del giorno` }));
    await user.click(within(pizza).getByRole("button", { name: `${copy.order.quantityIncrease}: Pizza Fenice` }));
    const notes = screen.getByRole("textbox", { name: copy.order.notesLabel });
    const note = "Contattarmi per confermare pranzo e pizza.";
    await user.type(notes, note);
    const submit = screen.getByRole("button", { name: copy.order.submit });
    const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Browser storage refused the write", errorName);
    });

    await user.click(submit);

    expect(write).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alert")).toHaveTextContent(copy.order.error);
    expect(screen.queryByText(copy.order.success)).not.toBeInTheDocument();
    expect(within(lunch).getByRole("status")).toHaveTextContent("2");
    expect(within(pizza).getByRole("status")).toHaveTextContent("1");
    expect(notes).toHaveValue(note);
    expect(submit).toBeEnabled();
    expect(JSON.parse(screen.getByTestId("portal-state").textContent!)).toEqual(seed);
    expect(localStorage.getItem(DEMO_STATE_STORAGE_KEY)).toBe(storedBytes);

    write.mockRestore();
    await user.click(submit);

    expect(screen.getByText(copy.order.success)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(within(lunch).getByRole("status")).toHaveTextContent("0");
    expect(within(pizza).getByRole("status")).toHaveTextContent("0");
    expect(notes).toHaveValue("");
    expect(submit).toBeDisabled();
    const persisted: DemoPortalState = JSON.parse(localStorage.getItem(DEMO_STATE_STORAGE_KEY)!);
    expect(persisted.orders).toHaveLength(1);
    expect(persisted.orders[0]).toMatchObject({
      status: "pending",
      notes: note,
      lines: [
        { catalogItemId: "product-daily-lunch", quantity: 2 },
        { catalogItemId: "product-pizza-fenice", quantity: 1 },
      ],
    });
    expect(JSON.parse(screen.getByTestId("portal-state").textContent!)).toEqual(persisted);
  },
);
