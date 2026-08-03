import { units, snapshotMetadata, monthlyTotal, sortListings, groupListingsByBuilding, upfrontTotal, formatMoney, listingLinkLabel } from "./data.js";

const state = {
  includeParking: true,
  sort: "total-asc",
};

const rows = document.querySelector("#priceRows");
const parkingToggle = document.querySelector("#parkingToggle");
const sortSelect = document.querySelector("#sortSelect");

function formatFetchedAt(iso) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: "America/Los_Angeles",
  }).format(new Date(iso));
}

function homeSpecs(unit) {
  const size = unit.sqft > 0 ? `${unit.sqft.toLocaleString()} sq ft` : "Size not listed";
  return `${unit.beds} bed · ${unit.baths} bath${unit.baths === 1 ? "" : "s"} · ${size}`;
}

function displayedParking(unit) {
  if (unit.parkingIncluded) return "Included";
  return state.includeParking ? formatMoney(unit.parking) : "Excluded";
}

function formatDetailedMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parkingBreakdown(unit) {
  if (unit.parkingIncluded) return { value: "Included", detail: unit.parkingConfidence };
  return {
    value: formatDetailedMoney(unit.parking),
    detail: state.includeParking ? `${unit.parkingConfidence} · counted in total` : `${unit.parkingConfidence} · excluded from total`,
  };
}

function renderCostBreakdown(unit) {
  const id = `cost-${unit.id}`;
  const parking = parkingBreakdown(unit);
  const includedUtilities = unit.utilitiesIncluded?.length ? unit.utilitiesIncluded.join(", ") : "None confirmed";
  return `
    <section id="${id}" class="cost-breakdown" role="cell" aria-label="Cost breakdown for ${escapeHtml(unit.building)} ${escapeHtml(unit.unit)}" hidden>
      <div>
        <h3>Monthly breakdown</h3>
        <dl class="cost-lines">
          <div><dt>Base rent</dt><dd>${formatDetailedMoney(unit.rent)}</dd></div>
          <div><dt>Building + service fees</dt><dd>${formatDetailedMoney(unit.fees)}</dd></div>
          <div><dt>Estimated utilities</dt><dd>${formatDetailedMoney(unit.utilities)}</dd></div>
          <div><dt>Renter's insurance</dt><dd>${formatDetailedMoney(unit.insurance)}</dd></div>
          <div><dt>Parking</dt><dd>${parking.value}<small>${escapeHtml(parking.detail)}</small></dd></div>
          <div class="cost-total"><dt>Estimated monthly total</dt><dd>${formatDetailedMoney(monthlyTotal(unit, state.includeParking))}</dd></div>
        </dl>
      </div>
      <div class="cost-context">
        <h3>What the estimate assumes</h3>
        <p><strong>Utilities included:</strong> ${escapeHtml(includedUtilities)}</p>
        <p>${escapeHtml(unit.pricingNote)}</p>
        <p><strong>One-time charges:</strong> ${formatDetailedMoney(upfrontTotal(unit))} total · ${formatDetailedMoney(unit.deposit)} deposit · ${formatDetailedMoney(unit.applicationFee)} application · ${formatDetailedMoney(unit.moveInFee)} move-in.</p>
        ${unit.costSourceUrl ? `<a href="${unit.costSourceUrl}" target="_blank" rel="noreferrer">View fee source</a>` : ""}
      </div>
    </section>`;
}

function sortedUnits() {
  return sortListings(units, state.sort, state.includeParking);
}

function renderUnit(unit, index, grouped = false) {
  const homeLabel = grouped ? unit.unit : `${unit.building} · ${unit.unit}`;
  const extras = unit.fees + unit.utilities + unit.insurance;
  const costId = `cost-${unit.id}`;
  return `
    <article class="price-row${unit.isNew ? " is-new" : ""}" role="row">
      <div class="home-cell" role="cell">
        <span class="rank">${index + 1}</span>
        <div><strong>${unit.isNew ? '<span class="new-badge">New</span>' : ""}${homeLabel}</strong><small>${homeSpecs(unit)}</small></div>
      </div>
      <div class="date-cell" role="cell"><strong>${unit.moveInLabel}</strong><small>${unit.postedLabel}</small></div>
      <div role="cell" data-label="Rent"><strong>${formatMoney(unit.rent)}</strong></div>
      <div class="extras-cell" role="cell" data-label="Monthly extras">
        <strong>${formatMoney(extras)}</strong>
        <small>Fees ${formatDetailedMoney(unit.fees)} · utilities ${formatDetailedMoney(unit.utilities)} · insurance ${formatDetailedMoney(unit.insurance)}</small>
        <button class="breakdown-toggle" type="button" aria-expanded="false" aria-controls="${costId}">Full breakdown</button>
      </div>
      <div role="cell" data-label="Parking"><strong>${displayedParking(unit)}</strong></div>
      <div class="total-cell" role="cell" data-label="Estimated total"><strong>${formatMoney(monthlyTotal(unit, state.includeParking))}</strong><small>/ month</small></div>
      <div role="cell" data-label="Listing"><a href="${unit.listingUrl}" target="_blank" rel="noreferrer">${listingLinkLabel(unit)}</a><small>${unit.checkedLabel}</small></div>
      ${renderCostBreakdown(unit)}
    </article>`;
}

function render() {
  const list = sortedUnits();
  document.querySelector("#resultCount").textContent = `${list.length} homes`;
  if (state.sort === "building-asc") {
    let rowIndex = 0;
    rows.innerHTML = groupListingsByBuilding(list).map((group) => `
      <section class="complex-group" role="rowgroup" aria-label="${group.building}">
        <div class="complex-header" role="row">
          <div class="complex-header-cell" role="cell">
            <strong>${group.building}</strong>
            <span>${group.units.length} ${group.units.length === 1 ? "home" : "homes"}</span>
          </div>
        </div>
        ${group.units.map((unit) => renderUnit(unit, rowIndex++, true)).join("")}
      </section>`).join("");
    return;
  }
  rows.innerHTML = list.map((unit, index) => renderUnit(unit, index)).join("");
}

document.querySelector("#fetchedAt").textContent = formatFetchedAt(snapshotMetadata.dataUpdatedAt);
parkingToggle.addEventListener("change", (event) => {
  state.includeParking = event.target.checked;
  render();
});
sortSelect.addEventListener("change", (event) => {
  state.sort = event.target.value;
  render();
});
rows.addEventListener("click", (event) => {
  const button = event.target.closest(".breakdown-toggle");
  if (!button) return;
  const panel = document.getElementById(button.getAttribute("aria-controls"));
  if (!panel) return;
  const expanded = button.getAttribute("aria-expanded") === "true";
  button.setAttribute("aria-expanded", String(!expanded));
  button.textContent = expanded ? "Full breakdown" : "Hide breakdown";
  panel.hidden = expanded;
});

render();
