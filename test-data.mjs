import assert from "node:assert/strict";
import { units, sourceUnits, trackerSources, monitoredBuildings, snapshotMetadata, isNewListing, monthlyTotal, sortListings, groupListingsByBuilding, upfrontTotal, listingLinkLabel } from "./data.js";

assert.equal(sourceUnits.length, 86, "the researched baseline should retain all 86 source offers");
assert.ok(units.length >= 80, "the public snapshot should retain broad non-studio coverage even as live availability changes");
assert.equal(new Set(units.map((unit) => unit.id)).size, units.length, "unit ids must be unique");
assert.ok(new Set(units.map((unit) => unit.building)).size >= 15, "active non-studio units should cover the broader Rincon Hill area");
assert.equal(monitoredBuildings.length, 1, "Jasper should remain monitored while its live inventory is studios-only");
assert.equal(trackerSources.length, 11, "the daily refresh should include neighborhood, Avery, 399 Fremont, and eight condo-building feeds");
assert.ok(units.every((unit) => unit.beds >= 1), "studios must never reach the public inventory");
assert.ok(units.some((unit) => unit.building === "399 Fremont"), "399 Fremont's official inventory should be present");
assert.ok(units.some((unit) => unit.building === "Avery 450"), "Avery 450's unit feed should be present");
assert.ok(units.some((unit) => unit.building === "The Avery"), "The Avery condo listings should be present");
assert.ok(units.some((unit) => unit.building === "The Harrison"), "The Harrison condo listings should be present");
assert.ok(units.some((unit) => unit.building === "MIRA"), "MIRA condo listings should be present");
assert.ok(units.some((unit) => unit.building === "Millennium Tower"), "Salesforce Park-adjacent listings should be present");
assert.ok(!Number.isNaN(new Date(snapshotMetadata.dataUpdatedAt).valueOf()), "the displayed update timestamp must be valid");

const avery450 = units.filter((unit) => unit.building === "Avery 450");
assert.equal(avery450.length, 4, "Avery 450 should expose every current non-studio home from its official site");
assert.ok(avery450.every((unit) => unit.sourceType === "official"));
assert.ok(avery450.every((unit) => unit.sourceUrl === "https://www.relatedrentals.com/apartment-rentals/san-francisco/soma/avery-450"));
assert.ok(avery450.every((unit) => unit.listingUrl.startsWith(`${unit.sourceUrl}/`)), "Avery 450 should link to each official unit page");
assert.ok(avery450.some((unit) => unit.unit.startsWith("Unit 2309")), "new official Avery 450 units should be discovered automatically");

const harrison10e = units.find((unit) => unit.id === "auto-the-harrison-10e");
assert.equal(harrison10e.listingUrl, "https://www.zillow.com/homedetails/401-Harrison-St-APT-10E-San-Francisco-CA-94105/249698368_zpid/");
assert.equal(harrison10e.parkingIncluded, true, "Harrison 10E's included valet space must not be charged twice");
assert.equal(harrison10e.parking, 0);
const harrison34a = units.find((unit) => unit.id === "auto-the-harrison-34a");
assert.equal(harrison34a.parkingIncluded, false, "Harrison 34A explicitly lists a separate parking fee");
assert.equal(harrison34a.parking, 300);
assert.ok(units.filter((unit) => unit.building === "The Harrison" && ["Unit 41A", "Unit 46B"].includes(unit.unit)).every((unit) => unit.parkingIncluded));
assert.equal(units.some((unit) => unit.id === "harrison-11a"), false, "removed Zillow rentals must leave the public inventory");

for (const unit of units) {
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

const infinity = units.find((unit) => unit.id === "infinity-6b");
assert.equal(infinity.parkingIncluded, true);
assert.equal(monthlyTotal(infinity, true), monthlyTotal(infinity, false), "included parking must not be double-counted");

const lumina = units.find((unit) => unit.id === "lumina-27d");
assert.equal(lumina.isNew, false, "an eight-day-old listing must not be marked New");
assert.equal(lumina.listingUrl, "https://www.zillow.com/homedetails/201-Folsom-St-APT-27D-San-Francisco-CA-94105/249698470_zpid/");
assert.equal(monthlyTotal(lumina, true), 7413, "LUMINA should include utilities, insurance, and confirmed parking once");
assert.equal(listingLinkLabel(lumina), "View listing", "an exact Zillow condo URL should be labeled as a listing");

const fixedTracker = {
  dataUpdatedAt: "2026-08-03T05:00:00.000Z",
  previousDataUpdatedAt: "2026-08-03T04:42:12.630Z",
};
assert.equal(isNewListing({ postedAt: "2026-08-01T07:00:00.000Z" }, fixedTracker), true, "a listing at most 48 hours old should be New");
assert.equal(isNewListing({ postedAt: "2026-07-24T07:00:00.000Z" }, fixedTracker), false, "an older listing should not be New");
assert.equal(isNewListing({ postedAt: "2026-08-03T04:50:00.000Z" }, fixedTracker), true, "a listing posted after the previous tracker should be New");

const portside = units.find((unit) => unit.id === "portside-717");
assert.equal(portside.listingUrl, "https://www.compass.com/homedetails/403-Main-St-Unit-717-San-Francisco-CA-94105/1QPSD2_pid/");
assert.equal(monthlyTotal(portside, true), 6038, "Portside 717 should include electricity, internet, insurance, and confirmed parking");
assert.equal(listingLinkLabel(portside), "View listing");

assert.equal(units.filter((unit) => unit.building === "Jasper").length, 0, "Jasper studios must remain hidden");
assert.equal(monitoredBuildings.find((item) => item.building === "Jasper").sourceUrl, "https://www.rentjasper.com/community-map/");

const byBuilding = sortListings(units, "building-asc", true);
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
assert.equal(buildingGroups.length, new Set(units.map((unit) => unit.building)).size, "grouped mode should render one header per apartment complex");
assert.equal(buildingGroups.reduce((sum, group) => sum + group.units.length, 0), units.length);
assert.ok(
  buildingGroups.every((group) => group.units.every((unit) => unit.building === group.building)),
  "each apartment-complex header should contain only that building's units",
);
const syntheticPriceSort = sortListings([
  { building: "Alpha", unit: "1", rent: 4000, fees: 0, utilities: 0, insurance: 0, parking: 0, parkingIncluded: false, isNew: false },
  { building: "Zulu", unit: "2", rent: 5000, fees: 0, utilities: 0, insurance: 0, parking: 0, parkingIncluded: false, isNew: true },
], "total-asc", true);
assert.equal(syntheticPriceSort[0].building, "Zulu", "price views should continue pinning New listings first");

const fremont = units.find((unit) => unit.id === "340-1a-f7");
assert.equal(monthlyTotal(fremont, true), 6265, "340 Fremont should add modeled recurring costs and parking once");

const solaire = units.filter((unit) => unit.building === "Solaire");
assert.equal(solaire.length, 6, "Solaire's official feed should expose six non-studio homes");
assert.ok(solaire.every((unit) => unit.sourceType === "official"));
assert.ok(solaire.every((unit) => unit.sourceUrl === "https://solairesf.com/floorplans/"));
assert.ok(solaire.every((unit) => unit.listingUrl.includes("solairesf.com/floorplans/unit-")));
assert.deepEqual(
  solaire.map((unit) => unit.id).sort(),
  ["solaire-0509", "solaire-1209", "solaire-2303", "solaire-2609", "solaire-2802", "solaire-3103"],
);

for (const unit of units.filter((item) => item.building === "Modera Rincon Hill" || item.building === "333 Fremont")) {
  assert.notEqual(unit.listingUrl, unit.sourceUrl, `${unit.id} should use its deepest official listing page`);
}
assert.ok(units.filter((unit) => unit.building === "340 Fremont").every((unit) => unit.listingUrl.includes("/UnitFees/")));
assert.ok(units.filter((unit) => unit.building === "500 Folsom").every((unit) => unit.listingUrl === unit.sourceUrl));
assert.ok(units.filter((unit) => unit.building === "Spera").every((unit) => unit.listingUrl.includes("UnitID=")));
assert.ok(units.filter((unit) => unit.building === "388 Beale").every((unit) => unit.listingUrl.includes("/apartments-pricing/apartment/")));

console.log(`Validated ${units.length} units across ${new Set(units.map((unit) => unit.building)).size} active buildings.`);
