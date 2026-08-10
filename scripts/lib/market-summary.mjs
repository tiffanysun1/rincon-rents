function compactListing(unit) {
  return {
    id: unit.id,
    building: unit.building,
    unit: unit.unit,
    beds: unit.beds,
    rent: unit.rent,
    postedAt: unit.postedAt || null,
    listingUrl: unit.listingUrl || unit.sourceUrl,
  };
}

export function materializeInventory(sourceUnits, state) {
  const inventory = new Map();
  for (const unit of [...sourceUnits, ...(state.discoveredUnits || [])]) {
    if (!unit.id) continue;
    const effective = { ...unit, ...(state.unitOverrides?.[unit.id] || {}) };
    if (effective.active === false || effective.beds < 1) {
      inventory.delete(unit.id);
      continue;
    }
    inventory.set(unit.id, effective);
  }
  return [...inventory.values()];
}

export function calculateMarketChanges(sourceUnits, previousState, nextState) {
  const previous = new Map(materializeInventory(sourceUnits, previousState).map((unit) => [unit.id, unit]));
  const current = new Map(materializeInventory(sourceUnits, nextState).map((unit) => [unit.id, unit]));

  const newListings = [...current.values()]
    .filter((unit) => !previous.has(unit.id))
    .map(compactListing)
    .sort((a, b) => Date.parse(b.postedAt || 0) - Date.parse(a.postedAt || 0) || a.rent - b.rent);
  const removedListings = [...previous.values()]
    .filter((unit) => !current.has(unit.id))
    .map(compactListing)
    .sort((a, b) => a.rent - b.rent);
  const priceChanges = [...current.values()]
    .filter((unit) => previous.has(unit.id) && Number(previous.get(unit.id).rent) !== Number(unit.rent))
    .map((unit) => ({
      ...compactListing(unit),
      previousRent: Number(previous.get(unit.id).rent),
      change: Number(unit.rent) - Number(previous.get(unit.id).rent),
    }))
    .sort((a, b) => a.change - b.change || a.rent - b.rent);

  return {
    generatedAt: nextState.dataUpdatedAt,
    newListings,
    removedListings,
    priceChanges,
  };
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function listingName(unit) {
  const shortUnit = String(unit.unit || "")
    .split("·")[0]
    .trim()
    .replace(/^Unit\s+/i, "#");
  return `${unit.building}${shortUnit ? ` ${shortUnit}` : ""}`;
}

function listingWithRent(unit) {
  return `${listingName(unit)} ${money(unit.rent)}`;
}

function lowestRent(units, beds) {
  return units
    .filter((unit) => unit.beds === beds && Number(unit.rent) > 0)
    .sort((a, b) => a.rent - b.rent)[0];
}

export function formatMarketSummary({
  units,
  changes,
  verifiedSourceCount = 0,
  totalSourceCount = 0,
}) {
  const newListings = changes?.newListings || units.filter((unit) => unit.isNew);
  const removedListings = changes?.removedListings || [];
  const priceChanges = changes?.priceChanges || [];
  const buildings = new Set(units.map((unit) => unit.building)).size;
  const parts = [
    `Rincon Hill daily update: ${newListings.length} new, ${removedListings.length} off-market, ${priceChanges.length} price ${priceChanges.length === 1 ? "change" : "changes"}.`,
  ];

  if (newListings.length) {
    parts.push(`New: ${newListings.slice(0, 2).map(listingWithRent).join(", ")}.`);
  }

  const drops = priceChanges.filter((change) => change.change < 0);
  const notableMoves = drops.length ? drops : priceChanges;
  if (notableMoves.length) {
    parts.push(`${drops.length ? "Drops" : "Price moves"}: ${notableMoves.slice(0, 2).map((change) => {
      const sign = change.change < 0 ? "-" : "+";
      return `${listingWithRent(change)} (${sign}${money(Math.abs(change.change))})`;
    }).join(", ")}.`);
  }

  parts.push(`Market now: ${units.length} homes across ${buildings} buildings.`);
  const lowestOneBedroom = lowestRent(units, 1);
  const lowestTwoBedroom = lowestRent(units, 2);
  const lows = [
    lowestOneBedroom ? `1BR low ${listingWithRent(lowestOneBedroom)}` : null,
    lowestTwoBedroom ? `2BR low ${listingWithRent(lowestTwoBedroom)}` : null,
  ].filter(Boolean);
  if (lows.length) parts.push(`${lows.join("; ")}.`);
  if (totalSourceCount) parts.push(`Checked ${verifiedSourceCount}/${totalSourceCount} sources.`);

  return parts.join(" ");
}
