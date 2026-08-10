import assert from "node:assert/strict";
import {
  calculateMarketChanges,
  formatMarketSummary,
  materializeInventory,
} from "./scripts/lib/market-summary.mjs";

const sourceUnits = [
  { id: "one", building: "Alpha", unit: "Unit 101", beds: 1, rent: 5000, active: true },
  { id: "two", building: "Beta", unit: "Unit 202", beds: 2, rent: 7000, active: true },
  { id: "gone", building: "Gamma", unit: "Unit 303", beds: 1, rent: 5200, active: true },
];
const previousState = { unitOverrides: {}, discoveredUnits: [] };
const nextState = {
  dataUpdatedAt: "2026-08-09T16:00:00.000Z",
  unitOverrides: {
    one: { rent: 4800 },
    gone: { active: false },
  },
  discoveredUnits: [
    { id: "new", building: "Delta", unit: "Unit 404 · Plan A", beds: 1, rent: 4500, active: true, postedAt: "2026-08-09T15:00:00.000Z" },
    { id: "studio", building: "Delta", unit: "Unit 405", beds: 0, rent: 3900, active: true },
  ],
};

const changes = calculateMarketChanges(sourceUnits, previousState, nextState);
assert.deepEqual(changes.newListings.map((unit) => unit.id), ["new"]);
assert.deepEqual(changes.removedListings.map((unit) => unit.id), ["gone"]);
assert.equal(changes.priceChanges.length, 1);
assert.equal(changes.priceChanges[0].id, "one");
assert.equal(changes.priceChanges[0].change, -200);

const currentUnits = materializeInventory(sourceUnits, nextState);
const summary = formatMarketSummary({
  units: currentUnits,
  changes,
  verifiedSourceCount: 19,
  totalSourceCount: 29,
});
assert.match(summary, /1 new, 1 off-market, 1 price change/);
assert.match(summary, /New: Delta #404 \$4,500/);
assert.match(summary, /Drops: Alpha #101 \$4,800 \(-\$200\)/);
assert.match(summary, /Market now: 3 homes across 3 buildings/);
assert.match(summary, /Checked 19\/29 sources/);
assert.ok(!summary.includes("studio"), "studios must not appear in the market summary");

console.log("Validated new, removed, price-change, market-low, and source-coverage summaries.");
