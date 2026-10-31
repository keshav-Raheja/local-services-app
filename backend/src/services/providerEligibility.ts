export type Coordinates = { lat: number; lng: number };
export type LocationTarget = { address?: string; recipientName?: string; locality?: string; city?: string; state?: string; pincode?: string; lat?: number; lng?: number };
export type ProviderCoverage = { address?: string; locality?: string; city?: string; pincode?: string; serviceAreas?: string[]; location?: Coordinates; serviceRadiusKm?: number };
export type CoverageResult = { eligible: boolean; distanceKm: number | null; reason: "no-target" | "within-radius" | "explicit-coverage" | "outside-radius" | "invalid-target" | "invalid-radius" | "not-covered" };

export function isValidCoordinates(value: unknown): value is Coordinates {
  if (!value || typeof value !== "object") return false;
  const coordinates = value as Partial<Coordinates>;
  return typeof coordinates.lat === "number" && Number.isFinite(coordinates.lat) && coordinates.lat >= -90 && coordinates.lat <= 90 && typeof coordinates.lng === "number" && Number.isFinite(coordinates.lng) && coordinates.lng >= -180 && coordinates.lng <= 180;
}

export function isValidRadius(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function distanceKm(from: Coordinates, to: Coordinates): number {
  const earthRadiusKm = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((from.lat * Math.PI) / 180) * Math.cos((to.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalize(value: unknown): string { return typeof value === "string" ? value.trim().toLocaleLowerCase() : ""; }
function hasTargetDetails(target: LocationTarget): boolean { return Boolean(normalize(target.locality) || normalize(target.city) || normalize(target.pincode) || normalize(target.address)); }

function matchesExplicitCoverage(provider: ProviderCoverage, target: LocationTarget): boolean {
  const city = normalize(target.city); const locality = normalize(target.locality); const pincode = normalize(target.pincode);
  const providerCity = normalize(provider.city); const providerLocality = normalize(provider.locality); const providerPincode = normalize(provider.pincode);
  const areas = Array.isArray(provider.serviceAreas) ? provider.serviceAreas.map(normalize).filter(Boolean) : [];
  if (pincode && (pincode === providerPincode || areas.includes(pincode))) return true;
  if (locality && (locality === providerLocality || areas.includes(locality))) return true;
  if (city && (city === providerCity || areas.includes(city))) return true;
  return false;
}

export function evaluateProviderCoverage(provider: ProviderCoverage, target: LocationTarget | null): CoverageResult {
  if (!target || (!hasTargetDetails(target) && target.lat === undefined && target.lng === undefined)) return { eligible: true, distanceKm: null, reason: "no-target" };
  const hasAnyTargetCoordinate = target.lat !== undefined || target.lng !== undefined;
  const hasValidTargetCoordinates = target.lat !== undefined && target.lng !== undefined && isValidCoordinates({ lat: target.lat, lng: target.lng });
  if (hasAnyTargetCoordinate && !hasValidTargetCoordinates) return { eligible: false, distanceKm: null, reason: "invalid-target" };
  const targetCoordinates = hasValidTargetCoordinates ? { lat: target.lat as number, lng: target.lng as number } : null;
  if (targetCoordinates && isValidCoordinates(provider.location)) {
    if (!isValidRadius(provider.serviceRadiusKm)) return { eligible: false, distanceKm: null, reason: "invalid-radius" };
    const distance = distanceKm(targetCoordinates, provider.location);
    return distance <= provider.serviceRadiusKm ? { eligible: true, distanceKm: distance, reason: "within-radius" } : { eligible: false, distanceKm: distance, reason: "outside-radius" };
  }
  return matchesExplicitCoverage(provider, target) ? { eligible: true, distanceKm: null, reason: "explicit-coverage" } : { eligible: false, distanceKm: null, reason: "not-covered" };
}