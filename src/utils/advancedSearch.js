// Builds the condensed "10km · Cheapest · Only Shell +2" summary shown next
// to the collapsed Advanced Search trigger button on the Fuel Prices and EV
// Charging pages.
export function buildAdvancedSearchSummary({ sortOptions, sortBy, radius, includeBrands = [], excludeBrands = [] }) {
  const parts = [`${radius}km`];
  const sortLabel = sortOptions.find((o) => o.id === sortBy)?.label;
  if (sortLabel) parts.push(sortLabel);
  if (includeBrands.length > 0) {
    parts.push(includeBrands.length === 1 ? `Only ${includeBrands[0]}` : `Only ${includeBrands[0]} +${includeBrands.length - 1}`);
  }
  if (excludeBrands.length > 0) {
    parts.push(excludeBrands.length === 1 ? `Excl. ${excludeBrands[0]}` : `Excl. ${excludeBrands[0]} +${excludeBrands.length - 1}`);
  }
  return parts.join(' · ');
}
