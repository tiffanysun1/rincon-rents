const PACIFIC_TIME_ZONE = "America/Los_Angeles";

function balancedJsonAfter(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) return null;
  const start = source.indexOf("{", markerIndex + marker.length);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}" && --depth === 0) return source.slice(start, index + 1);
  }
  return null;
}

function balancedJsonFrom(source, start) {
  if (start < 0 || source[start] !== "{") return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}" && --depth === 0) return source.slice(start, index + 1);
  }
  return null;
}

export function formatCheckedLabel(date) {
  return `Checked ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: PACIFIC_TIME_ZONE,
  }).format(date)}`;
}

export function formatPostedLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "Post date not published";
  return `Posted ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: PACIFIC_TIME_ZONE,
  }).format(date)}`;
}

export function toIsoDate(value) {
  if (!value) return null;
  const match = String(value).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;
  const [, month, day, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function formatMoveInLabel(isoDate, now = new Date()) {
  if (!isoDate) return "Confirm date";
  const date = new Date(`${isoDate}T12:00:00-07:00`);
  const today = new Date(now);
  today.setHours(23, 59, 59, 999);
  if (date <= today) return "Available now";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: PACIFIC_TIME_ZONE,
  }).format(date);
}

export function parseEquityAvailability(html) {
  const json = balancedJsonAfter(html, "ea5.unitAvailability =");
  if (!json) return [];
  const payload = JSON.parse(json);
  const listingUrls = new Map(
    [...String(html).matchAll(/href=["']([^"']*\/UnitFees\/\d+\/\d+\/([A-Z0-9]+))["']/gi)]
      .map((match) => [match[2].toLowerCase(), new URL(match[1], "https://www.equityapartments.com/").href]),
  );
  return (payload.BedroomTypes || []).flatMap((group) =>
    (group.AvailableUnits || []).map((unit) => ({
      sourceUnitId: String(unit.UnitId || "").trim(),
      floorplan: String(unit.FloorplanName || "").trim(),
      floor: String(unit.Floor || "").replace(/[^0-9]/g, "") || null,
      beds: Number(unit.Bed ?? group.BedroomCount),
      baths: Number(unit.Bath),
      sqft: Number(unit.SqFt),
      rent: Number(unit.BestTerm?.Price),
      moveIn: toIsoDate(unit.AvailableDate),
      listingUrl: listingUrls.get(String(unit.UnitId || "").toLowerCase()),
    })),
  ).filter((unit) => unit.sourceUnitId && unit.rent > 0 && Number.isFinite(unit.beds));
}

function planToken(value) {
  return String(value).match(/(?:bedroom|bed|plan|studio)\s+([a-z]\d*)/i)?.[1]?.toLowerCase() || null;
}

function equityMatchScore(existing, fresh) {
  if (existing.beds !== fresh.beds) return -1;
  let score = 1;
  if (existing.sqft === fresh.sqft) score += 5;
  if (planToken(existing.unit) && planToken(existing.unit) === planToken(fresh.floorplan)) score += 4;
  if (existing.floor && String(existing.floor) === fresh.floor) score += 2;
  return score;
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function reconcileEquityUnits(existingUnits, freshUnits, checkedAt = new Date()) {
  const eligibleExisting = existingUnits.filter((unit) => unit.beds >= 1);
  const eligibleFresh = freshUnits.filter((unit) => unit.beds >= 1);
  const usedFresh = new Set();
  const overrides = {};
  const discoveredUnits = [];
  const checkedLabel = formatCheckedLabel(checkedAt);

  for (const existing of eligibleExisting) {
    const ranked = eligibleFresh
      .map((fresh, index) => ({ fresh, index, score: usedFresh.has(index) ? -1 : equityMatchScore(existing, fresh) }))
      .sort((a, b) => b.score - a.score);
    const match = ranked[0];
    if (!match || match.score < 5) {
      overrides[existing.id] = { active: false };
      continue;
    }
    usedFresh.add(match.index);
    overrides[existing.id] = {
      active: true,
      unit: `Unit ${match.fresh.sourceUnitId} · ${match.fresh.floorplan}`,
      floor: match.fresh.floor ? Number(match.fresh.floor) : existing.floor,
      beds: match.fresh.beds,
      baths: match.fresh.baths,
      sqft: match.fresh.sqft,
      rent: match.fresh.rent,
      moveIn: match.fresh.moveIn,
      moveInLabel: formatMoveInLabel(match.fresh.moveIn, checkedAt),
      checkedLabel,
    };
    if (match.fresh.listingUrl) overrides[existing.id].listingUrl = match.fresh.listingUrl;
  }

  eligibleFresh.forEach((fresh, index) => {
    if (usedFresh.has(index)) return;
    const template = eligibleExisting.find((unit) => unit.beds === fresh.beds) || eligibleExisting[0];
    if (!template) return;
    discoveredUnits.push({
      ...template,
      id: `auto-${slug(template.building)}-${slug(fresh.sourceUnitId)}`,
      unit: `Unit ${fresh.sourceUnitId} · ${fresh.floorplan}`,
      floor: fresh.floor ? Number(fresh.floor) : undefined,
      beds: fresh.beds,
      baths: fresh.baths,
      sqft: fresh.sqft,
      rent: fresh.rent,
      moveIn: fresh.moveIn,
      moveInLabel: formatMoveInLabel(fresh.moveIn, checkedAt),
      checkedLabel,
      listingUrl: fresh.listingUrl || template.listingUrl,
      pricingNote: `${template.building} availability and rent were refreshed automatically from its structured building feed. Non-rent estimates use the building's existing cost model and should still be confirmed.`,
    });
  });

  return { overrides, discoveredUnits, matchedCount: Object.values(overrides).filter((item) => item.active).length };
}

export function parseEssexAvailabilityText(bodyText) {
  const plan = String(bodyText).match(/\nPlan ([^\n]+)\nStep 2/)?.[1]?.trim() || "Unknown";
  return [...String(bodyText).matchAll(/Starting base rent \$([\d,]+)\s+Unit #\s+([A-Z0-9]+)\s+(\d+) Bed \/ ([\d.]+) Bath\s+([\d,]+) sq\. ft\.\s+Available as soon as:\s+(\d{2}\/\d{2}\/\d{4})/g)]
    .map((match) => ({
      sourceUnitId: match[2],
      floorplan: plan,
      beds: Number(match[3]),
      baths: Number(match[4]),
      sqft: Number(match[5].replaceAll(",", "")),
      rent: Number(match[1].replaceAll(",", "")),
      moveIn: toIsoDate(match[6]),
    }))
    .filter((unit) => unit.sourceUnitId && unit.rent > 0);
}

export function parseSolaireAvailability(html, baseUrl = "https://solairesf.com/") {
  const script = String(html).match(/<script\b[^>]*\bid=["']jd-fp-data-script-app["'][^>]*>([\s\S]*?)<\/script>/i)?.[1];
  if (!script) return [];
  const payload = JSON.parse(script);

  return (payload.units || []).map((unit) => {
    const beds = /studio/i.test(String(unit.bedrooms)) ? 0 : Number(unit.bedrooms);
    const rent = Number(unit.price_entity?.adjusted?.low_no_fees ?? String(unit.price || "").replace(/[^0-9.]/g, ""));
    const total = Number(unit.price_entity?.adjusted?.low ?? unit.rent_min);
    const availableAt = Number(unit.available_date);
    const fees = Number.isFinite(total) && Number.isFinite(rent)
      ? Math.max(0, Math.round((total - rent) * 100) / 100)
      : undefined;
    return {
      sourceUnitId: String(unit.apartment_number || "").trim(),
      floorplan: String(unit.floorplan_title || "Unknown").trim(),
      beds,
      baths: Number(unit.bathrooms),
      sqft: Number(unit.square_feet),
      rent,
      fees,
      moveIn: Number.isFinite(availableAt) ? new Date(availableAt * 1000).toISOString().slice(0, 10) : null,
      listingUrl: unit.permalink ? new URL(unit.permalink, baseUrl).href : baseUrl,
    };
  }).filter((unit) => unit.sourceUnitId && unit.rent > 0 && Number.isFinite(unit.beds));
}

export function parseSightMapAvailability(html, listingUrl) {
  const scripts = [...String(html).matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of scripts) {
    let payload;
    try {
      payload = JSON.parse(match[1]);
    } catch {
      continue;
    }
    const apartments = payload?.about?.containsPlace;
    if (!Array.isArray(apartments)) continue;
    return apartments.map((apartment) => ({
      sourceUnitId: String(apartment.name || "").replace(/^APT\s+/i, "").trim(),
      sourceKind: "unit",
      floorplan: null,
      beds: Number(apartment.numberOfBedrooms),
      baths: Number(apartment.numberOfBathroomsTotal),
      sqft: Number(apartment.floorSize?.value),
      rent: Number(apartment.offers?.price),
      moveIn: apartment.offers?.availabilityStarts || null,
      listingUrl,
    })).filter((unit) => unit.sourceUnitId && unit.rent > 0 && Number.isFinite(unit.beds));
  }
  return null;
}

function htmlAttribute(source, name) {
  return String(source).match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"))?.[1] || null;
}

function monthDayToIsoDate(value, checkedAt = new Date()) {
  const match = String(value || "").match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!match) return null;
  const year = Number(new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    timeZone: PACIFIC_TIME_ZONE,
  }).format(checkedAt));
  const month = match[1].padStart(2, "0");
  const day = match[2].padStart(2, "0");
  let candidate = `${year}-${month}-${day}`;
  const candidateDate = new Date(`${candidate}T12:00:00-07:00`);
  if (candidateDate.valueOf() < checkedAt.valueOf() - 120 * 86_400_000) {
    candidate = `${year + 1}-${month}-${day}`;
  }
  return candidate;
}

export function parseRelatedAveryAvailability(html, baseUrl, checkedAt = new Date()) {
  return [...String(html).matchAll(/<article\b([^>]*\bdata-api-id=["'][^"']+["'][^>]*)>([\s\S]*?)<\/article>/gi)]
    .map((match) => {
      const attributes = match[1];
      const content = match[2];
      const apiId = htmlAttribute(attributes, "data-api-id");
      const href = content.match(/<a\b[^>]*\bhref=["']([^"']+)["']/i)?.[1];
      const title = content.match(/<p\b[^>]*class=["'][^"']*\btitle\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/i)?.[1]
        ?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const variant = htmlAttribute(attributes, "data-variant") || "";
      const beds = Number(htmlAttribute(attributes, "data-dimension6") ?? variant.match(/([\d.]+)bd/i)?.[1]);
      const baths = Number(htmlAttribute(attributes, "data-dimension7") ?? variant.match(/([\d.]+)ba/i)?.[1]);
      const rent = Number(String(htmlAttribute(attributes, "data-price") || "").replaceAll(",", ""));
      return {
        sourceUnitId: apiId,
        sourceKind: "unit",
        floorplan: title || null,
        beds,
        baths,
        sqft: 0,
        rent,
        deposit: rent,
        moveIn: monthDayToIsoDate(htmlAttribute(attributes, "data-dimension9"), checkedAt),
        listingUrl: href ? new URL(href, baseUrl).href : baseUrl,
      };
    })
    .filter((unit) => unit.sourceUnitId && unit.rent > 0 && Number.isFinite(unit.beds));
}

export function parseRelatedAveryUnitDetail(html) {
  const title = String(html).match(/<title>[^<]*Apartment\s+#?([A-Z0-9-]+)\s+at\s+Avery\s+450[^<]*<\/title>/i);
  const descriptionUnit = String(html).match(/\bApartment\s+#?([A-Z0-9-]+)\s*\./i);
  const sourceUnitId = title?.[1] || descriptionUnit?.[1];
  return sourceUnitId ? { sourceUnitId } : null;
}

export function parseZillowBuildingAvailability(html, baseUrl) {
  const script = String(html).match(/<script\b[^>]*\bid=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)?.[1];
  if (!script) return null;
  let payload;
  try {
    payload = JSON.parse(script);
  } catch {
    return null;
  }
  const listings = payload?.props?.pageProps?.componentProps?.initialReduxState?.gdp?.building?.ungroupedUnits;
  if (!Array.isArray(listings)) return null;
  return listings
    .filter((listing) => listing.listingType === "FOR_RENT" && listing.zpid && listing.hdpUrl)
    .map((listing) => ({
      sourceUnitId: String(listing.unitNumber || "").replace(/^Unit\s+/i, "").trim(),
      sourceKind: "unit",
      floorplan: null,
      address: /\/489-Harrison-St-/i.test(listing.hdpUrl) ? "489 Harrison St" : "401 Harrison St",
      beds: Number(listing.beds),
      baths: Number(listing.baths),
      sqft: Number(listing.sqft),
      rent: Number(listing.baseRent ?? listing.price),
      deposit: Number(listing.baseRent ?? listing.price),
      availableImmediately: String(listing.availableFrom) === "0",
      listingUrl: new URL(listing.hdpUrl, baseUrl).href,
    }))
    .filter((unit) => unit.sourceUnitId && unit.rent > 0 && Number.isFinite(unit.beds));
}

function namedDateToIso(value) {
  if (!value) return null;
  const parsed = new Date(`${value} 12:00:00 GMT-0700`);
  if (Number.isNaN(parsed.valueOf())) return null;
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

export function parseCompassRentalDetail(html, checkedAt = new Date()) {
  const source = String(html);
  const text = source.replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/\s+/g, " ");
  let description = "";
  let amenities = [];
  const jsonLd = source.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i)?.[1];
  if (jsonLd) {
    try {
      const payload = JSON.parse(jsonLd);
      const graph = Array.isArray(payload) ? payload : (payload?.["@graph"] || [payload]);
      const listing = graph.find((item) => item?.description && (item?.numberOfBedrooms !== undefined || item?.offers));
      description = String(listing?.description || "");
      amenities = (listing?.amenityFeature || []).map((item) => String(item?.name || ""));
    } catch {
      // Structured details are an enhancement; the visible facts below are still usable.
    }
  }

  const fee = Number(text.match(/Parking Fee \$:\s*\$?([\d,.]+)/i)?.[1]?.replaceAll(",", ""));
  const parkingFeesYes = /Parking Fees:\s*Yes/i.test(text);
  const parkingFeesNo = /Parking Fees:\s*No/i.test(text);
  const includedInDescription = /(?:lease|rent)\s+includes?[^.]{0,80}(?:valet\s+)?parking|(?:one|1|two|2)\s+(?:car\s+)?parking[^.]{0,40}included/i.test(description);
  const parkingIncluded = parkingFeesYes && Number.isFinite(fee) && fee > 0
    ? false
    : parkingFeesNo || includedInDescription || amenities.some((item) => /^Parking Included$/i.test(item));
  const spaces = Number(text.match(/Total Parking Spaces\s*([\d.]+)/i)?.[1]
    || text.match(/Num of Parking Spaces:\s*([\d.]+)/i)?.[1]);

  const namedDate = description.match(/(?:move[- ]?in\s+(?:is\s+)?available|available\s+for\s+occupancy|ready\s+for\s+occupancy)\s*(?:beginning|on)?\s*([A-Z][a-z]+\s+\d{1,2},\s+\d{4})/i)?.[1];
  const moveIn = namedDateToIso(namedDate)
    || (/\bavailable now\b/i.test(description) ? pacificIsoDate(checkedAt) : null);

  const result = { moveIn };
  if (parkingIncluded) {
    result.parkingIncluded = true;
    result.parking = 0;
    result.parkingConfidence = `${Number.isFinite(spaces) && spaces > 1 ? `${spaces} spaces` : "1 valet space"} included`;
  } else if (parkingFeesYes && Number.isFinite(fee) && fee > 0) {
    result.parkingIncluded = false;
    result.parking = fee;
    result.parkingConfidence = "Confirmed listing parking fee";
  }
  return result;
}

export function parseCompassBuildingAvailability(html, baseUrl) {
  const source = String(html);
  const marker = '"units":{"0":{"listings":[';
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) return null;
  const start = source.indexOf("{", markerIndex + '"units":'.length);
  const json = balancedJsonFrom(source, start);
  if (!json) return null;
  const payload = JSON.parse(json);
  return (payload["1"]?.listings || [])
    .filter((listing) => listing.localizedStatus === "Active")
    .map((listing) => ({
      sourceUnitId: String(listing.location?.unitNumber || "").trim(),
      sourceKind: "unit",
      floorplan: null,
      beds: Number(listing.size?.bedrooms),
      baths: Number(listing.size?.bathrooms),
      sqft: Number(listing.size?.squareFeet),
      rent: Number(listing.price?.lastKnown),
      postedAt: Number.isFinite(listing.date?.lastStatusChange)
        ? new Date(listing.date.lastStatusChange).toISOString()
        : null,
      listingUrl: listing.navigationPageLink ? new URL(listing.navigationPageLink, baseUrl).href : baseUrl,
    }))
    .filter((unit) => unit.sourceUnitId && unit.rent > 0 && Number.isFinite(unit.beds));
}

function hotPadsState(html) {
  const json = balancedJsonAfter(String(html), "window.__PRELOADED_STATE__ =");
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const MANAGED_HOTPADS_BUILDINGS = new Set([
  "401 harrison st",
  "333 fremont",
  "340 fremont",
  "388 beale",
  "399 fremont",
  "jasper",
  "modera rincon hill",
]);

export function parseHotPadsNeighborhoodSources(html, baseUrl = "https://hotpads.com/") {
  const state = hotPadsState(html);
  const groups = state?.listings?.listingGroups?.byCoords;
  if (!Array.isArray(groups)) return null;
  return groups
    .filter((listing) => listing?.active && listing.uriV2)
    .filter((listing) => !MANAGED_HOTPADS_BUILDINGS.has(String(listing.displayName || "").toLowerCase()))
    .map((listing) => new URL(listing.uriV2, baseUrl).href);
}

function hotPadsBuildingName(address) {
  const key = String(address || "").toLowerCase().replace(/\s+/g, " ").trim();
  const names = new Map([
    ["181 fremont st", "181 Fremont Residences"],
    ["201 folsom st", "LUMINA"],
    ["333 beale st", "LUMINA"],
    ["338 main st", "LUMINA"],
    ["301 main st", "The Infinity"],
    ["318 spear st", "The Infinity"],
    ["338 spear st", "The Infinity"],
    ["333 1st st", "The Metropolitan"],
    ["355 1st st", "The Metropolitan"],
    ["400 beale st", "Bridgeview"],
    ["403 main st", "Portside"],
    ["401 harrison st", "The Harrison"],
    ["425 1st st", "One Rincon Hill"],
    ["489 harrison st", "One Rincon Hill"],
    ["450 folsom st", "Avery 450"],
    ["488 folsom st", "The Avery"],
    ["280 spear st", "MIRA"],
    ["301 mission st", "Millennium Tower"],
    ["201 harrison st", "Baycrest"],
    ["50 lansing st", "50 Lansing"],
  ]);
  return names.get(key) || String(address || "Unknown building").replace(/\s+(?:St|Street)$/i, "");
}

function hotPadsPostedAt(listing, checkedAt) {
  if (Number.isFinite(listing.created)) return new Date(listing.created).toISOString();
  const age = String(listing.createdAgo || "").toLowerCase();
  const days = Number(age.match(/(\d+)\s+days?/)?.[1]);
  if (Number.isFinite(days)) return new Date(checkedAt.valueOf() - days * 86_400_000).toISOString();
  if (/today|hours?|minutes?/.test(age)) return checkedAt.toISOString();
  return null;
}

function hotPadsMoveIn(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  return toIsoDate(text);
}

function hotPadsUnit(listing, baseUrl, checkedAt) {
  const range = listing.listingMinMaxPriceBeds || {};
  const description = String(listing.details?.fullDescription || "");
  const listingUrl = listing.uriV2 ? new URL(listing.uriV2, baseUrl).href : baseUrl;
  if (/pad-for-sublet/i.test(listingUrl) || /\b(?:room for rent|private (?:furnished )?bedroom|shared access)\b/i.test(description)) return null;

  const displayUnit = String(listing.displayName || "").match(/#\s*([^,]+)/)?.[1]?.trim();
  const pathParts = new URL(listingUrl).pathname.split("/").filter(Boolean);
  const pathUnit = pathParts.at(-1) === "pad" && pathParts.length >= 3 ? pathParts.at(-2) : null;
  const sourceUnitId = displayUnit || (pathUnit ? pathUnit.toUpperCase() : "Home");
  const address = String(listing.address?.street || "").trim();
  const beds = Number(range.minBeds ?? listing.beds);
  const baths = Number(range.minBaths ?? listing.baths);
  const sqft = Number(range.minSqft ?? listing.sqft ?? 0);
  const rent = Number(range.minPrice ?? listing.rent);
  if (!address || !sourceUnitId || !Number.isFinite(beds) || beds < 1 || !Number.isFinite(rent) || rent <= 0) return null;

  const amenities = listing.amenities?.amenities || [];
  const amenitiesText = amenities.join(" ");
  const deposit = Number(amenitiesText.match(/Deposit Fee Minimum:\s*([\d.]+)/i)?.[1]
    || description.match(/security deposit(?:\s+is|:)?\s*\$?([\d,]+)/i)?.[1]?.replaceAll(",", ""));
  const applicationFee = Number(description.match(/application fee(?:\s+is|:)?\s*\$?([\d,]+)/i)?.[1]?.replaceAll(",", ""));
  const utilitiesIncluded = [
    /water included|owner pays (?:for )?water/i.test(`${amenitiesText} ${description}`) ? "Water" : null,
    /garbage included|trash included|owner pays (?:for )?(?:trash|garbage)/i.test(`${amenitiesText} ${description}`) ? "Garbage" : null,
    /internet included/i.test(`${amenitiesText} ${description}`) ? "Internet" : null,
    /gas included|owner pays (?:for )?gas/i.test(`${amenitiesText} ${description}`) ? "Gas" : null,
  ].filter(Boolean);
  const parkingIncluded = /(?:parking|garage)(?: space)?\s+(?:is\s+)?included|(?:one|1)[ -](?:car )?parking(?: space)? included/i.test(description)
    && !/(?:parking|garage)\s+(?:is\s+)?not included/i.test(description);
  const parkingPrice = Number(description.match(/(?:parking|garage)[^.$]{0,50}\$\s*([\d,]+)/i)?.[1]?.replaceAll(",", "")
    || description.match(/\$\s*([\d,]+)[^.$]{0,30}(?:parking|garage)/i)?.[1]?.replaceAll(",", ""));

  return {
    sourceUnitId,
    sourceKind: "unit",
    floorplan: listing.floorplan || null,
    building: hotPadsBuildingName(address),
    address,
    beds,
    baths: Number.isFinite(baths) ? baths : 0,
    sqft: Number.isFinite(sqft) ? sqft : 0,
    rent,
    moveIn: hotPadsMoveIn(listing.details?.availabilityDate || listing.availabilityDate),
    postedAt: hotPadsPostedAt(listing, checkedAt),
    listingUrl,
    parkingIncluded,
    parking: parkingIncluded ? 0 : (Number.isFinite(parkingPrice) && parkingPrice > 0 ? parkingPrice : 450),
    parkingConfidence: parkingIncluded
      ? "Listing says parking is included"
      : (Number.isFinite(parkingPrice) && parkingPrice > 0 ? "Listing price" : "Estimated — confirm with owner"),
    utilitiesIncluded,
    deposit: Number.isFinite(deposit) ? deposit : rent,
    applicationFee: Number.isFinite(applicationFee) ? applicationFee : 40,
    leaseTerm: listing.details?.leaseTerms || "Confirm with owner",
  };
}

export function parseHotPadsAvailability(html, baseUrl, checkedAt = new Date(), allowInactive = false) {
  const state = hotPadsState(html);
  const listing = state?.currentListingDetails?.currentListing;
  if (!listing) return null;

  if (Array.isArray(listing.floorplans) && listing.floorplans.some((floorplan) => floorplan.units?.length)) {
    return listing.floorplans.flatMap((floorplan) => (floorplan.units || []).map((unit) => hotPadsUnit({
      ...listing,
      active: true,
      displayName: `${listing.address?.street || "Home"} #${unit.name}`,
      floorplan: floorplan.name,
      createdAgo: unit.createdAgo,
      created: undefined,
      availabilityDate: unit.availabilityDate,
      listingMinMaxPriceBeds: {
        minBeds: unit.beds,
        minBaths: unit.baths,
        minSqft: unit.sqft,
        minPrice: unit.low,
      },
    }, baseUrl, checkedAt))).filter(Boolean);
  }

  const candidates = Array.isArray(listing.units) && listing.units.length
    ? listing.units.filter((unit) => unit.active !== false)
    : [listing];
  return candidates.filter((unit) => allowInactive || unit.active !== false).map((unit) => hotPadsUnit(unit, baseUrl, checkedAt)).filter(Boolean);
}

export function reconcileHotPadsListings(freshUnits, sourceUrl, checkedAt = new Date()) {
  const checkedLabel = formatCheckedLabel(checkedAt);
  const seen = new Set();
  const discoveredUnits = [];
  for (const fresh of freshUnits.filter((unit) => unit.beds >= 1)) {
    const key = `${slug(fresh.address)}-${slug(fresh.sourceUnitId)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const baseUtilityEstimate = fresh.beds >= 3 ? 275 : fresh.beds >= 2 ? 225 : 175;
    const utilities = Math.max(90, baseUtilityEstimate - fresh.utilitiesIncluded.length * 20);
    discoveredUnits.push({
      id: `auto-zillow-${key}`,
      building: fresh.building,
      address: fresh.address,
      unit: `Unit ${fresh.sourceUnitId}${fresh.floorplan ? ` · ${fresh.floorplan}` : ""}`,
      beds: fresh.beds,
      baths: fresh.baths,
      sqft: fresh.sqft,
      rent: fresh.rent,
      fees: 0,
      utilities,
      insurance: 18,
      parking: fresh.parking,
      parkingIncluded: fresh.parkingIncluded,
      parkingConfidence: fresh.parkingConfidence,
      utilitiesIncluded: fresh.utilitiesIncluded,
      moveIn: fresh.moveIn,
      moveInLabel: formatMoveInLabel(fresh.moveIn, checkedAt),
      postedAt: fresh.postedAt,
      postedLabel: formatPostedLabel(fresh.postedAt),
      checkedLabel,
      sourceType: "zillow-condo",
      sourceLabel: "Zillow/HotPads rental listing",
      sourceUrl,
      listingUrl: fresh.listingUrl,
      confidence: "High",
      leaseTerm: fresh.leaseTerm,
      deposit: fresh.deposit,
      applicationFee: fresh.applicationFee,
      moveInFee: 0,
      listedPriceLabel: "Zillow/HotPads asking rent",
      pricingNote: "Rent and availability come from the live Zillow/HotPads listing. Utilities, insurance, parking, and any HOA move-in charge are estimated when the listing does not itemize them.",
      amenities: ["In-unit laundry", "Building amenities"],
      active: true,
    });
  }
  return { overrides: {}, discoveredUnits, matchedCount: discoveredUnits.length };
}

function pacificIsoDate(date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: PACIFIC_TIME_ZONE,
    }).formatToParts(date).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function parseUdrAvailabilityCards(cards, checkedAt = new Date()) {
  return cards.map((card) => {
    const text = String(card.text || "").replace(/\s+/g, " ");
    const unit = text.match(/\bApartment\s+([A-Z0-9]+)/i)?.[1];
    const specs = text.match(/\b(Studio|(\d+)\s+Beds?)\s*\|\s*([\d.]+)\s+Baths?\s*\|\s*([\d,]+)\s+Sq\.\s*Ft/i);
    const rent = Number(text.match(/Rent starting at:\s*\$([\d,]+)/i)?.[1]?.replaceAll(",", ""));
    const available = text.match(/Available Date:\s*(Now|\d{1,2}\/\d{1,2}\/\d{4})/i)?.[1];
    return {
      sourceUnitId: String(unit || "").trim(),
      floorplan: text.match(/Floor Plan:\s*Plan\s+([A-Z0-9]+)/i)?.[1] || "Unknown",
      beds: /^studio$/i.test(specs?.[1] || "") ? 0 : Number(specs?.[2]),
      baths: Number(specs?.[3]),
      sqft: Number(specs?.[4]?.replaceAll(",", "")),
      rent,
      deposit: Number(text.match(/Deposit starting at:\s*\$([\d,]+)/i)?.[1]?.replaceAll(",", "")),
      moveIn: /^now$/i.test(available || "") ? pacificIsoDate(checkedAt) : toIsoDate(available),
      listingUrl: card.listingUrl,
    };
  }).filter((unit) => unit.sourceUnitId && unit.rent > 0 && Number.isFinite(unit.beds));
}

export function parseUdrPropertyModel(html, baseUrl, checkedAt = new Date()) {
  const json = balancedJsonAfter(String(html), "window.udr.jsonObjPropertyViewModel =");
  if (!json) return null;
  const payload = JSON.parse(json);
  return (payload.floorPlans || []).flatMap((floorplan) => (floorplan.units || []).map((unit) => {
    const available = unit.AvailableDateLabel;
    return {
      sourceUnitId: String(unit.marketingName || unit.marketingFullName || "").replace(/^STE\s+/i, "").trim(),
      sourceKind: "unit",
      floorplan: String(unit.floorplanName || floorplan.Name || "Unknown").replace(/^Plan\s+/i, ""),
      beds: Number(unit.bedrooms ?? floorplan.bedRooms),
      baths: Number(unit.bathrooms ?? floorplan.bathRooms),
      sqft: Number(unit.sqFt),
      rent: Number(unit.lowestRent?.baseRent ?? unit.lowestRent?.rent),
      fees: Number(unit.monthlyCharges) > 0 ? Number(unit.monthlyCharges) : undefined,
      deposit: Number(unit.deposit ?? floorplan.deposit),
      moveIn: /^now$/i.test(String(available || "")) ? pacificIsoDate(checkedAt) : toIsoDate(available),
      listingUrl: unit.previewLink ? new URL(unit.previewLink, baseUrl).href : baseUrl,
      active: unit.isAvailable !== false,
    };
  })).filter((unit) => unit.active && unit.sourceUnitId && unit.rent > 0 && Number.isFinite(unit.beds));
}

export function parseModeraAvailabilityCards(cards) {
  return cards.map((card) => {
    const text = String(card.text || "").replace(/\s+/g, " ").trim();
    const specs = text.match(/^(\S+).*?Beds \/ Baths\s*(Studio|(\d+)\s*bd)\s*\/\s*([\d.]+)\s*ba/i);
    const available = text.match(/Available\s+([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})/i)?.[1];
    const availableDate = available ? new Date(`${available} 12:00:00 GMT-0700`) : null;
    return {
      sourceUnitId: specs?.[1],
      sourceKind: "plan",
      floorplan: specs?.[1],
      beds: /^studio$/i.test(specs?.[2] || "") ? 0 : Number(specs?.[3]),
      baths: Number(specs?.[4]),
      sqft: Number(text.match(/Sq\.\s*Ft\s*([\d,]+)/i)?.[1]?.replaceAll(",", "")),
      rent: Number(text.match(/\$([\d,]+)/)?.[1]?.replaceAll(",", "")),
      deposit: Number(text.match(/Deposit\s*\$([\d,]+)/i)?.[1]?.replaceAll(",", "")),
      moveIn: availableDate && !Number.isNaN(availableDate.valueOf()) ? availableDate.toISOString().slice(0, 10) : null,
      listingUrl: card.listingUrl,
    };
  }).filter((unit) => unit.sourceUnitId && unit.rent > 0 && Number.isFinite(unit.beds));
}

export function rentCafeListingUrlFromOnclick(onclick) {
  const url = String(onclick || "").match(/openApplyNow\('([^']+)/)?.[1];
  return url ? url.replaceAll("\\u0026", "&").replaceAll("&amp;", "&") : null;
}

function exactUnitId(unitLabel) {
  return String(unitLabel).match(/\b(?:Unit|Plan)\s+([A-Z0-9]+)/i)?.[1]?.toLowerCase() || null;
}

export function reconcileExactFeedUnits(existingUnits, freshUnits, checkedAt = new Date(), fallbackTemplate = null) {
  const eligibleExisting = existingUnits.filter((unit) => unit.beds >= 1);
  const eligibleFresh = freshUnits.filter((unit) => unit.beds >= 1);
  const byId = new Map(eligibleExisting.map((unit) => [exactUnitId(unit.unit), unit]));
  const overrides = {};
  const discoveredUnits = [];
  const matchedIds = new Set();
  const checkedLabel = formatCheckedLabel(checkedAt);

  for (const fresh of eligibleFresh) {
    const key = String(fresh.sourceUnitId).toLowerCase();
    const existing = byId.get(key);
    const moveIn = fresh.moveIn === undefined ? (existing?.moveIn || null) : fresh.moveIn;
    const values = {
      active: true,
      unit: fresh.sourceKind === "plan"
        ? `Plan ${fresh.sourceUnitId}`
        : `Unit ${fresh.sourceUnitId}${fresh.floorplan ? ` · Plan ${fresh.floorplan}` : ""}`,
      beds: fresh.beds,
      baths: fresh.baths,
      rent: fresh.rent,
      moveIn,
      moveInLabel: fresh.moveIn === undefined
        ? (existing?.moveInLabel || "Confirm date")
        : formatMoveInLabel(moveIn, checkedAt),
      checkedLabel,
    };
    if (Number.isFinite(fresh.sqft) && fresh.sqft > 0) values.sqft = fresh.sqft;
    if (fresh.postedAt) {
      values.postedAt = fresh.postedAt;
      values.postedLabel = fresh.postedLabel || formatPostedLabel(fresh.postedAt);
    }
    if (fresh.listingUrl) values.listingUrl = fresh.listingUrl;
    if (Number.isFinite(fresh.fees)) values.fees = fresh.fees;
    if (Number.isFinite(fresh.deposit)) values.deposit = fresh.deposit;
    if (Number.isFinite(fresh.utilities)) values.utilities = fresh.utilities;
    if (Number.isFinite(fresh.parking)) values.parking = fresh.parking;
    if (typeof fresh.parkingIncluded === "boolean") values.parkingIncluded = fresh.parkingIncluded;
    if (fresh.parkingConfidence) values.parkingConfidence = fresh.parkingConfidence;
    if (fresh.leaseTerm) values.leaseTerm = fresh.leaseTerm;
    if (fresh.pricingNote) values.pricingNote = fresh.pricingNote;
    if (Array.isArray(fresh.amenities)) values.amenities = fresh.amenities;
    if (existing) {
      overrides[existing.id] = values;
      matchedIds.add(existing.id);
      continue;
    }
    const template = eligibleExisting.find((unit) => unit.beds === fresh.beds) || eligibleExisting[0] || fallbackTemplate;
    if (!template) continue;
    discoveredUnits.push({
      ...template,
      ...values,
      id: `auto-${slug(template.building)}-${slug(fresh.sourceUnitId)}`,
      pricingNote: `${template.building} rent and availability were refreshed automatically from its official unit feed. Non-rent estimates still require confirmation.`,
    });
  }

  for (const existing of eligibleExisting) {
    if (!matchedIds.has(existing.id)) overrides[existing.id] = { active: false };
  }
  return { overrides, discoveredUnits, matchedCount: matchedIds.size + discoveredUnits.length };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function listingKey(unitLabel) {
  const match = String(unitLabel).match(/\b(Unit|Plan)\s+([A-Z0-9-]+)/i);
  return match ? { type: match[1].toLowerCase(), value: match[2] } : null;
}

export function extractKnownUnitOverride(bodyText, unit, checkedAt = new Date()) {
  const key = listingKey(unit.unit);
  if (!key) return null;
  const normalized = String(bodyText).replace(/\s+/g, " ");
  const prefix = key.type === "unit" ? "(?:unit|apt(?:artment)?|#)\\s*#?" : "(?:plan|floorplan)\\s*";
  const keyPattern = new RegExp(`${prefix}${escapeRegex(key.value)}\\b`, "i");
  const keyMatch = keyPattern.exec(normalized);
  if (!keyMatch) return null;

  const segment = normalized.slice(Math.max(0, keyMatch.index - 260), keyMatch.index + 760);
  const prices = [...segment.matchAll(/\$\s*([0-9][0-9,]{3,})/g)]
    .map((match) => Number(match[1].replaceAll(",", "")))
    .filter((price) => price >= 2500 && price <= 20000 && price >= unit.rent * 0.6 && price <= unit.rent * 1.6)
    .sort((a, b) => Math.abs(a - unit.rent) - Math.abs(b - unit.rent));
  if (!prices.length) return null;

  const dateMatch = segment.match(/(?:available|move[- ]?in(?: date)?)\s*(?:on|from|:)?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
  const moveIn = dateMatch ? toIsoDate(dateMatch[1]) : unit.moveIn;
  return {
    active: true,
    rent: prices[0],
    moveIn,
    moveInLabel: moveIn ? formatMoveInLabel(moveIn, checkedAt) : unit.moveInLabel,
    checkedLabel: formatCheckedLabel(checkedAt),
  };
}

export function extractRentCafeUnitOverride(bodyText, unit, checkedAt = new Date()) {
  const key = exactUnitId(unit.unit);
  if (!key) return null;
  const normalized = String(bodyText).replace(/\s+/g, " ");
  const pattern = new RegExp(`\\b${escapeRegex(key)}\\s+\\$([\\d,]+)\\s*-\\s*\\$[\\d,]+\\s+(Now|[A-Z][a-z]{2} \\d{1,2})\\b`, "i");
  const match = normalized.match(pattern);
  if (!match) return null;

  let moveIn = unit.moveIn;
  if (/^now$/i.test(match[2])) {
    moveIn = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: PACIFIC_TIME_ZONE,
    }).format(checkedAt);
  } else {
    const parsed = new Date(`${match[2]}, ${checkedAt.getFullYear()} 12:00:00 GMT-0700`);
    if (!Number.isNaN(parsed.valueOf())) {
      moveIn = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
    }
  }
  return {
    active: true,
    rent: Number(match[1].replaceAll(",", "")),
    moveIn,
    moveInLabel: formatMoveInLabel(moveIn, checkedAt),
    checkedLabel: formatCheckedLabel(checkedAt),
  };
}
