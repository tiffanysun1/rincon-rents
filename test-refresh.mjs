import assert from "node:assert/strict";
import {
  extractKnownUnitOverride,
  extractRentCafeUnitOverride,
  parseEquityAvailability,
  parseEssexAvailabilityText,
  reconcileEquityUnits,
  reconcileExactFeedUnits,
} from "./scripts/lib/refresh-core.mjs";

const fixture = `<script>ea5.unitAvailability = ${JSON.stringify({
  BedroomTypes: [
    { BedroomCount: 0, AvailableUnits: [{ UnitId: "217", FloorplanName: "Studio A", Floor: "Floor 2", Bed: 0, Bath: 1, SqFt: 482, BestTerm: { Price: 4410 }, AvailableDate: "8/2/2026" }] },
    { BedroomCount: 1, AvailableUnits: [{ UnitId: "712", FloorplanName: "1 Bedroom A", Floor: "Floor 7", Bed: 1, Bath: 1, SqFt: 738, BestTerm: { Price: 5590 }, AvailableDate: "8/9/2026" }] },
    { BedroomCount: 2, AvailableUnits: [{ UnitId: "3903", FloorplanName: "2 Bedroom S", Floor: "Floor 39", Bed: 2, Bath: 2, SqFt: 1118, BestTerm: { Price: 8700 }, AvailableDate: "8/14/2026" }] },
  ],
})};</script>`;

const parsed = parseEquityAvailability(fixture);
assert.equal(parsed.length, 3, "the complete structured feed should parse");

const baseline = [
  { id: "one", building: "340 Fremont", sourceUrl: "https://example.com", unit: "1 Bedroom A · floor 7", floor: 7, beds: 1, baths: 1, sqft: 738, rent: 5540 },
  { id: "two", building: "340 Fremont", sourceUrl: "https://example.com", unit: "2 Bedroom S · floor 39", floor: 39, beds: 2, baths: 2, sqft: 1118, rent: 8634 },
];
const reconciled = reconcileEquityUnits(baseline, parsed, new Date("2026-08-03T12:00:00-07:00"));
assert.equal(reconciled.matchedCount, 2);
assert.equal(reconciled.overrides.one.rent, 5590);
assert.equal(reconciled.overrides.two.rent, 8700);
assert.equal(reconciled.discoveredUnits.length, 0, "a studio must not be discovered into public data");

const generic = extractKnownUnitOverride(
  "Unit 305 is available 8/12/2026. Monthly rent is $5,225 for this 1 bedroom home.",
  { unit: "Unit 305 · Folsom", rent: 5095, moveIn: null, moveInLabel: "Confirm date" },
  new Date("2026-08-03T12:00:00-07:00"),
);
assert.equal(generic.rent, 5225);
assert.equal(generic.moveIn, "2026-08-12");

const essex = parseEssexAvailabilityText(`
Plan Sunset
Step 2
Starting base rent $5,069
Unit # 0314
1 Bed / 1 Bath
615 sq. ft.
Available as soon as:
09/05/2026
`);
assert.equal(essex.length, 1);
assert.equal(essex[0].sourceUnitId, "0314");
const essexResult = reconcileExactFeedUnits([
  { id: "500-0314", building: "500 Folsom", sourceUrl: "https://example.com", unit: "Unit 0314 · Plan Sunset", beds: 1, baths: 1, sqft: 615, rent: 5299 },
], essex, new Date("2026-08-03T12:00:00-07:00"));
assert.equal(essexResult.overrides["500-0314"].rent, 5069);
assert.equal(essexResult.discoveredUnits.length, 0);

const rentCafe = extractRentCafeUnitOverride(
  "32E $5,481 - $6,740 Now 26E $5,486 - $6,814 Aug 31",
  { unit: "Unit 32E · Plan E", rent: 5481, moveIn: null, moveInLabel: "Confirm date" },
  new Date("2026-08-03T12:00:00-07:00"),
);
assert.equal(rentCafe.rent, 5481);
assert.equal(rentCafe.moveIn, "08/03/2026".replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$1-$2"));

console.log("Validated fail-closed refresh parsing and studio exclusion.");
