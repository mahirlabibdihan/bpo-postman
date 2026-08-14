const STORAGE_KEY = "bpo-postman-delivery-points";

const DEMO_POINTS = [
  // 42/2 Prantor, Indira Road এবং আশপাশ — Tejgaon TSO (1215)
  { id: "demo-1215-1", latitude: 23.75792805665544, longitude: 90.38547778955655, postOffice: "তেজগাঁও টিএসও", postcode: "১২১৫", capturedAt: "2026-08-14T03:10:00.000Z" },
  { id: "demo-1215-2", latitude: 23.75767487387856, longitude: 90.38425710379198, postOffice: "তেজগাঁও টিএসও", postcode: "১২১৫", capturedAt: "2026-08-14T03:18:00.000Z" },
  { id: "demo-1215-3", latitude: 23.757819386072732, longitude: 90.38464695566276, postOffice: "তেজগাঁও টিএসও", postcode: "১২১৫", capturedAt: "2026-08-14T03:26:00.000Z" },
  { id: "demo-1215-4", latitude: 23.758254855251707, longitude: 90.38463592822255, postOffice: "তেজগাঁও টিএসও", postcode: "১২১৫", capturedAt: "2026-08-14T03:34:00.000Z" },
  { id: "demo-1215-5", latitude: 23.758555142328998, longitude: 90.38591505977725, postOffice: "তেজগাঁও টিএসও", postcode: "১২১৫", capturedAt: "2026-08-14T03:42:00.000Z" },
  // ECE Building, BUET এবং West Palashi campus-এর আশপাশ — Dhaka GPO (1000)
  { id: "demo-1000-1", latitude: 23.726680, longitude: 90.388440, postOffice: "ঢাকা জিপিও", postcode: "১০০০", capturedAt: "2026-08-14T04:10:00.000Z" },
  { id: "demo-1000-2", latitude: 23.726956, longitude: 90.388173, postOffice: "ঢাকা জিপিও", postcode: "১০০০", capturedAt: "2026-08-14T04:18:00.000Z" },
  { id: "demo-1000-3", latitude: 23.727125, longitude: 90.388704, postOffice: "ঢাকা জিপিও", postcode: "১০০০", capturedAt: "2026-08-14T04:26:00.000Z" },
  { id: "demo-1000-4", latitude: 23.726536, longitude: 90.388940, postOffice: "ঢাকা জিপিও", postcode: "১০০০", capturedAt: "2026-08-14T04:34:00.000Z" },
  { id: "demo-1000-5", latitude: 23.726271, longitude: 90.388387, postOffice: "ঢাকা জিপিও", postcode: "১০০০", capturedAt: "2026-08-14T04:42:00.000Z" },
];

export function getSavedPoints() {
  try {
    const savedPoints = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return [...new Map([...DEMO_POINTS, ...savedPoints].map((point) => [point.id, point])).values()];
  } catch {
    return DEMO_POINTS;
  }
}

export async function saveDeliveryPoint(point) {
  // Replace this local adapter with POST /postman/delivery-points when the backend endpoint is available.
  const points = [point, ...getSavedPoints()];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(points));
  return point;
}
