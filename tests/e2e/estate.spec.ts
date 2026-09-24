import { expect, test } from "@playwright/test";
import { getContent } from "../../src/lib/content";
import { getLocalizedPath, supportedLocales } from "../../src/lib/content/routes";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("la-fenice-intro-seen", "true"));
});

test("estate loads on demand, changes views and releases the canvas", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  const requests: string[] = [];
  const decoders: string[] = [];
  page.on("request", (request) => { if (request.url().endsWith(".glb")) requests.push(request.url()); });
  page.on("request", (request) => { if (request.url().includes("/models/draco/")) decoders.push(request.url()); });
  await page.goto("/it#explore-estate");
  const section = page.locator("#explore-estate");
  await expect(section.getByRole("heading", { name: "Tanti livelli. Un solo mare." })).toBeVisible();
  expect(requests).toHaveLength(0);
  expect(decoders).toHaveLength(0);
  await section.getByRole("button", { name: "Esplora in 3D", exact: true }).click();
  await expect(section.locator('[data-status="ready"]')).toBeVisible({ timeout: 25_000 });
  await expect(section.locator("canvas")).toHaveCount(1);
  expect(requests).toHaveLength(1);
  expect(decoders.length).toBeGreaterThan(0);
  const firstFrame = await section.locator("canvas").screenshot({ path: testInfo.outputPath("estate-overview.png") });
  const close = section.getByRole("button", { name: "Torna all’immagine", exact: true });
  expect(await close.evaluate((button) => {
    const box = button.getBoundingClientRect();
    return button.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
  })).toBe(true);
  await page.waitForTimeout(250);
  expect((await section.locator("canvas").screenshot()).equals(firstFrame)).toBe(false);
  await section.locator("canvas").hover();
  const scrollBefore = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 200);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(scrollBefore);
  await section.getByRole("button", { name: /Giardini e scale/ }).click();
  await expect(section.getByRole("button", { name: /Giardini e scale/ })).toHaveAttribute("aria-pressed", "true");
  await section.getByRole("button", { name: "Ruota a sinistra" }).click();
  await section.getByRole("button", { name: "Avvicina" }).click();
  for (const [index, stop] of getContent("it").pages.home.estate.stops.entries()) {
    const button = section.getByRole("button", { name: new RegExp(stop.title) });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(section).toContainText(stop.text);
    await section.locator("canvas").screenshot({ path: testInfo.outputPath(`estate-stage-${index + 1}.png`) });
  }
  await expect(section).toContainText("La costa e le impronte degli edifici seguono dati aperti");
  await section.getByRole("button", { name: "Vista d’insieme" }).click();
  await section.getByRole("button", { name: "Torna all’immagine", exact: true }).click();
  await expect(section.locator("canvas")).toHaveCount(0);
  await section.getByRole("button", { name: "Esplora in 3D", exact: true }).click();
  await expect(section.locator('[data-status="ready"]')).toBeVisible({ timeout: 25_000 });
  await expect(section.locator("canvas")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("estate stops drawing offscreen and resumes without a second canvas", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const clear = WebGL2RenderingContext.prototype.clear;
    WebGL2RenderingContext.prototype.clear = function(mask: number) {
      const canvas = this.canvas;
      if (canvas instanceof HTMLCanvasElement && canvas.closest("#explore-estate")) {
        canvas.dataset.frames = String(Number(canvas.dataset.frames ?? 0) + 1);
      }
      return clear.call(this, mask);
    };
  });
  await page.goto("/it#explore-estate");
  const section = page.locator("#explore-estate");
  await section.getByRole("button", { name: "Esplora in 3D", exact: true }).click();
  await expect(section.locator('[data-status="ready"]')).toBeVisible({ timeout: 25_000 });
  const canvas = section.locator("canvas");
  await canvas.scrollIntoViewIfNeeded();
  const before = Number(await canvas.getAttribute("data-frames"));
  await page.waitForTimeout(1000);
  const renderedFrames = Number(await canvas.getAttribute("data-frames")) - before;
  expect(renderedFrames).toBeGreaterThan(0);
  await testInfo.attach("render-sample", { body: JSON.stringify({ viewport: testInfo.project.name, renderedFrames, sampledMilliseconds: 1000 }), contentType: "application/json" });
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(250);
  const paused = await canvas.getAttribute("data-frames");
  await page.waitForTimeout(300);
  expect(await canvas.getAttribute("data-frames")).toBe(paused);
  await canvas.scrollIntoViewIfNeeded();
  await expect.poll(async () => Number(await canvas.getAttribute("data-frames"))).toBeGreaterThan(Number(paused));
  await expect(canvas).toHaveCount(1);
});

test("estate keeps all four translations and mobile layout readable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const locale of supportedLocales) {
    const copy = getContent(locale).pages.home.estate;
    await page.goto(`${getLocalizedPath("home", locale)}#explore-estate`);
    const section = page.locator("#explore-estate");
    await expect(section.getByRole("heading", { name: copy.title })).toBeVisible();
    await expect(section).toContainText(copy.disclaimer);
    await expect(section.getByRole("img", { name: copy.posterAlt })).toBeVisible();
    const firstStop = section.getByRole("button", { name: new RegExp(copy.stops[0].title) });
    await firstStop.focus();
    await page.keyboard.press("Enter");
    await expect(firstStop).toHaveAttribute("aria-pressed", "true");
    await expect(section).toContainText(copy.stops[0].text);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});

test("estate falls back gracefully when its model fails", async ({ page }) => {
  await page.route("**/models/la-fenice-study.glb", (route) => route.fulfill({ status: 503 }));
  await page.goto("/it#explore-estate");
  const section = page.locator("#explore-estate");
  await section.getByRole("button", { name: "Esplora in 3D", exact: true }).click();
  await expect(section.locator('[data-status="error"]')).toBeVisible();
  await expect(section.getByText(/La vista 3D non è disponibile/)).toBeVisible();
  await expect(section.getByRole("img")).toBeVisible();
  await expect(section.locator("canvas")).toHaveCount(0);
});

test("estate keeps its poster when the local mesh decoder fails", async ({ page }) => {
  await page.route("**/models/draco/**", (route) => route.fulfill({ status: 503 }));
  await page.goto("/it#explore-estate");
  const section = page.locator("#explore-estate");
  await section.getByRole("button", { name: "Esplora in 3D", exact: true }).click();
  await expect(section.locator('[data-status="error"]')).toBeVisible({ timeout: 25_000 });
  await expect(section.getByRole("img")).toBeVisible();
  await expect(section.locator("canvas")).toHaveCount(0);
});

test("reduced-motion estate is still interactive without ambient animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/it#explore-estate");
  const section = page.locator("#explore-estate");
  await section.getByRole("button", { name: "Esplora in 3D", exact: true }).click();
  await expect(section.locator('[data-status="ready"]')).toBeVisible({ timeout: 25_000 });
  const canvas = section.locator("canvas");
  const first = await canvas.screenshot();
  await page.waitForTimeout(250);
  expect((await canvas.screenshot()).equals(first)).toBe(true);
  await section.getByRole("button", { name: "Ruota a destra" }).focus();
  await page.keyboard.press("Enter");
  expect((await canvas.screenshot()).equals(first)).toBe(false);
  const beforeDrag = await canvas.screenshot();
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width * .4, box!.y + box!.height * .65);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * .6, box!.y + box!.height * .65, { steps: 12 });
  await page.mouse.up();
  await page.mouse.move(0, 0);
  expect((await canvas.screenshot()).equals(beforeDrag)).toBe(false);
  await canvas.evaluate((element) => element.dispatchEvent(new Event("webglcontextlost", { cancelable: true })));
  await expect(section.locator('[data-status="error"]')).toBeVisible();
  await expect(canvas).toHaveCount(0);
});

test("estate keeps its poster when WebGL is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value(type: string, ...args: unknown[]) {
        if (type === "webgl" || type === "webgl2") return null;
        return Reflect.apply(getContext, this, [type, ...args]);
      },
    });
  });
  await page.goto("/it#explore-estate");
  const section = page.locator("#explore-estate");
  await section.getByRole("button", { name: "Esplora in 3D", exact: true }).click();
  await expect(section.locator('[data-status="error"]')).toBeVisible();
  await expect(section.getByRole("img")).toBeVisible();
  await expect(section.locator("canvas")).toHaveCount(0);
});

test("estate content survives without JavaScript", async ({ baseURL, browser }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/it#explore-estate");
  await expect(page.locator(".logo-intro")).not.toBeVisible({ timeout: 5_000 });
  const section = page.locator("#explore-estate");
  await expect(section.getByRole("img")).toBeVisible();
  await expect(section).toContainText("Studio 3D illustrativo");
  await expect(section).toContainText(getContent("it").pages.home.stepsNotice.text);
  await context.close();
});

test("estate cancels an in-flight decoder before reopening", async ({ page }) => {
  await page.addInitScript(() => {
    const probe = { created: 0, terminated: 0, decoding: 0 };
    Object.assign(window, { estateWorkerProbe: probe });
    const NativeWorker = Worker;
    window.Worker = class extends NativeWorker {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        probe.created++;
      }
      postMessage(message: unknown, transfer: Transferable[] | StructuredSerializeOptions = []) {
        // Keep the first decode pending so cancellation is deterministic.
        if ((message as { type?: string }).type === "decode" && probe.created === 1) {
          probe.decoding++;
          return;
        }
        if (Array.isArray(transfer)) super.postMessage(message, transfer);
        else super.postMessage(message, transfer);
      }
      terminate() { probe.terminated++; super.terminate(); }
    };
  });
  await page.goto("/it#explore-estate");
  const section = page.locator("#explore-estate");
  const probe = () => page.evaluate(() => (window as unknown as { estateWorkerProbe: { created: number; terminated: number; decoding: number } }).estateWorkerProbe);
  await section.getByRole("button", { name: "Esplora in 3D", exact: true }).click();
  await expect.poll(async () => (await probe()).decoding, { timeout: 25_000 }).toBeGreaterThan(0);
  await section.getByRole("button", { name: "Torna all’immagine", exact: true }).click();
  await expect.poll(async () => (await probe()).terminated).toBe(1);
  await expect(section.locator("canvas")).toHaveCount(0);
  await section.getByRole("button", { name: "Esplora in 3D", exact: true }).click();
  await expect(section.locator('[data-status="ready"]')).toBeVisible({ timeout: 25_000 });
  await expect(section.locator("canvas")).toHaveCount(1);
  expect((await probe()).created).toBe(2);
});
