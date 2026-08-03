import { units, snapshotMetadata, monthlyTotal, sortListings, groupListingsByBuilding, formatMoney, listingLinkLabel } from "./data.js";

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

function sortedUnits() {
  return sortListings(units, state.sort, state.includeParking);
}

function renderUnit(unit, index, grouped = false) {
  const homeLabel = grouped ? unit.unit : `${unit.building} · ${unit.unit}`;
  return `
    <article class="price-row${unit.isNew ? " is-new" : ""}" role="row">
      <div class="home-cell" role="cell">
        <span class="rank">${index + 1}</span>
        <div><strong>${unit.isNew ? '<span class="new-badge">New</span>' : ""}${homeLabel}</strong><small>${homeSpecs(unit)}</small></div>
      </div>
      <div class="date-cell" role="cell"><strong>${unit.moveInLabel}</strong><small>${unit.postedLabel}</small></div>
      <div role="cell" data-label="Rent"><strong>${formatMoney(unit.rent)}</strong></div>
      <div role="cell" data-label="Fees + utilities"><strong>${formatMoney(unit.fees + unit.utilities + unit.insurance)}</strong></div>
      <div role="cell" data-label="Parking"><strong>${displayedParking(unit)}</strong></div>
      <div class="total-cell" role="cell" data-label="Estimated total"><strong>${formatMoney(monthlyTotal(unit, state.includeParking))}</strong><small>/ month</small></div>
      <div role="cell" data-label="Listing"><a href="${unit.listingUrl}" target="_blank" rel="noreferrer">${listingLinkLabel(unit)}</a><small>${unit.checkedLabel}</small></div>
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

render();
