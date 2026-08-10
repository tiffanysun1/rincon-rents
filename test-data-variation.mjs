import assert from "node:assert/strict";
import { units } from "./data.js";
import { validateSnapshot } from "./test-data.mjs";

const template = units[0];
assert.ok(template, "the checked-in snapshot must provide a template for the variation regression");

const withoutDynamicBuildings = units.filter((unit) => unit.building !== "Avery 450" && unit.building !== "Solaire");
const averyUnits = Array.from({ length: 3 }, (_, index) => ({
  ...template,
  id: `regression-avery-${index + 1}`,
  building: "Avery 450",
  address: "450 Folsom St",
  unit: `Unit A${index + 1}`,
  sourceType: "official",
  sourceUrl: "https://www.relatedrentals.com/apartment-rentals/san-francisco/soma/avery-450",
  listingUrl: `https://www.relatedrentals.com/apartment-rentals/san-francisco/soma/avery-450/regression-${index + 1}`,
}));
const solaireUnits = Array.from({ length: 10 }, (_, index) => ({
  ...template,
  id: `regression-solaire-${index + 1}`,
  building: "Solaire",
  address: "299 Fremont St",
  unit: `Unit S${index + 1}`,
  sourceType: "official",
  sourceUrl: "https://solairesf.com/floorplans/",
  listingUrl: `https://solairesf.com/floorplans/unit-regression-${index + 1}/`,
}));
const changingInventory = [...withoutDynamicBuildings, ...averyUnits, ...solaireUnits];

const result = validateSnapshot({ inventory: changingInventory });
assert.equal(changingInventory.filter((unit) => unit.building === "Avery 450").length, 3);
assert.equal(changingInventory.filter((unit) => unit.building === "Solaire").length, 10);
console.log(`Validated changing live inventory with 3 Avery and 10 Solaire homes (${result.unitCount} total).`);
