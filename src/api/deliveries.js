const STORAGE_KEY = "bpo-postman-delivery-points";

export function getSavedPoints() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

export async function saveDeliveryPoint(point) {
  // Replace this local adapter with POST /postman/delivery-points when the backend endpoint is available.
  const points = [point, ...getSavedPoints()];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(points));
  return point;
}
