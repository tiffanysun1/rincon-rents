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

export function formatCheckedLabel(date) {
  return `Checked ${new Intl.DateTimeFormat("en-US", {
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

function exactUnitId(unitLabel) {
  return String(unitLabel).match(/\bUnit\s+([A-Z0-9]+)/i)?.[1]?.toLowerCase() || null;
}

export function reconcileExactFeedUnits(existingUnits, freshUnits, checkedAt = new Date()) {
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
    const values = {
      active: true,
      unit: `Unit ${fresh.sourceUnitId} · Plan ${fresh.floorplan}`,
      beds: fresh.beds,
      baths: fresh.baths,
      sqft: fresh.sqft,
      rent: fresh.rent,
      moveIn: fresh.moveIn,
      moveInLabel: formatMoveInLabel(fresh.moveIn, checkedAt),
      checkedLabel,
    };
    if (existing) {
      overrides[existing.id] = values;
      matchedIds.add(existing.id);
      continue;
    }
    const template = eligibleExisting.find((unit) => unit.beds === fresh.beds) || eligibleExisting[0];
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
