import { writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { sourceUnits } from "../data.js";
import { refreshState as previousState } from "../refresh-state.js";
import {
  extractKnownUnitOverride,
  extractRentCafeUnitOverride,
  parseEquityAvailability,
  parseEssexAvailabilityText,
  parseModeraAvailabilityCards,
  parseSolaireAvailability,
  parseUdrAvailabilityCards,
  rentCafeListingUrlFromOnclick,
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
  if (sourceUrl.includes("solairesf.com")) {
    const response = await fetch(sourceUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RinconRent/1.0; +https://tiffanysun1.github.io/rincon-rents/)" },
    });
    if (!response.ok) throw new Error(`official Solaire feed returned ${response.status}`);
    const fresh = parseSolaireAvailability(await response.text(), sourceUrl);
    if (!fresh.length) throw new Error("official Solaire unit feed was not found");
    return reconcileExactFeedUnits(existingUnits, fresh, now);
  }

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
    if (status >= 400 || /access denied|captcha|verify you are human|have been blocked|unable to access/i.test(`${title} ${bodyText.slice(0, 1000)}`)) {
      throw new Error(`source blocked automated access (${status || "no status"})`);
    }

    if (sourceUrl.includes("equityapartments.com")) {
      const fresh = parseEquityAvailability(await page.content());
      if (!fresh.length) throw new Error("structured availability was not found");
      return reconcileEquityUnits(existingUnits, fresh, now);
    }

    if (sourceUrl.includes("moderarinconhill.com")) {
      const cards = await page.locator(".fp-group-item").evaluateAll((items) => items.map((card) => ({
        text: card.innerText,
        listingUrl: card.querySelector('a[href*="/floorplans/"]')?.href,
      })));
      const fresh = parseModeraAvailabilityCards(cards);
      if (!fresh.length) throw new Error("official Modera floor-plan cards were not found");
      return reconcileExactFeedUnits(existingUnits, fresh, now);
    }

    if (sourceUrl.includes("udr.com")) {
      const cards = await page.locator(".unit-container").evaluateAll((items) => items.map((card) => ({
        text: card.innerText,
        listingUrl: card.querySelector('a[aria-label="Lease Apartment"]')?.href,
      })));
      const fresh = parseUdrAvailabilityCards(cards, now);
      if (!fresh.length) throw new Error("official UDR unit cards were not found");
      return reconcileExactFeedUnits(existingUnits, fresh, now);
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
      const listingRows = await page.locator("tr.fp-unit").evaluateAll((rows) => rows.map((row) => ({
        unit: row.dataset.unitName?.trim(),
        onclick: row.querySelector(".btn-apply")?.getAttribute("onclick"),
      })));
      const listingUrls = new Map(listingRows.map((row) => [
        row.unit?.toLowerCase(),
        rentCafeListingUrlFromOnclick(row.onclick),
      ]));
      for (const unit of existingUnits) {
        const override = extractRentCafeUnitOverride(bodyText, unit, now);
        if (override) {
          const unitNumber = unit.unit.match(/\bUnit\s+([A-Z0-9]+)/i)?.[1]?.toLowerCase();
          const listingUrl = listingUrls.get(unitNumber);
          overrides[unit.id] = listingUrl ? { ...override, listingUrl } : override;
        }
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
const sourceStatuses = Object.fromEntries(
  entries.map(([sourceUrl]) => [sourceUrl, { ...(previousState.sourceStatuses?.[sourceUrl] || {}) }]),
);
for (const result of results) {
  const priorStatus = sourceStatuses[result.sourceUrl] || {};
  sourceStatuses[result.sourceUrl] = result.ok
    ? { status: "verified", lastAttemptAt: now.toISOString(), lastSuccessfulAt: now.toISOString(), matchedCount: result.matchedCount }
    : { ...priorStatus, status: "failed", lastAttemptAt: now.toISOString(), error: result.error };
  if (!result.ok) continue;
  Object.assign(unitOverrides, result.overrides);
  const refreshedSource = result.sourceUrl;
  discoveredUnits = discoveredUnits.filter((unit) => unit.sourceUrl !== refreshedSource);
  discoveredUnits.push(...result.discoveredUnits);
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
