import assert from "node:assert/strict";
import {
  extractKnownUnitOverride,
  extractRentCafeUnitOverride,
  parseCompassBuildingAvailability,
  parseEquityAvailability,
  parseEssexAvailabilityText,
  parseModeraAvailabilityCards,
  parseSolaireAvailability,
  parseSightMapAvailability,
  parseUdrAvailabilityCards,
  rentCafeListingUrlFromOnclick,
  reconcileEquityUnits,
  reconcileExactFeedUnits,
} from "./scripts/lib/refresh-core.mjs";

const fixture = `<a href="/UnitFees/29921/1/712">Unit 712 costs</a><script>ea5.unitAvailability = ${JSON.stringify({
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
assert.equal(reconciled.overrides.one.listingUrl, "https://www.equityapartments.com/UnitFees/29921/1/712");
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

const solaireFixture = `<script type="application/json" id="jd-fp-data-script-app">${JSON.stringify({
  units: [
    {
      apartment_number: "0509",
      floorplan_title: "09",
      bedrooms: "1",
      bathrooms: "1",
      square_feet: "610",
      available_date: "1789621200",
      permalink: "/floorplans/unit-exact-0509/",
      price_entity: { adjusted: { low_no_fees: "4868", low: "4899.06" } },
    },
    {
      apartment_number: "2411",
      floorplan_title: "11",
      bedrooms: "Studio",
      bathrooms: "1",
      square_feet: "441",
      available_date: "1789102800",
      permalink: "/floorplans/unit-studio-2411/",
      price_entity: { adjusted: { low_no_fees: "4901", low: "4932.06" } },
    },
  ],
})}</script>`;
const solaire = parseSolaireAvailability(solaireFixture);
assert.equal(solaire.length, 2);
assert.equal(solaire[0].fees, 31.06);
assert.equal(solaire[0].listingUrl, "https://solairesf.com/floorplans/unit-exact-0509/");
const solaireResult = reconcileExactFeedUnits([
  { id: "solaire-0509", building: "Solaire", sourceUrl: "https://solairesf.com/floorplans/", unit: "Unit 0509 · Plan 09", beds: 1, baths: 1, sqft: 610, rent: 4868 },
], solaire, new Date("2026-08-03T12:00:00-07:00"));
assert.equal(solaireResult.overrides["solaire-0509"].listingUrl, "https://solairesf.com/floorplans/unit-exact-0509/");
assert.equal(solaireResult.overrides["solaire-0509"].fees, 31.06);
assert.equal(solaireResult.discoveredUnits.length, 0, "Solaire studios must stay out of public data");

const sightMapFixture = `<script type="application/ld+json">${JSON.stringify({
  about: {
    containsPlace: [
      { name: "APT 0101", numberOfBedrooms: 0, numberOfBathroomsTotal: 1, floorSize: { value: 738 }, offers: { price: 4941.15, availabilityStarts: "2026-08-03" } },
      { name: "APT 1710", numberOfBedrooms: 1, numberOfBathroomsTotal: 1, floorSize: { value: 775 }, offers: { price: 5700, availabilityStarts: "2026-09-01" } },
    ],
  },
})}</script>`;
const jasper = parseSightMapAvailability(sightMapFixture, "https://www.rentjasper.com/community-map/");
assert.equal(jasper.length, 2);
assert.equal(jasper[0].beds, 0);
const jasperResult = reconcileExactFeedUnits(
  [{ id: "jasper-0101", building: "Jasper", sourceUrl: "https://www.rentjasper.com/community-map/", unit: "Unit 0101", beds: 0, baths: 1, sqft: 738, rent: 4941.15 }],
  jasper,
  new Date("2026-08-03T12:00:00-07:00"),
  { id: "jasper-template", building: "Jasper", sourceUrl: "https://www.rentjasper.com/community-map/", unit: "Unit template", beds: 1, baths: 1, sqft: 700, rent: 1, utilities: 235 },
);
assert.equal(jasperResult.discoveredUnits.length, 1, "a future non-studio Jasper home should be discovered");
assert.equal(jasperResult.discoveredUnits[0].id, "auto-jasper-1710");
assert.equal(jasperResult.discoveredUnits[0].beds, 1);

const compassFixture = `before "units":{"0":{"listings":[],"totalNumListings":0},"1":{"listings":[${JSON.stringify({
  location: { unitNumber: "717" },
  size: { bedrooms: 1, bathrooms: 1, squareFeet: 922 },
  localizedStatus: "Active",
  price: { lastKnown: 5545 },
  date: { lastStatusChange: 1785567600000 },
  navigationPageLink: "/homedetails/403-Main-St-Unit-717/1QPSD2_pid/",
})}],"totalNumListings":1}} after`;
const compass = parseCompassBuildingAvailability(compassFixture, "https://www.compass.com/building/403-main/");
assert.equal(compass.length, 1);
assert.equal(compass[0].sourceUnitId, "717");
assert.equal(compass[0].postedAt, "2026-08-01T07:00:00.000Z");
assert.equal(compass[0].listingUrl, "https://www.compass.com/homedetails/403-Main-St-Unit-717/1QPSD2_pid/");
const compassResult = reconcileExactFeedUnits([
  { id: "portside-717", building: "Portside", sourceUrl: "https://www.compass.com/building/403-main/", listingUrl: "old", unit: "Unit 717", beds: 1, baths: 1, sqft: 922, rent: 5545, moveIn: "2026-09-07", moveInLabel: "Sep 7" },
], compass, new Date("2026-08-02T22:00:00-07:00"));
assert.equal(compassResult.overrides["portside-717"].moveIn, "2026-09-07", "building refresh should preserve the detail-page move-in date");
assert.equal(compassResult.overrides["portside-717"].postedLabel, "Posted Aug 1, 2026");

const udr = parseUdrAvailabilityCards([
  {
    text: "Apartment 1516 1 Bed | 1 Bath | 825 Sq. Ft DETAILS Rent starting at: $6,072 at 13 month lease term Available Date: 8/6/2026 ALL-IN PRICE Floor: 15 Floor Plan: Plan A1C Deposit starting at: $775",
    listingUrl: "https://www.udr.com/leaseoll/floorplan/?unitid=53",
  },
  {
    text: "Apartment 999 Studio | 1 Bath | 450 Sq. Ft DETAILS Rent starting at: $4,000 Available Date: Now Floor Plan: Plan S1 Deposit starting at: $500",
    listingUrl: "https://www.udr.com/leaseoll/floorplan/?unitid=999",
  },
], new Date("2026-08-03T12:00:00-07:00"));
assert.equal(udr.length, 2);
assert.equal(udr[0].sourceUnitId, "1516");
assert.equal(udr[0].rent, 6072);
assert.equal(udr[0].moveIn, "2026-08-06");
assert.equal(udr[0].deposit, 775);
const udrResult = reconcileExactFeedUnits([
  { id: "388-1516", building: "388 Beale", sourceUrl: "https://www.udr.com/388", unit: "Unit 1516 · Plan A1C", beds: 1, baths: 1, sqft: 825, rent: 6072 },
], udr, new Date("2026-08-03T12:00:00-07:00"));
assert.equal(udrResult.overrides["388-1516"].listingUrl, "https://www.udr.com/leaseoll/floorplan/?unitid=53");
assert.equal(udrResult.overrides["388-1516"].deposit, 775);
assert.equal(udrResult.discoveredUnits.length, 0, "UDR studios must stay out of public data");

const modera = parseModeraAvailabilityCards([
  {
    text: "A03 Beds / Baths 1 bd / 1 ba Rent Total Monthly Leasing Price Starting from $4,249 Calculate Deposit $500 Sq. Ft 581+ Only One Left! Details",
    listingUrl: "https://www.moderarinconhill.com/floorplans/a03/",
  },
  {
    text: "S01 Beds / Baths Studio / 1 ba Rent Total Monthly Leasing Price Starting from $4,453 Calculate Deposit $500 Sq. Ft 336+ Available Aug 17, 2026 Details",
    listingUrl: "https://www.moderarinconhill.com/floorplans/s01/",
  },
]);
assert.equal(modera.length, 2);
assert.equal(modera[0].sourceUnitId, "A03");
assert.equal(modera[0].rent, 4249);
assert.equal(modera[0].sqft, 581);
const moderaResult = reconcileExactFeedUnits([
  { id: "modera-a03", building: "Modera Rincon Hill", sourceUrl: "https://www.moderarinconhill.com/", unit: "Plan A03 · 1 left", beds: 1, baths: 1, sqft: 581, rent: 4249 },
], modera, new Date("2026-08-03T12:00:00-07:00"));
assert.equal(moderaResult.overrides["modera-a03"].unit, "Plan A03");
assert.equal(moderaResult.overrides["modera-a03"].listingUrl, "https://www.moderarinconhill.com/floorplans/a03/");
assert.equal(moderaResult.discoveredUnits.length, 0, "Modera studios must stay out of public data");

const rentCafe = extractRentCafeUnitOverride(
  "32E $5,481 - $6,740 Now 26E $5,486 - $6,814 Aug 31",
  { unit: "Unit 32E · Plan E", rent: 5481, moveIn: null, moveInLabel: "Confirm date" },
  new Date("2026-08-03T12:00:00-07:00"),
);
assert.equal(rentCafe.rent, 5481);
assert.equal(rentCafe.moveIn, "08/03/2026".replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$1-$2"));
assert.equal(
  rentCafeListingUrlFromOnclick("RCILS.Lib.openApplyNow('https://www.rentcafe.com/apply?UnitID=42\\u0026FloorPlanID=9', 1)"),
  "https://www.rentcafe.com/apply?UnitID=42&FloorPlanID=9",
);

console.log("Validated fail-closed refresh parsing and studio exclusion.");
