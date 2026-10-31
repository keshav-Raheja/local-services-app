import { UserLocation } from "../types";
import api from "./api";

export type { UserLocation };

export type CityLocation = UserLocation & {
  id: string;
  name: string;
};

export const POPULAR_INDIAN_CITIES: CityLocation[] = [
  { id: "delhi", name: "Delhi", city: "Delhi", state: "Delhi", lat: 28.6139, lng: 77.209, source: "manual" },
  { id: "mumbai", name: "Mumbai", city: "Mumbai", state: "Maharashtra", lat: 19.076, lng: 72.8777, source: "manual" },
  { id: "bengaluru", name: "Bengaluru", city: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946, source: "manual" },
  { id: "hyderabad", name: "Hyderabad", city: "Hyderabad", state: "Telangana", lat: 17.385, lng: 78.4867, source: "manual" },
  { id: "chennai", name: "Chennai", city: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707, source: "manual" },
  { id: "pune", name: "Pune", city: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567, source: "manual" },
];

const LOCATION_STORAGE_KEY = "customer_location";
const LEGACY_CITY_STORAGE_KEY = "selected_city";

/**
 * Retrieves the currently saved customer location from localStorage.
 * Does NOT default to Delhi NCR or any arbitrary city.
 * Returns null if the user has not selected or confirmed a location yet.
 */
export function getUserLocation(): UserLocation | null {
  if (typeof window === "undefined") return null;

  try {
    // 1. Try modern customer_location
    const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.city === "string" && parsed.city.trim().length > 0) {
        return parsed;
      }
    }

    // 2. Fallback to legacy selected_city if valid
    const legacy = localStorage.getItem(LEGACY_CITY_STORAGE_KEY);
    if (legacy) {
      const parsedLegacy = JSON.parse(legacy);
      if (parsedLegacy && typeof parsedLegacy.name === "string" && parsedLegacy.name.trim().length > 0) {
        const migrated: UserLocation = {
          city: parsedLegacy.name,
          state: parsedLegacy.state || "",
          displayLabel: parsedLegacy.state ? `${parsedLegacy.name}, ${parsedLegacy.state}` : parsedLegacy.name,
          source: "manual",
        };
        // Save modern format
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    }
  } catch (err) {
    console.warn("Failed to parse saved location from localStorage:", err);
  }

  return null;
}

/**
 * Saves the selected customer location to localStorage and notifies listeners.
 */
export function setUserLocation(loc: UserLocation | null): void {
  if (typeof window === "undefined") return;

  try {
    if (loc) {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(loc));
      // Keep legacy key in sync for backwards compatibility
      localStorage.setItem(
        LEGACY_CITY_STORAGE_KEY,
        JSON.stringify({ id: loc.city.toLowerCase().replace(/\s+/g, "-"), name: loc.city, state: loc.state || "" })
      );
    } else {
      localStorage.removeItem(LOCATION_STORAGE_KEY);
      localStorage.removeItem(LEGACY_CITY_STORAGE_KEY);
    }

    // Dispatch custom events
    window.dispatchEvent(new CustomEvent("location_changed", { detail: loc }));
    window.dispatchEvent(new CustomEvent("city_changed", { detail: loc }));
  } catch (err) {
    console.error("Error saving customer location:", err);
  }
}

export function clearUserLocation(): void {
  setUserLocation(null);
}

/**
 * Backward compatibility aliases
 */
export function getSelectedCity(): CityLocation | null {
  const location = getUserLocation();
  return location
    ? { ...location, id: location.city.toLowerCase().replace(/s+/g, "-"), name: location.city }
    : null;
}

export function setSelectedCity(city: (UserLocation & { name?: string }) | null): void {
  if (!city) {
    clearUserLocation();
    return;
  }
  const loc: UserLocation = {
    city: city.city || city.name || "Unknown City",
    locality: city.locality || "",
    state: city.state || "",
    pincode: city.pincode || "",
    lat: city.lat,
    lng: city.lng,
    displayLabel: city.displayLabel || city.name || city.city,
    source: "manual",
  };
  setUserLocation(loc);
}

/**
 * Formats a short, user-friendly label for displaying in navbar or badges
 */
export function formatLocationLabel(loc: UserLocation | null): string {
  if (!loc || !loc.city) return "Choose your location";
  if (loc.locality && loc.locality !== loc.city) {
    return `${loc.locality}, ${loc.city}`;
  }
  if (loc.city && loc.state) {
    return `${loc.city}, ${loc.state}`;
  }
  return loc.city;
}

/**
 * Search locations via backend geocoding proxy
 */
export async function searchLocations(query: string): Promise<UserLocation[]> {
  const q = query.trim();
  if (!q || q.length < 2) return [];

  try {
    const results = await api.get<UserLocation[]>(`/location/search?q=${encodeURIComponent(q)}`);
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.warn("Location search API unavailable, continuing with manual entry:", error);
    return [];
  }
}

/**
 * Reverse geocode GPS coordinates via backend
 */
export async function reverseGeocodeCoordsStrict(lat: number, lng: number): Promise<UserLocation> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error("Invalid location coordinates");
  }

  const result = await api.get<UserLocation>("/location/reverse?lat=" + encodeURIComponent(lat) + "&lng=" + encodeURIComponent(lng));
  if (!result || !result.city) throw new Error("No address was found for this location");
  return { ...result, lat, lng, source: "gps" };
}
export async function reverseGeocodeCoords(lat: number, lng: number): Promise<UserLocation> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) throw new Error("Invalid location coordinates");
  const result = await api.get<UserLocation>("/location/reverse?lat=" + encodeURIComponent(lat) + "&lng=" + encodeURIComponent(lng));
  if (!result || !result.city) throw new Error("No address was found for this location");
  return { ...result, lat, lng, source: "gps" };
}