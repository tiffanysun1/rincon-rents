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
      sqft: fresh.sqft,
      rent: fresh.rent,
      moveIn,
      moveInLabel: fresh.moveIn === undefined
        ? (existing?.moveInLabel || "Confirm date")
        : formatMoveInLabel(moveIn, checkedAt),
      checkedLabel,
    };
    if (fresh.postedAt) {
      values.postedAt = fresh.postedAt;
      values.postedLabel = formatPostedLabel(fresh.postedAt);
    }
    if (fresh.listingUrl) values.listingUrl = fresh.listingUrl;
    if (Number.isFinite(fresh.fees)) values.fees = fresh.fees;
    if (Number.isFinite(fresh.deposit)) values.deposit = fresh.deposit;
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
  return { overrides, discoveredUnits, matchedCount: matchedIds.size };
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
