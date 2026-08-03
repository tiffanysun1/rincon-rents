import assert from "node:assert/strict";
import { units, sourceUnits, monitoredBuildings, snapshotMetadata, monthlyTotal, upfrontTotal } from "./data.js";

assert.equal(sourceUnits.length, 77, "the researched baseline should retain all 77 source offers");
assert.equal(units.length, 65, "the public snapshot should contain 65 non-studio offers");
assert.equal(new Set(units.map((unit) => unit.id)).size, units.length, "unit ids must be unique");
assert.equal(new Set(units.map((unit) => unit.building)).size, 10, "active non-studio units should cover ten buildings");
assert.equal(monitoredBuildings.length, 6, "six additional buildings should remain visible in coverage");
assert.ok(units.every((unit) => unit.beds >= 1), "studios must never reach the public inventory");
assert.equal(units.filter((unit) => unit.building === "500 Folsom").length, 15);
assert.equal(units.filter((unit) => unit.building === "Spera").length, 13);
assert.equal(units.filter((unit) => unit.building === "388 Beale").length, 12);
assert.ok(!Number.isNaN(new Date(snapshotMetadata.dataUpdatedAt).valueOf()), "the displayed update timestamp must be valid");

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
    unit.listingUrl !== unit.sourceUrl || unit.sourceType === "zillow-condo" || unit.building === "500 Folsom",
    `${unit.id} should use a unit/plan-specific link when its source exposes one`,
  );
}

const infinity = units.find((unit) => unit.id === "infinity-6b");
assert.equal(infinity.parkingIncluded, true);
assert.equal(monthlyTotal(infinity, true), monthlyTotal(infinity, false), "included parking must not be double-counted");

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
assert.ok(units.filter((unit) => unit.building === "388 Beale").every((unit) => unit.listingUrl.includes("/leaseoll/floorplan/")));

console.log(`Validated ${units.length} units across ${new Set(units.map((unit) => unit.building)).size} active buildings.`);
