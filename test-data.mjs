import assert from "node:assert/strict";
import { units, sourceUnits, monitoredBuildings, snapshotMetadata, monthlyTotal, upfrontTotal } from "./data.js";

assert.equal(sourceUnits.length, 75, "the researched baseline should retain all 75 source offers");
assert.equal(units.length, 63, "the public snapshot should contain 63 non-studio offers");
assert.equal(new Set(units.map((unit) => unit.id)).size, units.length, "unit ids must be unique");
assert.equal(new Set(units.map((unit) => unit.building)).size, 10, "active non-studio units should cover ten buildings");
assert.equal(monitoredBuildings.length, 6, "six additional buildings should remain visible in coverage");
assert.ok(units.every((unit) => unit.beds >= 1), "studios must never reach the public inventory");
assert.equal(units.filter((unit) => unit.building === "500 Folsom").length, 15);
assert.equal(units.filter((unit) => unit.building === "Spera").length, 13);
assert.ok(!Number.isNaN(new Date(snapshotMetadata.dataUpdatedAt).valueOf()), "the displayed update timestamp must be valid");

for (const unit of units) {
  assert.ok(unit.building && unit.address && unit.unit, `${unit.id} must identify its home`);
  assert.ok(unit.rent > 0, `${unit.id} must have a positive advertised price`);
  assert.ok(unit.utilities >= 0 && unit.fees >= 0 && unit.insurance >= 0, `${unit.id} has invalid monthly costs`);
  assert.ok(unit.sourceUrl.startsWith("https://"), `${unit.id} must link to its source`);
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
}

const infinity = units.find((unit) => unit.id === "infinity-6b");
assert.equal(infinity.parkingIncluded, true);
assert.equal(monthlyTotal(infinity, true), monthlyTotal(infinity, false), "included parking must not be double-counted");

const fremont = units.find((unit) => unit.id === "340-1a-f7");
assert.equal(monthlyTotal(fremont, true), 6265, "340 Fremont should add modeled recurring costs and parking once");

console.log(`Validated ${units.length} units across ${new Set(units.map((unit) => unit.building)).size} active buildings.`);
