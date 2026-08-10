import { refreshState } from "./refresh-state.js";

const URLS = {
  fremont340: "https://www.equityapartments.com/san-francisco/rincon-hill/340-fremont-apartments",
  modera: "https://www.moderarinconhill.com/san-francisco-ca-apartments/modera-rincon-hill/conventional/",
  moderaFees: "https://www.moderarinconhill.com/san-francisco-ca-apartments/modera-rincon-hill/faqs/",
  fremont333: "https://www.333fremont.com/san-francisco/333-fremont/conventional/",
  folsom500: "https://www.essexapartmenthomes.com/apartments/san-francisco/500-folsom/floor-plans-and-pricing",
  spera: "https://www.rentcafe.com/apartments/ca/san-francisco/spera/default.aspx",
  solaire: "https://solairesf.com/floorplans/",
  jasper: "https://www.rentjasper.com/community-map/",
  beale388: "https://www.udr.com/san-francisco-bay-area-apartments/san-francisco/388-beale/apartments-pricing/",
  beale388Fees: "https://www.udr.com/generatepdf/apartmentexpenses?pid=37412",
  fremont399: "https://www.udr.com/san-francisco-bay-area-apartments/san-francisco/399-fremont/apartments-pricing/",
  fremont399Fees: "https://www.udr.com/generatepdf/apartmentexpenses?pid=51589",
  hotpadsRincon: "https://hotpads.com/rincon-hill-san-francisco-ca/apartments-for-rent",
  avery450: "https://www.relatedrentals.com/apartment-rentals/san-francisco/soma/avery-450",
  avery450Legacy: "https://hotpads.com/avery-450-san-francisco-ca-94105-2476y1v/pad",
  harrisonZillow: "https://www.zillow.com/b/tower-two-at-one-rincon-hill-san-francisco-ca-5mTVbx/",
  harrisonCompass: "https://www.compass.com/building/the-harrison-san-francisco-ca/302764349676184005/",
  oneRinconCompass: "https://www.compass.com/building/one-rincon-hill-san-francisco-ca/776223940080373789/",
  averyCompass: "https://www.compass.com/building/the-avery-san-francisco-ca/776315909062009133/",
  luminaCompass: "https://www.compass.com/building/lumina-san-francisco-ca/777008840924440301/",
  infinityCompass: "https://www.compass.com/building/the-infinity-san-francisco-ca/777004704384461173/",
  metropolitanCompass: "https://www.compass.com/building/metropolitan-san-francisco-ca/776530764113136965/",
  miraCompass: "https://www.compass.com/building/mira-san-francisco-ca/791035602298308837/",
  millenniumCompass: "https://www.compass.com/building/millennium-san-francisco-ca/776857461421607901/",
  harrison11a: "https://www.zillow.com/homedetails/401-Harrison-St-APT-11A-San-Francisco-CA-94105/249698370_zpid/",
  fremont18158d: "https://www.zillow.com/homedetails/181-Fremont-St-UNIT-58D-San-Francisco-CA-94105/249665315_zpid/",
  bridgeview1412: "https://www.zillow.com/homedetails/400-Beale-St-APT-1412-San-Francisco-CA-94105/80751505_zpid/",
  infinity8hl: "https://www.zillow.com/homedetails/318-Spear-St-8H-L-San-Francisco-CA-94105/463798029_zpid/",
  metropolitanN1607: "https://hotpads.com/333-1st-st-san-francisco-ca-94105-241aes2/n1607/pad",
  bridgeview1501: "https://www.zillow.com/homedetails/400-Beale-St-APT-1501-San-Francisco-CA-94105/80734962_zpid/",
  infinity6b: "https://www.zillow.com/homedetails/318-Spear-St-UNIT-6B-San-Francisco-CA-94105/89236508_zpid/",
  metropolitan2405: "https://www.zillow.com/homedetails/355-1st-St-UNIT-S2405-San-Francisco-CA-94105/64971613_zpid/",
  metropolitan902: "https://www.zillow.com/homedetails/355-1st-St-UNIT-S902-San-Francisco-CA-94105/2089159962_zpid/",
  lumina27d: "https://www.zillow.com/homedetails/201-Folsom-St-APT-27D-San-Francisco-CA-94105/249698470_zpid/",
  portside: "https://www.compass.com/building/403-main-st-san-francisco-ca-94105/776839530855828237/",
};

const LISTING_URLS = {
  fremont340712: "https://www.equityapartments.com/UnitFees/29921/1/712",
  fremont3403903: "https://www.equityapartments.com/UnitFees/29921/1/3903",
  moderaA03: "https://www.moderarinconhill.com/san-francisco-ca-apartments/modera-rincon-hill/floorplans/a03-992043/fp_name/occupancy_type/conventional/",
  moderaA04: "https://www.moderarinconhill.com/san-francisco-ca-apartments/modera-rincon-hill/floorplans/a04-992046/fp_name/occupancy_type/conventional/",
  moderaA10: "https://www.moderarinconhill.com/san-francisco-ca-apartments/modera-rincon-hill/floorplans/a10-992063/fp_name/occupancy_type/conventional/",
  moderaB03: "https://www.moderarinconhill.com/san-francisco-ca-apartments/modera-rincon-hill/floorplans/b03-992062/fp_name/occupancy_type/conventional/",
  moderaB04: "https://www.moderarinconhill.com/san-francisco-ca-apartments/modera-rincon-hill/floorplans/b04-992058/fp_name/occupancy_type/conventional/",
  moderaB06: "https://www.moderarinconhill.com/san-francisco-ca-apartments/modera-rincon-hill/floorplans/b06-992057/fp_name/occupancy_type/conventional/",
  moderaB08: "https://www.moderarinconhill.com/san-francisco-ca-apartments/modera-rincon-hill/floorplans/b08-992064/fp_name/occupancy_type/conventional/",
  fremont333Folsom: "https://www.333fremont.com/floorplans/san-francisco-CA/333-fremont/folsom-1160602-1/",
  fremont333Delancy1: "https://www.333fremont.com/floorplans/san-francisco-CA/333-fremont/delancy-1-1160608-1/",
  fremont333Howard1: "https://www.333fremont.com/floorplans/san-francisco-CA/333-fremont/howard-1-1160624-1/",
  fremont333Stevenson: "https://www.333fremont.com/floorplans/san-francisco-CA/333-fremont/stevenson-1160616-1/",
  fremont333Main: "https://www.333fremont.com/floorplans/san-francisco-CA/333-fremont/main-1160648-1/",
  fremont333King: "https://www.333fremont.com/floorplans/san-francisco-CA/333-fremont/king-1160650-1/",
  portside717: "https://www.compass.com/homedetails/403-Main-St-Unit-717-San-Francisco-CA-94105/1QPSD2_pid/",
  portside316N: "https://www.compass.com/homedetails/403-Main-St-Unit-316N-San-Francisco-CA-94105/1QGIEU_pid/",
};

const SPERA_APPLICATIONS = {
  "32E": ["42496942", "5418875", "08/01/2026"],
  "26E": ["42496853", "5418875", "09/02/2026"],
  "32J": ["42496947", "5418879", "08/01/2026"],
  "30J": ["42496921", "5418879", "08/07/2026"],
  "30I": ["42496920", "5417804", "08/26/2026"],
  "03H": ["42496956", "5417805", "08/21/2026"],
  "08H": ["42497017", "5417805", "09/03/2026"],
  "08B": ["42497011", "5418877", "08/05/2026"],
  "32G": ["42496944", "5418878", "08/20/2026"],
  "19G": ["42496764", "5418878", "09/02/2026"],
  "23F": ["42496815", "5418883", "08/21/2026"],
  PH33C: ["42497038", "5418888", "08/21/2026"],
  PH34C: ["42497042", "5418888", "09/05/2026"],
};

function speraListingUrl(number) {
  const [unitId, floorPlanId, moveInDate] = SPERA_APPLICATIONS[number];
  return `https://www.rentcafe.com/onlineleasing/apartmentsforrent/oleapplication.aspx?Stepname=RentalOptions&myOlePropertyId=1857892&UnitID=${unitId}&FloorPlanID=${floorPlanId}&header=1&MoveInDate=${moveInDate}`;
}

function udrListingUrl(unitId, moveInDate) {
  const [month, day, year] = moveInDate.split("/").map(Number);
  const availableAt = Date.UTC(year, month - 1, day);
  const returnUrl = "https%3A%2F%2Fwww.udr.com%2FFormTemplates%2FRedirectCloseOverlay%3Fu%3D%252Fsan-francisco-bay-area-apartments%252Fsan-francisco%252F388-beale%252Fapartments-pricing%252F%253F";
  return `https://www.udr.com/leaseoll/floorplan/?pid=37412&realpagesiteid=2421377&unitid=${unitId}&moveindate=${moveInDate}&AvailableDateMilliseconds=${availableAt}&searchurl=${returnUrl}&maxDaysToShow=49`;
}

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

function compassCondo(overrides) {
  return condo({
    sourceType: "compass-condo",
    sourceLabel: "Compass rental listing",
    ...overrides,
  });
}

function trackerCondo(overrides) {
  return compassCondo({
    id: "tracker-template",
    unit: "Unit template",
    beds: 1,
    baths: 1,
    sqft: 0,
    rent: 1,
    utilities: 175,
    insurance: 18,
    parking: 450,
    parkingConfidence: "Estimated — confirm with owner",
    moveIn: null,
    moveInLabel: "Confirm date",
    deposit: 1,
    listedPriceLabel: "Compass asking rent",
    pricingNote: "Rent and availability are refreshed from the live condo listing. Utilities, insurance, parking, and any HOA move-in charge are estimated when they are not itemized.",
    amenities: ["In-unit laundry", "Concierge"],
    ...overrides,
  });
}

const researchedUnits = [
  // 340 Fremont — all seven offers exposed by the building site on Aug 2.
  managed({ id: "340-a-f2", building: "340 Fremont", address: "340 Fremont St", unit: "Plan A · floor 2", beds: 0, baths: 1, sqft: 482, rent: 4410, fees: 35, utilities: 205, insurance: 15, parking: 450, parkingConfidence: "Estimated — confirm", moveIn: "2026-08-02", moveInLabel: "Available now", floor: 2, sourceUrl: URLS.fremont340, deposit: 500, listedPriceLabel: "Base rent · 12 mo", pricingNote: "Building price is confirmed. Utilities, recurring services, insurance and parking are modeled estimates because the property does not publish a complete fee sheet on this page.", amenities: ["In-unit laundry", "24-hour concierge", "Rooftop terrace"] }),
  managed({ id: "340-g-f2", building: "340 Fremont", address: "340 Fremont St", unit: "Plan G · floor 2", beds: 0, baths: 1, sqft: 538, rent: 4466, fees: 35, utilities: 205, insurance: 15, parking: 450, parkingConfidence: "Estimated — confirm", moveIn: "2026-08-02", moveInLabel: "Available now", floor: 2, sourceUrl: URLS.fremont340, deposit: 500, listedPriceLabel: "Base rent · 12 mo", pricingNote: "Building price and date are confirmed; non-rent costs are modeled until leasing supplies an itemized quote.", amenities: ["In-unit laundry", "24-hour concierge", "Rooftop terrace"] }),
  managed({ id: "340-d-f6", building: "340 Fremont", address: "340 Fremont St", unit: "Plan D · floor 6", beds: 0, baths: 1, sqft: 550, rent: 4671, fees: 35, utilities: 205, insurance: 15, parking: 450, parkingConfidence: "Estimated — confirm", moveIn: "2026-08-04", moveInLabel: "Aug 4", floor: 6, sourceUrl: URLS.fremont340, deposit: 500, listedPriceLabel: "Base rent · 12 mo", pricingNote: "Building price and date are confirmed; non-rent costs are modeled until leasing supplies an itemized quote.", amenities: ["In-unit laundry", "24-hour concierge", "Rooftop terrace"] }),
  managed({ id: "340-i-f2", building: "340 Fremont", address: "340 Fremont St", unit: "Plan I · floor 2", beds: 0, baths: 1, sqft: 635, rent: 4507, fees: 35, utilities: 205, insurance: 15, parking: 450, parkingConfidence: "Estimated — confirm", moveIn: "2026-08-12", moveInLabel: "Aug 12", floor: 2, sourceUrl: URLS.fremont340, deposit: 500, listedPriceLabel: "Base rent · 12 mo", pricingNote: "Building price and date are confirmed; non-rent costs are modeled until leasing supplies an itemized quote.", amenities: ["In-unit laundry", "24-hour concierge", "Rooftop terrace"] }),
  managed({ id: "340-m-f37", building: "340 Fremont", address: "340 Fremont St", unit: "Plan M · floor 37", beds: 0, baths: 1, sqft: 518, rent: 5514, fees: 35, utilities: 205, insurance: 15, parking: 450, parkingConfidence: "Estimated — confirm", moveIn: "2026-08-18", moveInLabel: "Aug 18", floor: 37, sourceUrl: URLS.fremont340, deposit: 500, listedPriceLabel: "Base rent · 12 mo", pricingNote: "Bay/Bridge-view premium is reflected in rent. Non-rent costs are modeled estimates.", amenities: ["Bay & Bridge view", "In-unit laundry", "Rooftop terrace"] }),
  managed({ id: "340-1a-f7", building: "340 Fremont", address: "340 Fremont St", unit: "1 Bedroom A · floor 7", beds: 1, baths: 1, sqft: 738, rent: 5540, fees: 35, utilities: 225, insurance: 15, parking: 450, parkingConfidence: "Estimated — confirm", moveIn: "2026-08-02", moveInLabel: "Available now", floor: 7, sourceUrl: URLS.fremont340, listingUrl: LISTING_URLS.fremont340712, deposit: 500, listedPriceLabel: "Base rent · 12 mo", pricingNote: "Building price and date are confirmed; non-rent costs are modeled until leasing supplies an itemized quote.", amenities: ["In-unit laundry", "24-hour concierge", "Rooftop terrace"] }),
  managed({ id: "340-2s-f39", building: "340 Fremont", address: "340 Fremont St", unit: "2 Bedroom S · floor 39", beds: 2, baths: 2, sqft: 1118, rent: 8634, fees: 35, utilities: 285, insurance: 15, parking: 450, parkingConfidence: "Estimated — confirm", moveIn: "2026-08-14", moveInLabel: "Aug 14", floor: 39, sourceUrl: URLS.fremont340, listingUrl: LISTING_URLS.fremont3403903, deposit: 500, listedPriceLabel: "Base rent · 12 mo", pricingNote: "Building price and date are confirmed; non-rent costs are modeled until leasing supplies an itemized quote.", amenities: ["Sunset view", "Balcony", "In-unit laundry"] }),

  // Modera — the source exposes floor-plan offers, not apartment numbers.
  managed({ id: "modera-s01", building: "Modera Rincon Hill", address: "390 1st St", unit: "Plan S01", beds: 0, baths: 1, sqft: 336, rent: 4453, fees: 0, utilities: 210, insurance: 0, parking: 480, parkingConfidence: "Confirmed starting price", moveIn: "2026-08-17", moveInLabel: "Aug 17", sourceUrl: URLS.modera, costSourceUrl: URLS.moderaFees, deposit: 500, listedPriceLabel: "Property total monthly price", pricingNote: "The advertised figure is the property's total monthly leasing price. We add estimated usage-based utilities and confirmed $480 parking; the $20 liability waiver should already be represented in the listed total.", amenities: ["Smart thermostat", "In-unit laundry", "Controlled access"] }),
  managed({ id: "modera-s02", building: "Modera Rincon Hill", address: "390 1st St", unit: "Plan S02 · 1 left", beds: 0, baths: 1, sqft: 358, rent: 4244, fees: 0, utilities: 210, insurance: 0, parking: 480, parkingConfidence: "Confirmed starting price", moveIn: null, moveInLabel: "Confirm date", sourceUrl: URLS.modera, costSourceUrl: URLS.moderaFees, deposit: 500, listedPriceLabel: "Property total monthly price", pricingNote: "One home was shown, but the property did not expose its apartment number or move-in date. Utilities are estimated; parking starts at $480.", amenities: ["Smart thermostat", "In-unit laundry", "Controlled access"] }),
  managed({ id: "modera-s07", building: "Modera Rincon Hill", address: "390 1st St", unit: "Plan S07 · 1 left", beds: 0, baths: 1, sqft: 454, rent: 4404, fees: 0, utilities: 210, insurance: 0, parking: 480, parkingConfidence: "Confirmed starting price", moveIn: null, moveInLabel: "Confirm date", sourceUrl: URLS.modera, costSourceUrl: URLS.moderaFees, deposit: 500, listedPriceLabel: "Property total monthly price", pricingNote: "One home was shown, but the property did not expose its apartment number or move-in date. Utilities are estimated; parking starts at $480.", amenities: ["Smart thermostat", "In-unit laundry", "Controlled access"] }),
  managed({ id: "modera-a03", building: "Modera Rincon Hill", address: "390 1st St", unit: "Plan A03 · 1 left", beds: 1, baths: 1, sqft: 581, rent: 4249, fees: 0, utilities: 235, insurance: 0, parking: 480, parkingConfidence: "Confirmed starting price", moveIn: null, moveInLabel: "Confirm date", sourceUrl: URLS.modera, listingUrl: LISTING_URLS.moderaA03, costSourceUrl: URLS.moderaFees, deposit: 500, listedPriceLabel: "Property total monthly price", pricingNote: "The source shows at least 581 sq ft and one remaining home, without an apartment number or date.", amenities: ["Smart thermostat", "In-unit laundry", "Controlled access"] }),
  managed({ id: "modera-a04", building: "Modera Rincon Hill", address: "390 1st St", unit: "Plan A04 · 1 left", beds: 1, baths: 1, sqft: 673, rent: 4568, fees: 0, utilities: 235, insurance: 0, parking: 480, parkingConfidence: "Confirmed starting price", moveIn: null, moveInLabel: "Confirm date", sourceUrl: URLS.modera, listingUrl: LISTING_URLS.moderaA04, costSourceUrl: URLS.moderaFees, deposit: 500, listedPriceLabel: "Property total monthly price", pricingNote: "The source shows one remaining home, without an apartment number or date.", amenities: ["Smart thermostat", "In-unit laundry", "Controlled access"] }),
  managed({ id: "modera-a10", building: "Modera Rincon Hill", address: "390 1st St", unit: "Plan A10 · 1 left", beds: 1, baths: 1, sqft: 508, rent: 4643, fees: 0, utilities: 235, insurance: 0, parking: 480, parkingConfidence: "Confirmed starting price", moveIn: null, moveInLabel: "Confirm date", sourceUrl: URLS.modera, listingUrl: LISTING_URLS.moderaA10, costSourceUrl: URLS.moderaFees, deposit: 500, listedPriceLabel: "Property total monthly price", pricingNote: "The source shows at least 508 sq ft and one remaining home, without an apartment number or date.", amenities: ["Smart thermostat", "In-unit laundry", "Controlled access"] }),
  managed({ id: "modera-b03", building: "Modera Rincon Hill", address: "390 1st St", unit: "Plan B03", beds: 2, baths: 2, sqft: 914, rent: 8003, fees: 0, utilities: 285, insurance: 0, parking: 480, parkingConfidence: "Confirmed starting price", moveIn: "2026-08-08", moveInLabel: "Aug 8", sourceUrl: URLS.modera, listingUrl: LISTING_URLS.moderaB03, costSourceUrl: URLS.moderaFees, deposit: 500, listedPriceLabel: "Property total monthly price", pricingNote: "The advertised figure includes required monthly charges; utilities are usage-based and modeled separately.", amenities: ["Smart thermostat", "In-unit laundry", "Controlled access"] }),
  managed({ id: "modera-b04", building: "Modera Rincon Hill", address: "390 1st St", unit: "Plan B04 · 1 left", beds: 2, baths: 1, sqft: 892, rent: 8110, fees: 0, utilities: 285, insurance: 0, parking: 480, parkingConfidence: "Confirmed starting price", moveIn: null, moveInLabel: "Confirm date", sourceUrl: URLS.modera, listingUrl: LISTING_URLS.moderaB04, costSourceUrl: URLS.moderaFees, deposit: 500, listedPriceLabel: "Property total monthly price", pricingNote: "One home was shown, but the property did not expose its apartment number or move-in date.", amenities: ["Smart thermostat", "In-unit laundry", "Controlled access"] }),
  managed({ id: "modera-b06", building: "Modera Rincon Hill", address: "390 1st St", unit: "Plan B06 · 1 left", beds: 2, baths: 2, sqft: 957, rent: 8182, fees: 0, utilities: 285, insurance: 0, parking: 480, parkingConfidence: "Confirmed starting price", moveIn: null, moveInLabel: "Confirm date", sourceUrl: URLS.modera, listingUrl: LISTING_URLS.moderaB06, costSourceUrl: URLS.moderaFees, deposit: 500, listedPriceLabel: "Property total monthly price", pricingNote: "One home was shown, but the property did not expose its apartment number or move-in date.", amenities: ["Smart thermostat", "In-unit laundry", "Controlled access"] }),
  managed({ id: "modera-b08", building: "Modera Rincon Hill", address: "390 1st St", unit: "Plan B08", beds: 2, baths: 2, sqft: 988, rent: 7700, fees: 0, utilities: 285, insurance: 0, parking: 480, parkingConfidence: "Confirmed starting price", moveIn: "2026-08-08", moveInLabel: "Aug 8", sourceUrl: URLS.modera, listingUrl: LISTING_URLS.moderaB08, costSourceUrl: URLS.moderaFees, deposit: 500, listedPriceLabel: "Property total monthly price", pricingNote: "The advertised figure includes required monthly charges; utilities are usage-based and modeled separately.", amenities: ["Smart thermostat", "In-unit laundry", "Controlled access"] }),

  // 333 Fremont — six exact unit numbers currently exposed.
  managed({ id: "333-305", building: "333 Fremont", address: "333 Fremont St", unit: "Unit 305 · Folsom", beds: 1, baths: 1, sqft: 691, rent: 5095, fees: 49, utilities: 220, insurance: 15, parking: 450, parkingConfidence: "Estimated — contact property", moveIn: "2026-07-29", moveInLabel: "Available now", floor: 3, sourceUrl: URLS.fremont333, listingUrl: LISTING_URLS.fremont333Folsom, deposit: 1500, listedPriceLabel: "Property total shown", pricingNote: "The building separately discloses about $22–32 resident services, $10–13 pest control, $4.15 billing and a $220 historical-mean utility bill. Parking price is not published, so $450 is a neighborhood estimate.", amenities: ["Walk-in closet", "In-unit laundry", "Doorman"] }),
  managed({ id: "333-311", building: "333 Fremont", address: "333 Fremont St", unit: "Unit 311 · Delancy 1", beds: 1, baths: 1, sqft: 740, rent: 5345, fees: 49, utilities: 220, insurance: 15, parking: 450, parkingConfidence: "Estimated — contact property", moveIn: "2026-07-30", moveInLabel: "Available now", floor: 3, sourceUrl: URLS.fremont333, listingUrl: LISTING_URLS.fremont333Delancy1, deposit: 1500, listedPriceLabel: "Property total shown", pricingNote: "Published recurring-cost ranges are included in our estimate. Parking remains a modeled amount pending a quote.", amenities: ["In-unit laundry", "Doorman", "Fitness center"] }),
  managed({ id: "333-806", building: "333 Fremont", address: "333 Fremont St", unit: "Unit 806 · Howard 1", beds: 1, baths: 1, sqft: 681, rent: 5895, fees: 49, utilities: 220, insurance: 15, parking: 450, parkingConfidence: "Estimated — contact property", moveIn: null, moveInLabel: "Confirm date", floor: 8, sourceUrl: URLS.fremont333, listingUrl: LISTING_URLS.fremont333Howard1, deposit: 1500, listedPriceLabel: "Property total shown", pricingNote: "The source exposes the unit and price but not a date in the current aggregate view. Published recurring-cost ranges are included.", amenities: ["In-unit laundry", "Doorman", "Fitness center"] }),
  managed({ id: "333-702", building: "333 Fremont", address: "333 Fremont St", unit: "Unit 702 · Stevenson", beds: 1, baths: 1, sqft: 724, rent: 6645, fees: 49, utilities: 220, insurance: 15, parking: 450, parkingConfidence: "Estimated — contact property", moveIn: null, moveInLabel: "Confirm date", floor: 7, sourceUrl: URLS.fremont333, listingUrl: LISTING_URLS.fremont333Stevenson, deposit: 1500, listedPriceLabel: "Property total shown", pricingNote: "The source exposes the unit and price but not a date in the current aggregate view. Published recurring-cost ranges are included.", amenities: ["In-unit laundry", "Doorman", "Fitness center"] }),
  managed({ id: "333-208", building: "333 Fremont", address: "333 Fremont St", unit: "Unit 208 · Main", beds: 2, baths: 2, sqft: 1193, rent: 8049, fees: 49, utilities: 220, insurance: 15, parking: 450, parkingConfidence: "Estimated — contact property", moveIn: "2026-08-17", moveInLabel: "Aug 17", floor: 2, sourceUrl: URLS.fremont333, listingUrl: LISTING_URLS.fremont333Main, deposit: 1500, listedPriceLabel: "Property total shown", pricingNote: "Published recurring-cost ranges are included in our estimate. Parking remains a modeled amount pending a quote.", amenities: ["Walk-in closet", "Premium upgrade", "In-unit laundry"] }),
  managed({ id: "333-609", building: "333 Fremont", address: "333 Fremont St", unit: "Unit 609 · King", beds: 2, baths: 2, sqft: 1095, rent: 8324, fees: 49, utilities: 220, insurance: 15, parking: 450, parkingConfidence: "Estimated — contact property", moveIn: "2026-08-24", moveInLabel: "Aug 24", floor: 6, sourceUrl: URLS.fremont333, listingUrl: LISTING_URLS.fremont333King, deposit: 1500, listedPriceLabel: "Property total shown", pricingNote: "Published recurring-cost ranges are included in our estimate. Parking remains a modeled amount pending a quote.", amenities: ["Bridge view", "Large balcony", "Premium upgrade"] }),

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
    listingUrl: speraListingUrl(number),
    deposit: 1200,
    applicationFee: 65,
    listedPriceLabel: "Base-rent range minimum",
    pricingNote: "The property feed publishes a base-rent range for each unit. The lower bound is shown; recurring fees, utilities, insurance, and garage parking remain modeled estimates.",
    amenities: ["In-unit laundry", "Garage", "Rooftop deck"],
  })),

  // Solaire — exact homes from Solaire's own availability feed.
  ...[
    ["0509", "09", 1, 1, 610, 4868, 31.06, "2026-09-17", "Sep 17", "https://solairesf.com/floorplans/unit-d17cbef2e38d6a3ba6791a623446b891/"],
    ["1209", "09", 1, 1, 610, 5043, 31.06, "2026-09-07", "Sep 7", "https://solairesf.com/floorplans/unit-f7ccdfefb4c70b7e3a57e9075b16073f/"],
    ["2303", "03", 1, 1, 511, 5358, 31.06, "2026-09-12", "Sep 12", "https://solairesf.com/floorplans/unit-6a3562dd197af54fb5ce400060d03400/"],
    ["2609", "09", 1, 1, 610, 5418, 31.06, "2026-07-22", "Available now", "https://solairesf.com/floorplans/unit-594f7022b67f043dd77d83d8acc3d06f/"],
    ["2802", "02", 1, 1, 513, 5408, 31.06, "2026-08-24", "Aug 24", "https://solairesf.com/floorplans/unit-64d57ffc3bd77e9c7db058c4df0193e0/"],
    ["3103", "03", 1, 1, 511, 5598, 31.06, "2026-09-06", "Sep 6", "https://solairesf.com/floorplans/unit-54c3bdbe168d5b46aeccb6a1b7bb512d/"],
    ["2411", "11", 0, 1, 441, 4901, 31.06, "2026-09-11", "Sep 11", "https://solairesf.com/floorplans/unit-b637e55b35464f54b6ef1ebe28729006/"],
  ].map(([number, plan, beds, baths, sqft, rent, fees, moveIn, moveInLabel, listingUrl]) => managed({
    id: `solaire-${number}`,
    building: "Solaire",
    address: "299 Fremont St",
    unit: `Unit ${number} · Plan ${plan}`,
    beds,
    baths,
    sqft,
    rent,
    fees,
    utilities: beds === 0 ? 210 : 235,
    insurance: 15,
    parking: 450,
    parkingConfidence: "Estimated — price not published",
    moveIn,
    moveInLabel,
    sourceUrl: URLS.solaire,
    listingUrl,
    deposit: 1000,
    applicationFee: 285,
    listedPriceLabel: "Official base rent",
    pricingNote: "Solaire's official total monthly leasing price adds $31.06 in mandatory monthly charges to base rent. Usage-based utilities, insurance, and parking remain modeled estimates.",
    amenities: ["In-unit laundry", "Pool", "Pet friendly"],
  })),

  // Jasper — official SightMap inventory. All four current homes are studios, so the public filter hides them.
  ...[
    ["0101", 738, 4941.15, "2026-08-03", "Aug 3"],
    ["0404", 543, 5289.15, "2026-08-31", "Aug 31"],
    ["2406", 611, 4934.15, "2026-08-14", "Aug 14"],
    ["2608", 546, 4891.15, "2026-08-07", "Aug 7"],
  ].map(([number, sqft, rent, moveIn, moveInLabel]) => managed({
    id: `jasper-${number}`,
    building: "Jasper",
    address: "45 Lansing St",
    unit: `Unit ${number}`,
    beds: 0,
    baths: 1,
    sqft,
    rent,
    fees: 0,
    utilities: 210,
    insurance: 15,
    parking: 500,
    parkingConfidence: "Estimated valet rate",
    moveIn,
    moveInLabel,
    sourceUrl: URLS.jasper,
    deposit: 500,
    listedPriceLabel: "Official total monthly price",
    pricingNote: "Jasper's official community map includes fixed mandatory monthly charges in the displayed price. Usage-based utilities, insurance, and valet parking remain modeled estimates.",
    amenities: ["Valet parking", "In-unit laundry", "Fitness center"],
  })),

  // 388 Beale — exact homes and lease links from UDR's official availability page.
  ...[
    ["1206", "A1B", 1, 1, 808, 6330, "2026-08-02", "Available now", 825, "13", "08/04/2026"],
    ["1411", "A1B", 1, 1, 808, 6749, "2026-08-02", "Available now", 825, "22", "08/04/2026"],
    ["1515", "B2B", 2, 2, 1211, 7592, "2026-08-04", "Aug 4", 1225, "142", "08/04/2026"],
    ["1516", "A1C", 1, 1, 825, 6072, "2026-08-06", "Aug 6", 775, "53", "08/06/2026"],
    ["1303", "B2A", 2, 2, 1164, 7744, "2026-08-20", "Aug 20", 1125, "112", "08/20/2026"],
    ["1415", "B2B", 2, 2, 1211, 7408, "2026-08-21", "Aug 21", 1225, "140", "08/21/2026"],
    ["1013", "A1B", 1, 1, 808, 6193, "2026-09-03", "Sep 3", 825, "7", "09/03/2026"],
    ["705", "A1G", 1, 1, 951, 6480, "2026-09-17", "Sep 17", 925, "100", "09/17/2026"],
    ["701", "A1C", 1, 1, 825, 6336, "2026-09-19", "Sep 19", 775, "39", "09/19/2026"],
    ["1808", "A1F", 1, 1, 861, 7194, "2026-09-26", "Sep 26", 1100, "93", "09/26/2026"],
    ["1709", "B2G", 2, 2, 1286, 7748, "2026-09-26", "Sep 26", 1125, "203", "09/26/2026"],
    ["703", "B2C", 2, 2, 1214, 7422, "2026-10-03", "Oct 3", 1250, "152", "10/03/2026"],
  ].map(([number, plan, beds, baths, sqft, rent, moveIn, moveInLabel, deposit, udrUnitId, leaseMoveIn]) => managed({
    id: `388-${number}`,
    building: "388 Beale",
    address: "388 Beale St",
    unit: `Unit ${number} · Plan ${plan}`,
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
    listingUrl: udrListingUrl(udrUnitId, leaseMoveIn),
    costSourceUrl: URLS.beale388Fees,
    deposit,
    listedPriceLabel: "Base rent",
    pricingNote: "UDR publishes $57 trash, $15 package lockers, $445 reserved parking, $14 liability coverage, and $238 average electricity/energy/water. We add $70 internet inside the utility estimate.",
    amenities: ["In-unit laundry", "24-hour concierge", "Garage parking"],
  })),

  // Individually listed condos — direct listing detail was checked to avoid stale Zillow search cards.
  condo({ id: "bridgeview-1501", building: "Bridgeview", address: "400 Beale St", unit: "Unit 1501", beds: 2, baths: 2, sqft: 1223, rent: 7995, utilities: 95, parking: 450, parkingConfidence: "Estimated — listing says contact manager", parkingIncluded: false, moveIn: "2026-08-02", moveInLabel: "Available now", postedAt: "2026-08-02T07:00:00.000Z", postedLabel: "Posted Aug 2, 2026", sourceUrl: URLS.bridgeview1501, deposit: 7995, listedPriceLabel: "Zillow asking rent", pricingNote: "The listing names garbage, internet and water under property utilities but does not clearly state every inclusion. We estimate remaining energy costs and model one garage space at $450 pending confirmation.", utilitiesIncluded: ["Water", "Garbage", "Internet (verify)"], amenities: ["Balcony", "Fitness center", "Concierge"] }),
  condo({ id: "infinity-6b", building: "The Infinity", address: "318 Spear St", unit: "Unit 6B", beds: 2, baths: 2, sqft: 1100, rent: 7000, utilities: 135, parking: 0, parkingConfidence: "1 assigned space included", parkingIncluded: true, moveIn: "2026-08-11", moveInLabel: "Aug 11", postedAt: "2026-07-23T07:00:00.000Z", postedLabel: "Posted Jul 23, 2026", sourceUrl: URLS.infinity6b, deposit: 7000, listedPriceLabel: "Zillow total monthly price", pricingNote: "The owner says one assigned garage space, water, garbage and HOA are included. Estimate covers energy, internet and renter's insurance.", utilitiesIncluded: ["Water", "Garbage"], amenities: ["Parking included", "Heated lap pool", "Central A/C"] }),
  condo({ id: "metropolitan-s2405", building: "The Metropolitan", address: "355 1st St", unit: "Unit S2405", beds: 2, baths: 2, sqft: 1166, rent: 7250, utilities: 150, parking: 450, parkingConfidence: "Confirmed optional parking", moveIn: "2026-08-31", moveInLabel: "Aug 31", postedAt: "2026-07-21T07:00:00.000Z", postedLabel: "Posted Jul 21, 2026", sourceUrl: URLS.metropolitan2405, deposit: 14000, listedPriceLabel: "Zillow asking rent", pricingNote: "Water and garbage are included; the listing explicitly prices parking at $450/month. Estimate adds energy, internet and renter's insurance.", utilitiesIncluded: ["Water", "Garbage"], amenities: ["Furnished", "City & bay views", "Central A/C"] }),
  condo({ id: "metropolitan-s902", building: "The Metropolitan", address: "355 1st St", unit: "Unit S902", beds: 2, baths: 2, sqft: 995, rent: 6850, utilities: 175, parking: 0, parkingConfidence: "1 space included", parkingIncluded: true, moveIn: "2026-08-15", moveInLabel: "Mid-August · confirm", postedAt: "2026-07-21T07:00:00.000Z", postedLabel: "Posted Jul 21, 2026", sourceUrl: URLS.metropolitan902, deposit: 6850, listedPriceLabel: "Zillow asking rent", pricingNote: "The description says premium underground parking and storage are included. Zillow's header says available now while the description says mid-August, so the date needs confirmation.", utilitiesIncluded: [], amenities: ["Parking included", "Storage included", "Pool & fitness center"] }),
  condo({ id: "lumina-27d", building: "LUMINA", address: "201 Folsom St", unit: "Unit 27D", beds: 1, baths: 1, sqft: 876, rent: 6895, utilities: 200, parking: 300, parkingConfidence: "Confirmed optional valet parking", moveIn: "2026-09-01", moveInLabel: "Sep 1", postedAt: "2026-07-24T07:00:00.000Z", postedLabel: "Posted Jul 24, 2026", sourceUrl: URLS.lumina27d, deposit: 6895, listedPriceLabel: "Zillow asking rent", pricingNote: "Compass confirms the $300 parking fee and that the tenant pays electricity and gas. The estimate also includes internet and renter's insurance; confirm all building charges before applying.", amenities: ["Valet parking", "Lap pool", "Bridge views"] }),
  compassCondo({ id: "portside-717", building: "Portside", address: "403 Main St", unit: "Unit 717", beds: 1, baths: 1, sqft: 922, rent: 5545, fees: 0, utilities: 175, insurance: 18, parking: 300, parkingConfidence: "Confirmed optional parking fee", moveIn: "2026-09-07", moveInLabel: "Sep 7", postedAt: "2026-08-01T07:00:00.000Z", postedLabel: "Posted Aug 1, 2026", checkedLabel: checkedToday, sourceUrl: URLS.portside, listingUrl: LISTING_URLS.portside717, deposit: 5545, listedPriceLabel: "Compass asking rent", pricingNote: "Compass confirms a $300 monthly parking fee and says the tenant pays electricity. The estimate adds electricity, internet, and renter's insurance; confirm any HOA move-in charge before applying.", utilitiesIncluded: ["Water (verify)", "Garbage (verify)"], amenities: ["Balcony", "In-unit laundry", "Pool & spa"] }),
  compassCondo({ id: "portside-316n", building: "Portside", address: "403 Main St", unit: "Unit 316N", beds: 1, baths: 1, sqft: 862, rent: 5600, fees: 0, utilities: 175, insurance: 18, parking: 300, parkingConfidence: "Estimated from current Unit 717 fee", moveIn: "2026-07-21", moveInLabel: "Available now", postedAt: "2026-07-21T07:00:00.000Z", postedLabel: "Posted Jul 21, 2026", checkedLabel: checkedToday, sourceUrl: URLS.portside, listingUrl: LISTING_URLS.portside316N, deposit: 5600, listedPriceLabel: "Compass asking rent", pricingNote: "The current rent is reduced from $6,000 to $5,600. Compass says the tenant pays electricity and parking is optional; the $300 parking estimate comes from Unit 717 in the same building.", utilitiesIncluded: ["Water (verify)", "Garbage (verify)"], amenities: ["Den", "Bay view", "Pool & spa"] }),

  // Individually verified Zillow listings; inactive rows remain only as refresh history.
  condo({ id: "harrison-11a", building: "The Harrison", address: "401 Harrison St", unit: "Unit 11A", beds: 1, baths: 1, sqft: 840, rent: 6300, utilities: 175, parking: 0, parkingIncluded: true, parkingConfidence: "1 valet space included", moveIn: "2026-08-03", moveInLabel: "Available now", postedAt: "2026-07-14T07:00:00.000Z", postedLabel: "Posted Jul 14, 2026", sourceUrl: URLS.harrison11a, listingUrl: URLS.harrison11a, deposit: 6300, listedPriceLabel: "Zillow asking rent", pricingNote: "Zillow confirms one valet space. Utilities and renter's insurance are estimated; confirm any HOA move-in charge before applying.", amenities: ["Valet parking included", "Den", "Pool & fitness center"], active: false }),
  condo({ id: "181-fremont-58d", building: "181 Fremont Residences", address: "181 Fremont St", unit: "Unit 58D", beds: 2, baths: 2.5, sqft: 1775, rent: 18990, utilities: 225, parking: 450, parkingConfidence: "1 space shown; inclusion not stated", moveIn: "2026-08-03", moveInLabel: "Available now", postedAt: "2026-07-14T07:00:00.000Z", postedLabel: "Posted Jul 14, 2026", sourceUrl: URLS.fremont18158d, listingUrl: URLS.fremont18158d, deposit: 18990, listedPriceLabel: "Zillow asking rent", pricingNote: "The listing shows one parking space but does not say whether it is included, so the total uses a $450 estimate. Utilities, insurance, and any building move-in charge should be confirmed.", amenities: ["Direct Salesforce Park access", "In-unit laundry", "Fitness center"] }),
  condo({ id: "bridgeview-1412", building: "Bridgeview", address: "400 Beale St", unit: "Unit 1412", beds: 2, baths: 2, sqft: 1075, rent: 6800, utilities: 135, parking: 450, parkingConfidence: "Attached garage shown; price not stated", moveIn: "2026-08-01", moveInLabel: "Available now", postedAt: "2026-07-07T07:00:00.000Z", postedLabel: "Posted Jul 7, 2026", sourceUrl: URLS.bridgeview1412, listingUrl: URLS.bridgeview1412, deposit: 6800, listedPriceLabel: "Zillow asking rent", pricingNote: "The HOA covers water, garbage, and gas. Electricity, internet, insurance, and parking are estimated because the listing does not itemize them.", utilitiesIncluded: ["Water", "Garbage", "Gas"], amenities: ["Attached garage", "Pool & spa", "Concierge"] }),
  condo({ id: "infinity-8hl", building: "The Infinity", address: "318 Spear St", unit: "Unit 8H-L", beds: 2, baths: 2, sqft: 1256, rent: 8000, utilities: 175, parking: 450, parkingConfidence: "1 attached space shown; price not stated", moveIn: "2026-08-03", moveInLabel: "Available now", postedAt: "2026-07-11T07:00:00.000Z", postedLabel: "Posted Jul 11, 2026", sourceUrl: URLS.infinity8hl, listingUrl: URLS.infinity8hl, deposit: 8000, listedPriceLabel: "Zillow asking rent", pricingNote: "Zillow shows one attached space but does not state whether it is included. Utilities, insurance, parking, and any Infinity move-in fee should be confirmed.", amenities: ["Attached garage", "Lap pool", "24-hour concierge"] }),
  condo({ id: "metropolitan-n1607", building: "The Metropolitan", address: "333 1st St", unit: "Unit N1607", beds: 2, baths: 2, sqft: 950, rent: 6950, utilities: 135, parking: 0, parkingIncluded: true, parkingConfidence: "1 deeded space included", moveIn: null, moveInLabel: "Confirm date", postedAt: "2026-06-23T07:00:00.000Z", postedLabel: "Posted Jun 23, 2026", sourceUrl: URLS.metropolitanN1607, listingUrl: URLS.metropolitanN1607, sourceLabel: "Zillow/HotPads condo listing", deposit: 6950, listedPriceLabel: "Zillow/HotPads asking rent", pricingNote: "The listing includes one parking space, storage, water, sewer, and trash. The estimate covers electricity, internet, and renter's insurance.", utilitiesIncluded: ["Water", "Sewer", "Garbage"], amenities: ["Parking included", "Storage included", "Pool & fitness center"] }),
];

export const sourceUnits = researchedUnits;

export const trackerSources = [
  { sourceUrl: URLS.hotpadsRincon, kind: "hotpads-neighborhood" },
  {
    sourceUrl: URLS.avery450,
    kind: "related-property",
    legacySourceUrls: [URLS.avery450Legacy],
    template: managed({
      id: "tracker-avery-450",
      building: "Avery 450",
      address: "450 Folsom St",
      unit: "Unit template",
      beds: 1,
      baths: 1,
      sqft: 0,
      rent: 1,
      fees: 0,
      utilities: 175,
      insurance: 18,
      parking: 450,
      parkingConfidence: "Estimated — official site does not publish parking price",
      moveIn: null,
      moveInLabel: "Confirm date",
      sourceUrl: URLS.avery450,
      listingUrl: URLS.avery450,
      deposit: 1,
      listedPriceLabel: "Official asking rent",
      pricingNote: "Rent, unit number, and availability come directly from Avery 450's official Related Rentals website. Utilities, insurance, and parking remain estimates until leasing provides an itemized quote.",
      amenities: ["In-unit laundry", "24-hour lobby", "Valet parking available"],
    }),
  },
  {
    sourceUrl: URLS.fremont399,
    kind: "udr-property",
    template: managed({
      id: "tracker-399-fremont",
      building: "399 Fremont",
      address: "399 Fremont St",
      unit: "Unit template",
      beds: 1,
      baths: 1,
      sqft: 0,
      rent: 1,
      fees: 63,
      utilities: 308,
      insurance: 14,
      parking: 515,
      parkingConfidence: "Confirmed reserved-garage price",
      moveIn: null,
      moveInLabel: "Confirm date",
      sourceUrl: URLS.fremont399,
      listingUrl: URLS.fremont399,
      costSourceUrl: URLS.fremont399Fees,
      deposit: 725,
      applicationFee: 63.9,
      listedPriceLabel: "Base rent",
      pricingNote: "UDR publishes $48 trash, $15 package lockers, $515 reserved parking, and $14 liability coverage. The utility estimate includes usage-based services and internet.",
      amenities: ["In-unit laundry", "24-hour concierge", "Garage parking"],
    }),
  },
  {
    sourceUrl: URLS.harrisonZillow,
    kind: "zillow-building",
    address: "401 Harrison St",
    metadataSourceUrl: URLS.harrisonCompass,
    legacySourceUrls: [URLS.harrisonCompass],
    excludeUnits: ["17B"],
    template: condo({
      id: "tracker-harrison",
      building: "The Harrison",
      address: "401 Harrison St",
      unit: "Unit template",
      beds: 1,
      baths: 1,
      sqft: 0,
      rent: 1,
      utilities: 175,
      parking: 450,
      parkingConfidence: "Estimated — confirm with owner",
      moveIn: null,
      moveInLabel: "Confirm date",
      sourceUrl: URLS.harrisonZillow,
      listingUrl: URLS.harrisonZillow,
      deposit: 1,
      listedPriceLabel: "Zillow asking rent",
      pricingNote: "Rent and availability come from Zillow; parking is checked against the current unit listing.",
    }),
  },
  { sourceUrl: URLS.oneRinconCompass, kind: "compass", template: trackerCondo({ building: "One Rincon Hill", address: "425 1st St", sourceUrl: URLS.oneRinconCompass }) },
  { sourceUrl: URLS.averyCompass, kind: "compass", template: trackerCondo({ building: "The Avery", address: "488 Folsom St", sourceUrl: URLS.averyCompass }) },
  { sourceUrl: URLS.luminaCompass, kind: "compass", template: trackerCondo({ building: "LUMINA", address: "338 Main St", sourceUrl: URLS.luminaCompass, parking: 300, parkingConfidence: "Typical current valet price — confirm" }) },
  { sourceUrl: URLS.infinityCompass, kind: "compass", template: trackerCondo({ building: "The Infinity", address: "301 Main St", sourceUrl: URLS.infinityCompass }) },
  { sourceUrl: URLS.metropolitanCompass, kind: "compass", template: trackerCondo({ building: "The Metropolitan", address: "355 1st St", sourceUrl: URLS.metropolitanCompass }) },
  { sourceUrl: URLS.miraCompass, kind: "compass", template: trackerCondo({ building: "MIRA", address: "280 Spear St", sourceUrl: URLS.miraCompass }) },
  { sourceUrl: URLS.millenniumCompass, kind: "compass", template: trackerCondo({ building: "Millennium Tower", address: "301 Mission St", sourceUrl: URLS.millenniumCompass }) },
];

const refreshedUnitsWithDuplicates = [...researchedUnits, ...(refreshState.discoveredUnits || [])]
  .map((unit) => {
    const refreshed = { ...unit, ...(refreshState.unitOverrides?.[unit.id] || {}) };
    return { ...refreshed, listingUrl: refreshed.listingUrl || refreshed.sourceUrl };
  })
  .filter((unit) => unit.active !== false);

function listingIdentity(unit) {
  const exact = String(unit.unit).match(/\b(?:Unit|Plan)\s+(?:STE\s+)?([A-Z0-9-]+)/i)?.[1];
  return `${String(unit.address).toLowerCase().replace(/[^a-z0-9]+/g, "-")}|${String(exact || unit.unit).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

// Building feeds overlap with Zillow/HotPads and Compass. Keep the first, deepest
// listing we researched instead of showing the same home more than once.
const refreshedUnits = [];
const listingIdentities = new Set();
for (const unit of refreshedUnitsWithDuplicates) {
  const identity = listingIdentity(unit);
  if (listingIdentities.has(identity)) continue;
  listingIdentities.add(identity);
  refreshedUnits.push(unit);
}

export const snapshotMetadata = {
  dataUpdatedAt: refreshState.dataUpdatedAt || "2026-08-02T18:00:00-07:00",
  previousDataUpdatedAt: refreshState.previousDataUpdatedAt || null,
  lastRefreshAttemptAt: refreshState.lastRefreshAttemptAt,
  verifiedSourceCount: refreshState.verifiedSourceCount || 0,
  totalSourceCount: refreshState.totalSourceCount || 14,
};

const NEW_LISTING_WINDOW_MS = 48 * 60 * 60 * 1000;

export function isNewListing(unit, metadata = snapshotMetadata) {
  const postedAt = Date.parse(unit.postedAt);
  const fetchedAt = Date.parse(metadata.dataUpdatedAt);
  const previousTrackerAt = Date.parse(metadata.previousDataUpdatedAt || metadata.dataUpdatedAt);
  if (![postedAt, fetchedAt, previousTrackerAt].every(Number.isFinite)) return false;
  const age = fetchedAt - postedAt;
  return postedAt > previousTrackerAt || (age >= 0 && age <= NEW_LISTING_WINDOW_MS);
}

// Product rule: studios are never exposed, even if a source adapter discovers one.
export const units = refreshedUnits
  .filter((unit) => unit.beds >= 1)
  .map((unit) => ({ ...unit, isNew: isNewListing(unit) }));

const monitoredBuildingCandidates = [
  {
    building: "Jasper",
    address: "45 Lansing St",
    status: "Studios only · excluded",
    detail: "Jasper's official live map currently contains four studio homes and no larger units. The daily tracker will add a qualifying home when one appears.",
    sourceUrl: URLS.jasper,
    tone: "quiet",
  },
];

export const monitoredBuildings = monitoredBuildingCandidates.filter(
  (item) => !units.some((unit) => unit.building === item.building),
);

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

export function sortListings(listings, sort = "total-asc", includeParking = true) {
  return [...listings].sort((a, b) => {
    if (sort === "building-asc") {
      const buildingOrder = a.building.localeCompare(b.building, "en", { numeric: true, sensitivity: "base" });
      if (buildingOrder) return buildingOrder;
      return monthlyTotal(a, includeParking) - monthlyTotal(b, includeParking)
        || a.unit.localeCompare(b.unit, "en", { numeric: true, sensitivity: "base" });
    }
    if (Boolean(a.isNew) !== Boolean(b.isNew)) return a.isNew ? -1 : 1;
    if (sort === "rent-asc") return a.rent - b.rent;
    if (sort === "rent-desc") return b.rent - a.rent;
    if (sort === "total-desc") return monthlyTotal(b, includeParking) - monthlyTotal(a, includeParking);
    return monthlyTotal(a, includeParking) - monthlyTotal(b, includeParking);
  });
}

export function groupListingsByBuilding(listings) {
  const groups = [];
  for (const unit of listings) {
    const current = groups.at(-1);
    if (!current || current.building !== unit.building) {
      groups.push({ building: unit.building, units: [unit] });
    } else {
      current.units.push(unit);
    }
  }
  return groups;
}

export function upfrontTotal(unit) {
  return (unit.deposit || 0) + (unit.applicationFee || 0) + (unit.moveInFee || 0);
}

export function listingLinkLabel(unit) {
  if (unit.sourceType === "zillow-condo" || unit.sourceType === "compass-condo") return "View listing";
  return unit.listingUrl === unit.sourceUrl ? "View availability" : "View listing";
}

export function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
