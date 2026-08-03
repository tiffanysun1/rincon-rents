import { writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { sourceUnits } from "../data.js";
import { refreshState as previousState } from "../refresh-state.js";
import {
  extractKnownUnitOverride,
  extractRentCafeUnitOverride,
  parseEquityAvailability,
  parseEssexAvailabilityText,
  reconcileEquityUnits,
  reconcileExactFeedUnits,
} from "./lib/refresh-core.mjs";

const now = new Date();
const dryRun = process.argv.includes("--dry-run");
const groupedSources = new Map();
for (const unit of sourceUnits) {
  if (!groupedSources.has(unit.sourceUrl)) groupedSources.set(unit.sourceUrl, []);
  groupedSources.get(unit.sourceUrl).push(unit);
}

async function inspectSource(browser, sourceUrl, existingUnits) {
  const context = await browser.newContext({
    locale: "en-US",
    timezoneId: "America/Los_Angeles",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36",
  });
  const page = await context.newPage();
  try {
    const response = await page.goto(sourceUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForTimeout(2_000);
    const status = response?.status() || 0;
    const title = await page.title();
    const bodyText = await page.locator("body").innerText({ timeout: 10_000 });
    if (status >= 400 || /access denied|captcha|verify you are human/i.test(`${title} ${bodyText.slice(0, 1000)}`)) {
      throw new Error(`source blocked automated access (${status || "no status"})`);
    }

    if (sourceUrl.includes("equityapartments.com")) {
      const fresh = parseEquityAvailability(await page.content());
      if (!fresh.length) throw new Error("structured availability was not found");
      return reconcileEquityUnits(existingUnits, fresh, now);
    }

    if (sourceUrl.includes("essexapartmenthomes.com")) {
      const selector = 'button[class*="floorplan-available-button"]';
      const buttonCount = await page.locator(selector).count();
      if (!buttonCount) throw new Error("official availability controls were not found");
      const fresh = [];
      for (let index = 0; index < buttonCount; index += 1) {
        if (index > 0) {
          await page.goto(sourceUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
          await page.waitForFunction((target) => document.querySelectorAll(target).length > 0, selector, { timeout: 15_000 });
        }
        await page.locator(selector).nth(index).click();
        await page.waitForFunction(() => document.body.innerText.includes("Step 2"), { timeout: 15_000 });
        fresh.push(...parseEssexAvailabilityText(await page.locator("body").innerText()));
      }
      if (!fresh.length) throw new Error("official unit-level availability was not found");
      return reconcileExactFeedUnits(existingUnits, fresh, now);
    }

    if (sourceUrl.includes("rentcafe.com")) {
      const overrides = {};
      for (const unit of existingUnits) {
        const override = extractRentCafeUnitOverride(bodyText, unit, now);
        if (override) overrides[unit.id] = override;
      }
      const matchedCount = Object.keys(overrides).length;
      if (!matchedCount) throw new Error("no exact RentCafe unit rows were confirmed");
      return { overrides, discoveredUnits: [], matchedCount };
    }

    const overrides = {};
    for (const unit of existingUnits) {
      const override = extractKnownUnitOverride(bodyText, unit, now);
      if (override) overrides[unit.id] = override;
    }
    const matchedCount = Object.keys(overrides).length;
    if (!matchedCount) throw new Error("no exact unit-and-price pairs were confirmed");
    return { overrides, discoveredUnits: [], matchedCount };
  } finally {
    await context.close();
  }
}

async function runPool(items, workerCount, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function next() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(workerCount, items.length) }, next));
  return results;
}

const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
});
const entries = [...groupedSources.entries()];
const results = await runPool(entries, 3, async ([sourceUrl, existingUnits]) => {
  try {
    const refresh = await inspectSource(browser, sourceUrl, existingUnits);
    return { sourceUrl, ok: true, ...refresh };
  } catch (error) {
    return { sourceUrl, ok: false, error: error.message };
  }
});
await browser.close();

const verified = results.filter((result) => result.ok);
const minimumVerified = Number(process.env.MIN_VERIFIED_SOURCES || 1);
if (verified.length < minimumVerified) {
  throw new Error(`Refresh stopped: ${verified.length}/${entries.length} sources verified; ${minimumVerified} required.`);
}

const unitOverrides = { ...(previousState.unitOverrides || {}) };
let discoveredUnits = [...(previousState.discoveredUnits || [])];
const sourceStatuses = { ...(previousState.sourceStatuses || {}) };
for (const result of results) {
  const priorStatus = sourceStatuses[result.sourceUrl] || {};
  sourceStatuses[result.sourceUrl] = result.ok
    ? { status: "verified", lastAttemptAt: now.toISOString(), lastSuccessfulAt: now.toISOString(), matchedCount: result.matchedCount }
    : { ...priorStatus, status: "failed", lastAttemptAt: now.toISOString(), error: result.error };
  if (!result.ok) continue;
  Object.assign(unitOverrides, result.overrides);
  if (result.discoveredUnits.length) {
    const refreshedSource = result.sourceUrl;
    discoveredUnits = discoveredUnits.filter((unit) => unit.sourceUrl !== refreshedSource);
    discoveredUnits.push(...result.discoveredUnits);
  }
}

const nextState = {
  dataUpdatedAt: now.toISOString(),
  lastRefreshAttemptAt: now.toISOString(),
  verifiedSourceCount: verified.length,
  totalSourceCount: entries.length,
  sourceStatuses,
  unitOverrides,
  discoveredUnits: discoveredUnits.filter((unit) => unit.beds >= 1),
};

if (!dryRun) {
  const output = `// Generated by scripts/refresh-listings.mjs after a successful source check.\nexport const refreshState = ${JSON.stringify(nextState, null, 2)};\n`;
  await writeFile(new URL("../refresh-state.js", import.meta.url), output);
}

console.log(`Verified ${verified.length}/${entries.length} sources and ${verified.reduce((sum, result) => sum + result.matchedCount, 0)} exact listings${dryRun ? " (dry run)" : ""}.`);
for (const result of results.filter((item) => !item.ok)) {
  console.log(`Kept prior data for ${new URL(result.sourceUrl).hostname}: ${result.error}`);
}
