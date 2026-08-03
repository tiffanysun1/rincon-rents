import { refreshState } from "./refresh-state.js";

const URLS = {
  fremont340: "https://www.equityapartments.com/san-francisco/rincon-hill/340-fremont-apartments",
  modera: "https://www.moderarinconhill.com/san-francisco-ca-apartments/modera-rincon-hill/conventional/",
  moderaFees: "https://www.moderarinconhill.com/san-francisco-ca-apartments/modera-rincon-hill/faqs/",
  fremont333: "https://www.333fremont.com/san-francisco/333-fremont/conventional/",
  folsom500: "https://www.essexapartmenthomes.com/apartments/san-francisco/500-folsom/floor-plans-and-pricing",
  spera: "https://www.rentcafe.com/apartments/ca/san-francisco/spera/default.aspx",
  solaire: "https://www.zillow.com/apartments/san-francisco-ca/solaire/65g7KK/",
  jasper: "https://www.zillow.com/apartments/san-francisco-ca/jasper/5Yy5Rt/",
  beale388: "https://www.zillow.com/apartments/san-francisco-ca/388-beale/5XjQ4f/",
  beale388Fees: "https://www.udr.com/generatepdf/apartmentexpenses?pid=37412",
  fremont399: "https://www.udr.com/san-francisco-bay-area-apartments/san-francisco/399-fremont/apartments-pricing/",
  bridgeview1501: "https://www.zillow.com/homedetails/400-Beale-St-APT-1501-San-Francisco-CA-94105/80734962_zpid/",
  infinity6b: "https://www.zillow.com/homedetails/318-Spear-St-UNIT-6B-San-Francisco-CA-94105/89236508_zpid/",
  metropolitan2405: "https://www.zillow.com/homedetails/355-1st-St-UNIT-S2405-San-Francisco-CA-94105/64971613_zpid/",
  metropolitan902: "https://www.zillow.com/homedetails/355-1st-St-UNIT-S902-San-Francisco-CA-94105/2089159962_zpid/",
};

const checkedToday = "Checked Aug 2, 2026";

function managed(overrides) {
  return {
    sourceType: "official",
    sourceLabel: "Building website",
    postedLabel: "Post date not published",
    checkedLabel: checkedToday,
    confidence: "High",
    leaseTerm: "12 months",
    parkingIncluded: false,
    utilitiesIncluded: [],
    amenities: ["In-unit laundry", "Fitness center"],
    applicationFee: 65,
    moveInFee: 0,
    ...overrides,
  };
}

function zillowBuilding(overrides) {
  return managed({
    sourceType: "zillow-building",
    sourceLabel: "Zillow building feed",
    checkedLabel: "Checked Jul 28–Aug 2, 2026",
    confidence: "Medium",
    ...overrides,
  });
}

function propertyFeed(overrides) {
  return managed({
    sourceType: "property-feed",
    sourceLabel: "Property listing feed",
    confidence: "Medium",
    ...overrides,
  });
}

function condo(overrides) {
  return {
    sourceType: "zillow-condo",
    sourceLabel: "Zillow condo listing",
    checkedLabel: checkedToday,
    confidence: "High",
    leaseTerm: "12 months",
    fees: 0,
    insurance: 18,
    parkingIncluded: false,
    applicationFee: 35,
    moveInFee: 0,
    amenities: ["In-unit laundry", "Concierge"],
    ...overrides,
  };
}

const researchedUnits = [
  // 340 Fremont — all seven offers exposed by the building site on Aug 2.
  managed({ id: "340-a-f2", building: "340 Fremont", address: "340 Fremont St", unit: "Plan A · floor 2", beds: 0, baths: 1, sqft: 482, rent: 4410, fees: 35, utilities: 205, insurance: 15, parking: 450, parkingConfidence: "Estimated — confirm", moveIn: "2026-08-02", moveInLabel: "Available now", floor: 2, sourceUrl: URLS.fremont340, deposit: 500, listedPriceLabel: "Base rent · 12 mo", pricingNote: "Building price is confirmed. Utilities, recurring services, insurance and parking are modeled estimates because the property does not publish a complete fee sheet on this page.", amenities: ["In-unit laundry", "24-hour concierge", "Rooftop terrace"] }),
  managed({ id: "340-g-f2", building: "340 Fremont", address: "340 Fremont St", unit: "Plan G · floor 2", beds: 0, baths: 1, sqft: 538, rent: 4466, fees: 35, utilities: 205, insurance: 15, parking: 450, parkingConfidence: "Estimated — confirm", moveIn: "2026-08-02", moveInLabel: "Available now", floor: 2, sourceUrl: URLS.fremont340, deposit: 500, listedPriceLabel: "Base rent · 12 mo", pricingNote: "Building price and date are confirmed; non-rent costs are modeled until leasing supplies an itemized quote.", amenities: ["In-unit laundry", "24-hour concierge", "Rooftop terrace"] }),
  managed({ id: "340-d-f6", building: "340 Fremont", address: "340 Fremont St", unit: "Plan D · floor 6", beds: 0, baths: 1, sqft: 550, rent: 4671, fees: 35, utilities: 205, insurance: 15, parking: 450, parkingConfidence: "Estimated — confirm", moveIn: "2026-08-04", moveInLabel: "Aug 4", floor: 6, sourceUrl: URLS.fremont340, deposit: 500, listedPriceLabel: "Base rent · 12 mo", pricingNote: "Building price and date are confirmed; non-rent costs are modeled until leasing supplies an itemized quote.", amenities: ["In-unit laundry", "24-hour concierge", "Rooftop terrace"] }),
  managed({ id: "340-i-f2", building: "340 Fremont", address: "340 Fremont St", unit: "Plan I · floor 2", beds: 0, baths: 1, sqft: 635, rent: 4507, fees: 35, utilities: 205, insurance: 15, parking: 450, parkingConfidence: "Estimated — confirm", moveIn: "2026-08-12", moveInLabel: "Aug 12", floor: 2, sourceUrl: URLS.fremont340, deposit: 500, listedPriceLabel: "Base rent · 12 mo", pricingNote: "Building price and date are confirmed; non-rent costs are modeled until leasing supplies an itemized quote.", amenities: ["In-unit laundry", "24-hour concierge", "Rooftop terrace"] }),
  managed({ id: "340-m-f37", building: "340 Fremont", address: "340 Fremont St", unit: "Plan M · floor 37", beds: 0, baths: 1, sqft: 518, rent: 5514, fees: 35, utilities: 205, insurance: 15, parking: 450, parkingConfidence: "Estimated — confirm", moveIn: "2026-08-18", moveInLabel: "Aug 18", floor: 37, sourceUrl: URLS.fremont340, deposit: 500, listedPriceLabel: "Base rent · 12 mo", pricingNote: "Bay/Bridge-view premium is reflected in rent. Non-rent costs are modeled estimates.", amenities: ["Bay & Bridge view", "In-unit laundry", "Rooftop terrace"] }),
  managed({ id: "340-1a-f7", building: "340 Fremont", address: "340 Fremont St", unit: "1 Bedroom A · floor 7", beds: 1, baths: 1, sqft: 738, rent: 5540, fees: 35, utilities: 225, insurance: 15, parking: 450, parkingConfidence: "Estimated — confirm", moveIn: "2026-08-02", moveInLabel: "Available now", floor: 7, sourceUrl: URLS.fremont340, deposit: 500, listedPriceLabel: "Base rent · 12 mo", pricingNote: "Building price and date are confirmed; non-rent costs are modeled until leasing supplies an itemized quote.", amenities: ["In-unit laundry", "24-hour concierge", "Rooftop terrace"] }),
  managed({ id: "340-2s-f39", building: "340 Fremont", address: "340 Fremont St", unit: "2 Bedroom S · floor 39", beds: 2, baths: 2, sqft: 1118, rent: 8634, fees: 35, utilities: 285, insurance: 15, parking: 450, parkingConfidence: "Estimated — confirm", moveIn: "2026-08-14", moveInLabel: "Aug 14", floor: 39, sourceUrl: URLS.fremont340, deposit: 500, listedPriceLabel: "Base rent · 12 mo", pricingNote: "Building price and date are confirmed; non-rent costs are modeled until leasing supplies an itemized quote.", amenities: ["Sunset view", "Balcony", "In-unit laundry"] }),

  // Modera — the source exposes floor-plan offers, not apartment numbers.
  managed({ id: "modera-s01", building: "Modera Rincon Hill", address: "390 1st St", unit: "Plan S01", beds: 0, baths: 1, sqft: 336, rent: 4453, fees: 0, utilities: 210, insurance: 0, parking: 480, parkingConfidence: "Confirmed starting price", moveIn: "2026-08-17", moveInLabel: "Aug 17", sourceUrl: URLS.modera, costSourceUrl: URLS.moderaFees, deposit: 500, listedPriceLabel: "Property total monthly price", pricingNote: "The advertised figure is the property's total monthly leasing price. We add estimated usage-based utilities and confirmed $480 parking; the $20 liability waiver should already be represented in the listed total.", amenities: ["Smart thermostat", "In-unit laundry", "Controlled access"] }),
  managed({ id: "modera-s02", building: "Modera Rincon Hill", address: "390 1st St", unit: "Plan S02 · 1 left", beds: 0, baths: 1, sqft: 358, rent: 4244, fees: 0, utilities: 210, insurance: 0, parking: 480, parkingConfidence: "Confirmed starting price", moveIn: null, moveInLabel: "Confirm date", sourceUrl: URLS.modera, costSourceUrl: URLS.moderaFees, deposit: 500, listedPriceLabel: "Property total monthly price", pricingNote: "One home was shown, but the property did not expose its apartment number or move-in date. Utilities are estimated; parking starts at $480.", amenities: ["Smart thermostat", "In-unit laundry", "Controlled access"] }),
  managed({ id: "modera-s07", building: "Modera Rincon Hill", address: "390 1st St", unit: "Plan S07 · 1 left", beds: 0, baths: 1, sqft: 454, rent: 4404, fees: 0, utilities: 210, insurance: 0, parking: 480, parkingConfidence: "Confirmed starting price", moveIn: null, moveInLabel: "Confirm date", sourceUrl: URLS.modera, costSourceUrl: URLS.moderaFees, deposit: 500, listedPriceLabel: "Property total monthly price", pricingNote: "One home was shown, but the property did not expose its apartment number or move-in date. Utilities are estimated; parking starts at $480.", amenities: ["Smart thermostat", "In-unit laundry", "Controlled access"] }),
  managed({ id: "modera-a03", building: "Modera Rincon Hill", address: "390 1st St", unit: "Plan A03 · 1 left", beds: 1, baths: 1, sqft: 581, rent: 4249, fees: 0, utilities: 235, insurance: 0, parking: 480, parkingConfidence: "Confirmed starting price", moveIn: null, moveInLabel: "Confirm date", sourceUrl: URLS.modera, costSourceUrl: URLS.moderaFees, deposit: 500, listedPriceLabel: "Property total monthly price", pricingNote: "The source shows at least 581 sq ft and one remaining home, without an apartment number or date.", amenities: ["Smart thermostat", "In-unit laundry", "Controlled access"] }),
  managed({ id: "modera-a04", building: "Modera Rincon Hill", address: "390 1st St", unit: "Plan A04 · 1 left", beds: 1, baths: 1, sqft: 673, rent: 4568, fees: 0, utilities: 235, insurance: 0, parking: 480, parkingConfidence: "Confirmed starting price", moveIn: null, moveInLabel: "Confirm date", sourceUrl: URLS.modera, costSourceUrl: URLS.moderaFees, deposit: 500, listedPriceLabel: "Property total monthly price", pricingNote: "The source shows one remaining home, without an apartment number or date.", amenities: ["Smart thermostat", "In-unit laundry", "Controlled access"] }),
  managed({ id: "modera-a10", building: "Modera Rincon Hill", address: "390 1st St", unit: "Plan A10 · 1 left", beds: 1, baths: 1, sqft: 508, rent: 4643, fees: 0, utilities: 235, insurance: 0, parking: 480, parkingConfidence: "Confirmed starting price", moveIn: null, moveInLabel: "Confirm date", sourceUrl: URLS.modera, costSourceUrl: URLS.moderaFees, deposit: 500, listedPriceLabel: "Property total monthly price", pricingNote: "The source shows at least 508 sq ft and one remaining home, without an apartment number or date.", amenities: ["Smart thermostat", "In-unit laundry", "Controlled access"] }),
  managed({ id: "modera-b03", building: "Modera Rincon Hill", address: "390 1st St", unit: "Plan B03", beds: 2, baths: 2, sqft: 914, rent: 8003, fees: 0, utilities: 285, insurance: 0, parking: 480, parkingConfidence: "Confirmed starting price", moveIn: "2026-08-08", moveInLabel: "Aug 8", sourceUrl: URLS.modera, costSourceUrl: URLS.moderaFees, deposit: 500, listedPriceLabel: "Property total monthly price", pricingNote: "The advertised figure includes required monthly charges; utilities are usage-based and modeled separately.", amenities: ["Smart thermostat", "In-unit laundry", "Controlled access"] }),
  managed({ id: "modera-b04", building: "Modera Rincon Hill", address: "390 1st St", unit: "Plan B04 · 1 left", beds: 2, baths: 1, sqft: 892, rent: 8110, fees: 0, utilities: 285, insurance: 0, parking: 480, parkingConfidence: "Confirmed starting price", moveIn: null, moveInLabel: "Confirm date", sourceUrl: URLS.modera, costSourceUrl: URLS.moderaFees, deposit: 500, listedPriceLabel: "Property total monthly price", pricingNote: "One home was shown, but the property did not expose its apartment number or move-in date.", amenities: ["Smart thermostat", "In-unit laundry", "Controlled access"] }),
  managed({ id: "modera-b06", building: "Modera Rincon Hill", address: "390 1st St", unit: "Plan B06 · 1 left", beds: 2, baths: 2, sqft: 957, rent: 8182, fees: 0, utilities: 285, insurance: 0, parking: 480, parkingConfidence: "Confirmed starting price", moveIn: null, moveInLabel: "Confirm date", sourceUrl: URLS.modera, costSourceUrl: URLS.moderaFees, deposit: 500, listedPriceLabel: "Property total monthly price", pricingNote: "One home was shown, but the property did not expose its apartment number or move-in date.", amenities: ["Smart thermostat", "In-unit laundry", "Controlled access"] }),
  managed({ id: "modera-b08", building: "Modera Rincon Hill", address: "390 1st St", unit: "Plan B08", beds: 2, baths: 2, sqft: 988, rent: 7700, fees: 0, utilities: 285, insurance: 0, parking: 480, parkingConfidence: "Confirmed starting price", moveIn: "2026-08-08", moveInLabel: "Aug 8", sourceUrl: URLS.modera, costSourceUrl: URLS.moderaFees, deposit: 500, listedPriceLabel: "Property total monthly price", pricingNote: "The advertised figure includes required monthly charges; utilities are usage-based and modeled separately.", amenities: ["Smart thermostat", "In-unit laundry", "Controlled access"] }),

  // 333 Fremont — six exact unit numbers currently exposed.
  managed({ id: "333-305", building: "333 Fremont", address: "333 Fremont St", unit: "Unit 305 · Folsom", beds: 1, baths: 1, sqft: 691, rent: 5095, fees: 49, utilities: 220, insurance: 15, parking: 450, parkingConfidence: "Estimated — contact property", moveIn: "2026-07-29", moveInLabel: "Available now", floor: 3, sourceUrl: URLS.fremont333, deposit: 1500, listedPriceLabel: "Property total shown", pricingNote: "The building separately discloses about $22–32 resident services, $10–13 pest control, $4.15 billing and a $220 historical-mean utility bill. Parking price is not published, so $450 is a neighborhood estimate.", amenities: ["Walk-in closet", "In-unit laundry", "Doorman"] }),
  managed({ id: "333-311", building: "333 Fremont", address: "333 Fremont St", unit: "Unit 311 · Delancy 1", beds: 1, baths: 1, sqft: 740, rent: 5345, fees: 49, utilities: 220, insurance: 15, parking: 450, parkingConfidence: "Estimated — contact property", moveIn: "2026-07-30", moveInLabel: "Available now", floor: 3, sourceUrl: URLS.fremont333, deposit: 1500, listedPriceLabel: "Property total shown", pricingNote: "Published recurring-cost ranges are included in our estimate. Parking remains a modeled amount pending a quote.", amenities: ["In-unit laundry", "Doorman", "Fitness center"] }),
  managed({ id: "333-806", building: "333 Fremont", address: "333 Fremont St", unit: "Unit 806 · Howard 1", beds: 1, baths: 1, sqft: 681, rent: 5895, fees: 49, utilities: 220, insurance: 15, parking: 450, parkingConfidence: "Estimated — contact property", moveIn: null, moveInLabel: "Confirm date", floor: 8, sourceUrl: URLS.fremont333, deposit: 1500, listedPriceLabel: "Property total shown", pricingNote: "The source exposes the unit and price but not a date in the current aggregate view. Published recurring-cost ranges are included.", amenities: ["In-unit laundry", "Doorman", "Fitness center"] }),
  managed({ id: "333-702", building: "333 Fremont", address: "333 Fremont St", unit: "Unit 702 · Stevenson", beds: 1, baths: 1, sqft: 724, rent: 6645, fees: 49, utilities: 220, insurance: 15, parking: 450, parkingConfidence: "Estimated — contact property", moveIn: null, moveInLabel: "Confirm date", floor: 7, sourceUrl: URLS.fremont333, deposit: 1500, listedPriceLabel: "Property total shown", pricingNote: "The source exposes the unit and price but not a date in the current aggregate view. Published recurring-cost ranges are included.", amenities: ["In-unit laundry", "Doorman", "Fitness center"] }),
  managed({ id: "333-208", building: "333 Fremont", address: "333 Fremont St", unit: "Unit 208 · Main", beds: 2, baths: 2, sqft: 1193, rent: 8049, fees: 49, utilities: 220, insurance: 15, parking: 450, parkingConfidence: "Estimated — contact property", moveIn: "2026-08-17", moveInLabel: "Aug 17", floor: 2, sourceUrl: URLS.fremont333, deposit: 1500, listedPriceLabel: "Property total shown", pricingNote: "Published recurring-cost ranges are included in our estimate. Parking remains a modeled amount pending a quote.", amenities: ["Walk-in closet", "Premium upgrade", "In-unit laundry"] }),
  managed({ id: "333-609", building: "333 Fremont", address: "333 Fremont St", unit: "Unit 609 · King", beds: 2, baths: 2, sqft: 1095, rent: 8324, fees: 49, utilities: 220, insurance: 15, parking: 450, parkingConfidence: "Estimated — contact property", moveIn: "2026-08-24", moveInLabel: "Aug 24", floor: 6, sourceUrl: URLS.fremont333, deposit: 1500, listedPriceLabel: "Property total shown", pricingNote: "Published recurring-cost ranges are included in our estimate. Parking remains a modeled amount pending a quote.", amenities: ["Bridge view", "Large balcony", "Premium upgrade"] }),

  // 500 Folsom — exact non-studio units from the official Essex availability steps.
  ...[
    ["1702", "Sunset", 1, 1, 637, 5427, "2026-08-27", "Aug 27"],
    ["0314", "Sunset", 1, 1, 615, 5069, "2026-09-05", "Sep 5"],
    ["2306", "Sunset", 1, 1, 645, 5429, "2026-09-19", "Sep 19"],
    ["2906", "Sunset", 1, 1, 619, 5409, "2026-09-28", "Sep 28"],
    ["1104", "Golden Gate", 1, 1, 636, 5397, "2026-08-08", "Aug 8"],
    ["2012", "Pacific", 1, 1, 724, 5667, "2026-08-02", "Available now"],
    ["1212", "Pacific", 1, 1, 699, 5549, "2026-08-31", "Aug 31"],
    ["0322", "Castro", 1, 1, 855, 5647, "2026-08-02", "Available now"],
    ["0419", "North Beach", 1, 1, 918, 5717, "2026-08-02", "Available now"],
    ["1203", "Presidio", 1, 1, 813, 6197, "2026-08-02", "Available now"],
    ["2803", "Presidio", 1, 1, 810, 6357, "2026-08-02", "Available now"],
    ["2211", "Presidio", 1, 1, 769, 6277, "2026-09-03", "Sep 3"],
    ["2003", "Ashbury", 1, 1, 879, 6387, "2026-08-02", "Available now"],
    ["1611", "Ashbury", 1, 1, 841, 6447, "2026-08-02", "Available now"],
    ["1803", "Ashbury", 1, 1, 879, 6607, "2026-08-02", "Available now"],
  ].map(([number, plan, beds, baths, sqft, rent, moveIn, moveInLabel]) => managed({
    id: `500-${number}`,
    building: "500 Folsom",
    address: "500 Folsom St",
    unit: `Unit ${number} · Plan ${plan}`,
    beds,
    baths,
    sqft,
    rent,
    fees: 6,
    utilities: 235,
    insurance: 15,
    parking: 450,
    parkingConfidence: "Estimated — confirm with Essex",
    moveIn,
    moveInLabel,
    floor: Number(String(number).slice(0, -2)),
    sourceUrl: URLS.folsom500,
    deposit: 500,
    listedPriceLabel: "Official starting base rent",
    pricingNote: "The official unit page discloses a $6.11 monthly utility service fee plus usage-based utilities. Utilities, insurance, and parking are modeled until Essex supplies a complete quote.",
    amenities: ["In-unit laundry", "24-hour concierge", "Rooftop terraces"],
  })),

  // Spera — exact unit rows and lower-bound base rents from its RentCafe property feed.
  ...[
    ["32E", "E", 1, 1, 503, 5481, "2026-08-02", "Available now"],
    ["26E", "E", 1, 1, 503, 5486, "2026-08-31", "Aug 31"],
    ["32J", "J", 1, 1, 601, 5673, "2026-08-02", "Available now"],
    ["30J", "J", 1, 1, 601, 5713, "2026-08-05", "Aug 5"],
    ["30I", "I", 1, 1, 480, 5496, "2026-08-24", "Aug 24"],
    ["03H", "H", 1, 1, 487, 4886, "2026-08-19", "Aug 19"],
    ["08H", "H", 1, 1, 487, 5012, "2026-09-01", "Sep 1"],
    ["08B", "B", 1, 1, 569, 5212, "2026-08-03", "Aug 3"],
    ["32G", "G", 1, 1, 591, 5743, "2026-08-18", "Aug 18"],
    ["19G", "G", 1, 1, 591, 5393, "2026-08-31", "Aug 31"],
    ["23F", "F", 1, 1, 648, 6232, "2026-08-19", "Aug 19"],
    ["PH33C", "Penthouse C", 2, 2, 2103, 16733, "2026-08-19", "Aug 19"],
    ["PH34C", "Penthouse C", 2, 2, 2103, 16833, "2026-09-03", "Sep 3"],
  ].map(([number, plan, beds, baths, sqft, rent, moveIn, moveInLabel]) => propertyFeed({
    id: `spera-${number.toLowerCase()}`,
    building: "Spera",
    address: "39 Tehama St",
    unit: `Unit ${number} · Plan ${plan}`,
    beds,
    baths,
    sqft,
    rent,
    fees: 35,
    utilities: beds === 2 ? 285 : 235,
    insurance: 15,
    parking: 450,
    parkingConfidence: "Estimated — price not published",
    moveIn,
    moveInLabel,
    sourceUrl: URLS.spera,
    deposit: 1200,
    applicationFee: 65,
    listedPriceLabel: "Base-rent range minimum",
    pricingNote: "The property feed publishes a base-rent range for each unit. The lower bound is shown; recurring fees, utilities, insurance, and garage parking remain modeled estimates.",
    amenities: ["In-unit laundry", "Garage", "Rooftop deck"],
  })),

  // Solaire — Zillow property feed includes required monthly fees in the shown price.
  zillowBuilding({ id: "solaire-202", building: "Solaire", address: "299 Fremont St", unit: "Unit 202", beds: 1, baths: 1, sqft: 513, rent: 4602, fees: 0, utilities: 235, insurance: 15, parking: 450, parkingConfidence: "Estimated — price not public", moveIn: "2026-08-18", moveInLabel: "Aug 18", sourceUrl: URLS.solaire, deposit: 500, listedPriceLabel: "Total monthly price", pricingNote: "Zillow says required fixed monthly fees are included. Usage-based utilities, insurance and parking remain separate estimates.", amenities: ["In-unit laundry", "Pool", "Pet friendly"] }),
  zillowBuilding({ id: "solaire-2601", building: "Solaire", address: "299 Fremont St", unit: "Unit 2601", beds: 0, baths: 1, sqft: 580, rent: 5173, fees: 0, utilities: 210, insurance: 15, parking: 450, parkingConfidence: "Estimated — price not public", moveIn: "2026-08-30", moveInLabel: "Aug 30", sourceUrl: URLS.solaire, deposit: 500, listedPriceLabel: "Total monthly price", pricingNote: "Required fixed monthly fees are included in the Zillow total; variable utilities and parking are modeled.", amenities: ["In-unit laundry", "Pool", "Pet friendly"] }),
  zillowBuilding({ id: "solaire-2303", building: "Solaire", address: "299 Fremont St", unit: "Unit 2303", beds: 1, baths: 1, sqft: 511, rent: 5437, fees: 0, utilities: 235, insurance: 15, parking: 450, parkingConfidence: "Estimated — price not public", moveIn: "2026-09-12", moveInLabel: "Sep 12", sourceUrl: URLS.solaire, deposit: 500, listedPriceLabel: "Total monthly price", pricingNote: "Required fixed monthly fees are included in the Zillow total; variable utilities and parking are modeled.", amenities: ["In-unit laundry", "Pool", "Pet friendly"] }),
  zillowBuilding({ id: "solaire-2609", building: "Solaire", address: "299 Fremont St", unit: "Unit 2609", beds: 1, baths: 1, sqft: 610, rent: 5497, fees: 0, utilities: 235, insurance: 15, parking: 450, parkingConfidence: "Estimated — price not public", moveIn: "2026-08-02", moveInLabel: "Available now", sourceUrl: URLS.solaire, deposit: 500, listedPriceLabel: "Total monthly price", pricingNote: "Required fixed monthly fees are included in the Zillow total; variable utilities and parking are modeled.", amenities: ["In-unit laundry", "Pool", "Pet friendly"] }),
  zillowBuilding({ id: "solaire-2802", building: "Solaire", address: "299 Fremont St", unit: "Unit 2802", beds: 1, baths: 1, sqft: 513, rent: 5504, fees: 0, utilities: 235, insurance: 15, parking: 450, parkingConfidence: "Estimated — price not public", moveIn: "2026-08-24", moveInLabel: "Aug 24", sourceUrl: URLS.solaire, deposit: 500, listedPriceLabel: "Total monthly price", pricingNote: "Required fixed monthly fees are included in the Zillow total; variable utilities and parking are modeled.", amenities: ["In-unit laundry", "Pool", "Pet friendly"] }),
  zillowBuilding({ id: "solaire-3103", building: "Solaire", address: "299 Fremont St", unit: "Unit 3103", beds: 1, baths: 1, sqft: 511, rent: 5677, fees: 0, utilities: 235, insurance: 15, parking: 450, parkingConfidence: "Estimated — price not public", moveIn: "2026-09-06", moveInLabel: "Sep 6", sourceUrl: URLS.solaire, deposit: 500, listedPriceLabel: "Total monthly price", pricingNote: "Required fixed monthly fees are included in the Zillow total; variable utilities and parking are modeled.", amenities: ["In-unit laundry", "Pool", "Pet friendly"] }),
  zillowBuilding({ id: "solaire-3202", building: "Solaire", address: "299 Fremont St", unit: "Unit 3202", beds: 1, baths: 1, sqft: 513, rent: 5877, fees: 0, utilities: 235, insurance: 15, parking: 450, parkingConfidence: "Estimated — price not public", moveIn: "2026-08-02", moveInLabel: "Available now", sourceUrl: URLS.solaire, deposit: 500, listedPriceLabel: "Total monthly price", pricingNote: "Required fixed monthly fees are included in the Zillow total; variable utilities and parking are modeled.", amenities: ["In-unit laundry", "Pool", "Pet friendly"] }),

  // Jasper — total monthly prices from the live property feed.
  zillowBuilding({ id: "jasper-2507", building: "Jasper", address: "45 Lansing St", unit: "Unit 2507", beds: 0, baths: 1, sqft: 598, rent: 4725, fees: 0, utilities: 210, insurance: 15, parking: 500, parkingConfidence: "Estimated valet rate", moveIn: "2026-08-30", moveInLabel: "Aug 30", sourceUrl: URLS.jasper, deposit: 500, listedPriceLabel: "Total monthly price", pricingNote: "Required fixed monthly fees are included in the source total. Usage-based utilities, insurance and valet parking are modeled separately.", amenities: ["Valet parking", "In-unit laundry", "Fitness center"] }),
  zillowBuilding({ id: "jasper-2406", building: "Jasper", address: "45 Lansing St", unit: "Unit 2406", beds: 0, baths: 1, sqft: 611, rent: 4935, fees: 0, utilities: 210, insurance: 15, parking: 500, parkingConfidence: "Estimated valet rate", moveIn: "2026-08-14", moveInLabel: "Aug 14", sourceUrl: URLS.jasper, deposit: 500, listedPriceLabel: "Total monthly price", pricingNote: "Required fixed monthly fees are included in the source total. Usage-based utilities, insurance and valet parking are modeled separately.", amenities: ["Valet parking", "In-unit laundry", "Fitness center"] }),
  zillowBuilding({ id: "jasper-101", building: "Jasper", address: "45 Lansing St", unit: "Unit 101", beds: 0, baths: 1, sqft: 738, rent: 5260, fees: 0, utilities: 210, insurance: 15, parking: 500, parkingConfidence: "Estimated valet rate", moveIn: "2026-08-02", moveInLabel: "Available now", sourceUrl: URLS.jasper, deposit: 500, listedPriceLabel: "Total monthly price", pricingNote: "Required fixed monthly fees are included in the source total. Usage-based utilities, insurance and valet parking are modeled separately.", amenities: ["Valet parking", "In-unit laundry", "Fitness center"] }),

  // 388 Beale — all ten units in the current building feed, with official UDR expenses.
  ...[
    ["1516", 1, 1, 825, 6072, "2026-08-06", "Aug 6"],
    ["1013", 1, 1, 808, 6193, "2026-09-03", "Sep 3"],
    ["1206", 1, 1, 808, 6330, "2026-08-02", "Available now"],
    ["701", 1, 1, 825, 6336, "2026-09-19", "Sep 19"],
    ["705", 1, 1, 951, 6480, "2026-09-17", "Sep 17"],
    ["1411", 1, 1, 808, 6749, "2026-08-02", "Available now"],
    ["1415", 2, 2, 1211, 7458, "2026-08-21", "Aug 21"],
    ["1515", 2, 2, 1211, 7642, "2026-08-04", "Aug 4"],
    ["1303", 2, 2, 1164, 7794, "2026-08-20", "Aug 20"],
    ["1902", 2, 2, 1224, 8074, "2026-08-27", "Aug 27"],
  ].map(([number, beds, baths, sqft, rent, moveIn, moveInLabel]) => zillowBuilding({
    id: `388-${number}`,
    building: "388 Beale",
    address: "388 Beale St",
    unit: `Unit ${number}`,
    beds,
    baths,
    sqft,
    rent,
    fees: 72,
    utilities: 308,
    insurance: 14,
    parking: 445,
    parkingConfidence: "Confirmed reserved garage",
    moveIn,
    moveInLabel,
    sourceUrl: URLS.beale388,
    costSourceUrl: URLS.beale388Fees,
    deposit: 600,
    listedPriceLabel: "Base rent",
    pricingNote: "UDR publishes $57 trash, $15 package lockers, $445 reserved parking, $14 liability coverage, and $238 average electricity/energy/water. We add $70 internet inside the utility estimate.",
    amenities: ["In-unit laundry", "24-hour concierge", "Garage parking"],
  })),

  // Individually listed condos — direct listing detail was checked to avoid stale Zillow search cards.
  condo({ id: "bridgeview-1501", building: "Bridgeview", address: "400 Beale St", unit: "Unit 1501", beds: 2, baths: 2, sqft: 1223, rent: 7995, utilities: 95, parking: 450, parkingConfidence: "Estimated — listing says contact manager", parkingIncluded: false, moveIn: "2026-08-02", moveInLabel: "Available now", postedLabel: "Posted Aug 2, 2026", sourceUrl: URLS.bridgeview1501, deposit: 7995, listedPriceLabel: "Zillow asking rent", pricingNote: "The listing names garbage, internet and water under property utilities but does not clearly state every inclusion. We estimate remaining energy costs and model one garage space at $450 pending confirmation.", utilitiesIncluded: ["Water", "Garbage", "Internet (verify)"], amenities: ["Balcony", "Fitness center", "Concierge"] }),
  condo({ id: "infinity-6b", building: "The Infinity", address: "318 Spear St", unit: "Unit 6B", beds: 2, baths: 2, sqft: 1100, rent: 7000, utilities: 135, parking: 0, parkingConfidence: "1 assigned space included", parkingIncluded: true, moveIn: "2026-08-11", moveInLabel: "Aug 11", postedLabel: "Posted Jul 23, 2026", sourceUrl: URLS.infinity6b, deposit: 7000, listedPriceLabel: "Zillow total monthly price", pricingNote: "The owner says one assigned garage space, water, garbage and HOA are included. Estimate covers energy, internet and renter's insurance.", utilitiesIncluded: ["Water", "Garbage"], amenities: ["Parking included", "Heated lap pool", "Central A/C"] }),
  condo({ id: "metropolitan-s2405", building: "The Metropolitan", address: "355 1st St", unit: "Unit S2405", beds: 2, baths: 2, sqft: 1166, rent: 7250, utilities: 150, parking: 450, parkingConfidence: "Confirmed optional parking", moveIn: "2026-08-31", moveInLabel: "Aug 31", postedLabel: "Posted Jul 21, 2026", sourceUrl: URLS.metropolitan2405, deposit: 14000, listedPriceLabel: "Zillow asking rent", pricingNote: "Water and garbage are included; the listing explicitly prices parking at $450/month. Estimate adds energy, internet and renter's insurance.", utilitiesIncluded: ["Water", "Garbage"], amenities: ["Furnished", "City & bay views", "Central A/C"] }),
  condo({ id: "metropolitan-s902", building: "The Metropolitan", address: "355 1st St", unit: "Unit S902", beds: 2, baths: 2, sqft: 995, rent: 6850, utilities: 175, parking: 0, parkingConfidence: "1 space included", parkingIncluded: true, moveIn: "2026-08-15", moveInLabel: "Mid-August · confirm", postedLabel: "Posted Jul 21, 2026", sourceUrl: URLS.metropolitan902, deposit: 6850, listedPriceLabel: "Zillow asking rent", pricingNote: "The description says premium underground parking and storage are included. Zillow's header says available now while the description says mid-August, so the date needs confirmation.", utilitiesIncluded: [], amenities: ["Parking included", "Storage included", "Pool & fitness center"] }),
];

export const sourceUnits = researchedUnits;

const refreshedUnits = [...researchedUnits, ...(refreshState.discoveredUnits || [])]
  .map((unit) => ({ ...unit, ...(refreshState.unitOverrides?.[unit.id] || {}) }))
  .filter((unit) => unit.active !== false);

// Product rule: studios are never exposed, even if a source adapter discovers one.
export const units = refreshedUnits.filter((unit) => unit.beds >= 1);

export const snapshotMetadata = {
  dataUpdatedAt: refreshState.dataUpdatedAt || "2026-08-02T18:00:00-07:00",
  lastRefreshAttemptAt: refreshState.lastRefreshAttemptAt,
  verifiedSourceCount: refreshState.verifiedSourceCount || 0,
  totalSourceCount: refreshState.totalSourceCount || 12,
};

export const monitoredBuildings = [
  {
    building: "Jasper",
    address: "45 Lansing St",
    status: "Studios only · excluded",
    detail: "The verified Jasper feed contained only studio homes. They are intentionally excluded from results.",
    sourceUrl: URLS.jasper,
    tone: "quiet",
  },
  {
    building: "399 Fremont",
    address: "399 Fremont St",
    status: "No verified availability",
    detail: "Official page updated Aug 2 at 5:38 PM and reports 0 apartments. Earlier cached results were excluded.",
    sourceUrl: URLS.fremont399,
    tone: "quiet",
  },
  {
    building: "One Rincon Hill",
    address: "425 1st St",
    status: "Stale card excluded",
    detail: "A Zillow neighborhood card showed Unit 4504, but the unit detail page says off market. It is not counted.",
    sourceUrl: "https://www.zillow.com/rincon-hill-san-francisco-ca/condos-for-rent/",
    tone: "warning",
  },
  {
    building: "LUMINA",
    address: "201 Folsom St",
    status: "Building-level prices only",
    detail: "Zillow showed building ranges, but exact active unit details were not consistently verifiable, so no synthetic unit cards were created.",
    sourceUrl: "https://www.zillow.com/rincon-hill-san-francisco-ca/condos-for-rent/",
    tone: "quiet",
  },
  {
    building: "The Harrison",
    address: "401 Harrison St",
    status: "Detail verification pending",
    detail: "Neighborhood results showed prices at this address; individual listing status and included costs could not be reliably reconciled.",
    sourceUrl: "https://www.zillow.com/rincon-hill-san-francisco-ca/condos-for-rent/",
    tone: "quiet",
  },
  {
    building: "Avery 450",
    address: "450 Folsom St",
    status: "No public unit feed found",
    detail: "The building is in coverage, but no current unit-level availability with public prices was exposed during this check.",
    sourceUrl: "https://www.rinconhill-apartments.com/",
    tone: "quiet",
  },
];

export const researchNotes = [
  "Prices are a point-in-time research snapshot, not a leasing quote.",
  "Studios are excluded from every result and from automated discoveries.",
  "Parking is included in the total by default; turn it off to compare car-free costs.",
  "Usage-based utilities are estimates unless the property supplied an average.",
  "Concessions are not amortized unless the source price already reflects them.",
  "Security deposits and application/move-in charges are shown separately from monthly totals.",
];

export function monthlyTotal(unit, includeParking = true) {
  const parking = includeParking && !unit.parkingIncluded ? unit.parking : 0;
  return unit.rent + unit.fees + unit.utilities + unit.insurance + parking;
}

export function upfrontTotal(unit) {
  return (unit.deposit || 0) + (unit.applicationFee || 0) + (unit.moveInFee || 0);
}

export function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
