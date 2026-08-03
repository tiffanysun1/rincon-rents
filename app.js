import { units, snapshotMetadata, monthlyTotal, formatMoney, listingLinkLabel } from "./data.js";

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
  return `${unit.beds} bed · ${unit.baths} bath${unit.baths === 1 ? "" : "s"} · ${unit.sqft.toLocaleString()} sq ft`;
}

function displayedParking(unit) {
  if (unit.parkingIncluded) return "Included";
  return state.includeParking ? formatMoney(unit.parking) : "Excluded";
}

function sortedUnits() {
  return [...units].sort((a, b) => {
    if (Boolean(a.isNew) !== Boolean(b.isNew)) return a.isNew ? -1 : 1;
    if (state.sort === "rent-asc") return a.rent - b.rent;
    if (state.sort === "rent-desc") return b.rent - a.rent;
    if (state.sort === "total-desc") return monthlyTotal(b, state.includeParking) - monthlyTotal(a, state.includeParking);
    return monthlyTotal(a, state.includeParking) - monthlyTotal(b, state.includeParking);
  });
}

function render() {
  const list = sortedUnits();
  document.querySelector("#resultCount").textContent = `${list.length} homes`;
  rows.innerHTML = list.map((unit, index) => `
    <article class="price-row${unit.isNew ? " is-new" : ""}" role="row">
      <div class="home-cell" role="cell">
        <span class="rank">${index + 1}</span>
        <div><strong>${unit.isNew ? '<span class="new-badge">New</span>' : ""}${unit.building} · ${unit.unit}</strong><small>${homeSpecs(unit)}</small></div>
      </div>
      <div class="date-cell" role="cell"><strong>${unit.moveInLabel}</strong><small>${unit.postedLabel}</small></div>
      <div role="cell" data-label="Rent"><strong>${formatMoney(unit.rent)}</strong></div>
      <div role="cell" data-label="Fees + utilities"><strong>${formatMoney(unit.fees + unit.utilities + unit.insurance)}</strong></div>
      <div role="cell" data-label="Parking"><strong>${displayedParking(unit)}</strong></div>
      <div class="total-cell" role="cell" data-label="Estimated total"><strong>${formatMoney(monthlyTotal(unit, state.includeParking))}</strong><small>/ month</small></div>
      <div role="cell" data-label="Listing"><a href="${unit.listingUrl}" target="_blank" rel="noreferrer">${listingLinkLabel(unit)}</a><small>${unit.checkedLabel}</small></div>
    </article>`).join("");
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
