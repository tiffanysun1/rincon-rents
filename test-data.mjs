import assert from "node:assert/strict";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  groupListingsByBuilding,
  isNewListing,
  listingLinkLabel,
  monitoredBuildings,
  monthlyTotal,
  snapshotMetadata,
  sortListings,
  sourceUnits,
  trackerSources,
  units,
  upfrontTotal,
} from "./data.js";

const AVERY_450_URL = "https://www.relatedrentals.com/apartment-rentals/san-francisco/soma/avery-450";
const SOLAIRE_URL = "https://solairesf.com/floorplans/";

export function validateSnapshot({
  inventory = units,
  baseline = sourceUnits,
  trackers = trackerSources,
  monitored = monitoredBuildings,
  metadata = snapshotMetadata,
} = {}) {
  assert.equal(baseline.length, 86, "the researched baseline should retain all 86 source offers");
  assert.equal(trackers.length, 11, "the daily refresh should retain every configured live feed");
  assert.ok(inventory.length > 0, "the public snapshot must contain at least one non-studio home");
  assert.equal(new Set(inventory.map((unit) => unit.id)).size, inventory.length, "unit ids must be unique");
  assert.ok(inventory.every((unit) => unit.beds >= 1), "studios must never reach the public inventory");
  assert.ok(!Number.isNaN(new Date(metadata.dataUpdatedAt).valueOf()), "the displayed update timestamp must be valid");

  const avery450 = inventory.filter((unit) => unit.building === "Avery 450");
  assert.ok(avery450.every((unit) => unit.sourceType === "official"));
  assert.ok(avery450.every((unit) => unit.sourceUrl === AVERY_450_URL));
  assert.ok(avery450.every((unit) => unit.listingUrl.startsWith(`${unit.sourceUrl}/`)), "Avery 450 should link to each current official unit page");

  const solaire = inventory.filter((unit) => unit.building === "Solaire");
  assert.ok(solaire.every((unit) => unit.sourceType === "official"));
  assert.ok(solaire.every((unit) => unit.sourceUrl === SOLAIRE_URL));
  assert.ok(solaire.every((unit) => unit.listingUrl.includes("solairesf.com/floorplans/unit-")));

  assert.ok(monitored.every((item) => item.sourceUrl.startsWith("https://")));
  assert.ok(
    monitored.every((item) => !inventory.some((unit) => unit.building === item.building)),
    "a building with qualifying live homes must not still be labeled studios-only",
  );

  for (const unit of inventory) {
    assert.ok(unit.building && unit.address && unit.unit, `${unit.id} must identify its home`);
    assert.ok(unit.rent > 0, `${unit.id} must have a positive advertised price`);
    assert.ok(unit.utilities >= 0 && unit.fees >= 0 && unit.insurance >= 0, `${unit.id} has invalid monthly costs`);
    assert.ok(unit.sourceUrl.startsWith("https://"), `${unit.id} must link to its source`);
    assert.ok(unit.listingUrl.startsWith("https://"), `${unit.id} must link to its listing`);
    assert.ok(unit.moveInLabel && unit.postedLabel && unit.checkedLabel, `${unit.id} must expose timing provenance`);
    assert.equal(
      monthlyTotal(unit, false),
      unit.rent + unit.fees + unit.utilities + unit.insurance,
      `${unit.id} car-free total is inconsistent`,
    );
    assert.equal(
      monthlyTotal(unit, true),
      monthlyTotal(unit, false) + (unit.parkingIncluded ? 0 : unit.parking),
      `${unit.id} parking total is inconsistent`,
    );
    assert.ok(upfrontTotal(unit) >= 0, `${unit.id} has invalid upfront costs`);
    assert.ok(
      unit.listingUrl !== unit.sourceUrl || unit.sourceType === "zillow-condo" || unit.sourceType === "compass-condo" || unit.building === "500 Folsom",
      `${unit.id} should use a unit/plan-specific link when its source exposes one`,
    );
  }

  const fixedTracker = {
    dataUpdatedAt: "2026-08-03T05:00:00.000Z",
    previousDataUpdatedAt: "2026-08-03T04:42:12.630Z",
  };
  assert.equal(isNewListing({ postedAt: "2026-08-01T07:00:00.000Z" }, fixedTracker), true, "a listing at most 48 hours old should be New");
  assert.equal(isNewListing({ postedAt: "2026-07-24T07:00:00.000Z" }, fixedTracker), false, "an older listing should not be New");
  assert.equal(isNewListing({ postedAt: "2026-08-03T04:50:00.000Z" }, fixedTracker), true, "a listing posted after the previous tracker should be New");

  const byBuilding = sortListings(inventory, "building-asc", true);
  const buildingOrder = [...new Set(byBuilding.map((unit) => unit.building))];
  assert.deepEqual(
    buildingOrder,
    [...buildingOrder].sort((a, b) => a.localeCompare(b, "en", { numeric: true, sensitivity: "base" })),
    "apartment-complex sorting should group buildings alphabetically",
  );
  for (const building of buildingOrder) {
    const totals = byBuilding.filter((unit) => unit.building === building).map((unit) => monthlyTotal(unit, true));
    assert.deepEqual(totals, [...totals].sort((a, b) => a - b), `${building} should be price-sorted within its group`);
  }
  const buildingGroups = groupListingsByBuilding(byBuilding);
  assert.equal(buildingGroups.length, new Set(inventory.map((unit) => unit.building)).size, "grouped mode should render one header per apartment complex");
  assert.equal(buildingGroups.reduce((sum, group) => sum + group.units.length, 0), inventory.length);
  assert.ok(
    buildingGroups.every((group) => group.units.every((unit) => unit.building === group.building)),
    "each apartment-complex header should contain only that building's units",
  );

  const syntheticPriceSort = sortListings([
    { building: "Alpha", unit: "1", rent: 4000, fees: 0, utilities: 0, insurance: 0, parking: 0, parkingIncluded: false, isNew: false },
    { building: "Zulu", unit: "2", rent: 5000, fees: 0, utilities: 0, insurance: 0, parking: 0, parkingIncluded: false, isNew: true },
  ], "total-asc", true);
  assert.equal(syntheticPriceSort[0].building, "Zulu", "price views should continue pinning New listings first");
  assert.equal(
    monthlyTotal({ rent: 5000, fees: 50, utilities: 100, insurance: 20, parking: 400, parkingIncluded: true }, true),
    5170,
    "included parking must not be charged twice",
  );
  assert.equal(
    listingLinkLabel({ sourceType: "official", sourceUrl: "https://example.com/feed", listingUrl: "https://example.com/feed" }),
    "View availability",
  );
  assert.equal(
    listingLinkLabel({ sourceType: "official", sourceUrl: "https://example.com/feed", listingUrl: "https://example.com/unit/1" }),
    "View listing",
  );

  for (const unit of inventory.filter((item) => item.building === "Modera Rincon Hill" || item.building === "333 Fremont")) {
    assert.notEqual(unit.listingUrl, unit.sourceUrl, `${unit.id} should use its deepest official listing page`);
  }
  assert.ok(inventory.filter((unit) => unit.building === "340 Fremont").every((unit) => unit.listingUrl.includes("/UnitFees/")));
  assert.ok(inventory.filter((unit) => unit.building === "500 Folsom").every((unit) => unit.listingUrl === unit.sourceUrl));
  assert.ok(inventory.filter((unit) => unit.building === "Spera").every((unit) => unit.listingUrl.includes("UnitID=")));
  assert.ok(inventory.filter((unit) => unit.building === "388 Beale").every((unit) => unit.listingUrl.includes("/apartments-pricing/apartment/")));

  return { unitCount: inventory.length, buildingCount: buildingOrder.length };
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  const result = validateSnapshot();
  console.log(`Validated ${result.unitCount} units across ${result.buildingCount} active buildings.`);
}
