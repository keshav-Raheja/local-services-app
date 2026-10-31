import { Request, Response } from "express";

// Simple in-memory cache to respect geocoding rate limits and speed up repeat queries
const searchCache = new Map<string, { data: any; expiry: number }>();
const reverseCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

interface CleanLocationResult {
  displayLabel: string;
  address: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
}

function parseNominatimAddress(item: any): CleanLocationResult {
  const addr = item.address || {};
  const locality =
    addr.suburb ||
    addr.neighbourhood ||
    addr.residential ||
    addr.commercial ||
    addr.subdistrict ||
    "";
  const city =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.state_district ||
    addr.county ||
    locality ||
    "";
  const state = addr.state || "";
  const pincode = addr.postcode || "";

  // Compose a readable short label
  const parts: string[] = [];
  if (locality && locality !== city) parts.push(locality);
  if (city) parts.push(city);
  if (pincode) parts.push(pincode);
  else if (state) parts.push(state);

  const displayLabel = parts.length > 0 ? parts.join(", ") : item.display_name || "";

  return {
    displayLabel,
    address: item.display_name || "",
    locality,
    city,
    state,
    pincode,
    lat: item.lat ? parseFloat(item.lat) : undefined,
    lng: item.lon ? parseFloat(item.lon) : undefined,
  };
}

// GET /api/location/search?q=...
export const searchLocation = async (req: Request, res: Response) => {
  try {
    const query = String(req.query.q || "").trim();
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const cacheKey = query.toLowerCase();
    const cached = searchCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return res.json(cached.data);
    }

    // Call Nominatim with Indian country code filter and contact header
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=in&limit=6&q=${encodeURIComponent(
      query
    )}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    let apiRes: globalThis.Response;
    try {
      apiRes = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "SevaHub-LocalServices-App/1.0 (local-services@sevahub.in)",
          "Accept-Language": "en-IN,en;q=0.9",
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!apiRes.ok) {
      return res.json([]);
    }

    const rawData = await apiRes.json();
    if (!Array.isArray(rawData)) {
      return res.json([]);
    }

    const results = rawData.map(parseNominatimAddress);
    searchCache.set(cacheKey, { data: results, expiry: Date.now() + CACHE_TTL_MS });

    return res.json(results);
  } catch (error) {
    // If geocoding service is unavailable or times out, gracefully return empty list so manual entry works
    return res.json([]);
  }
};

// GET /api/location/reverse?lat=...&lng=...
export const reverseGeocode = async (req: Request, res: Response) => {
  try {
    const lat = Number(String(req.query.lat ?? ""));
    const lng = Number(String(req.query.lng ?? ""));

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ message: "Invalid latitude or longitude" });
    }

    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    const cached = reverseCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return res.json(cached.data);
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lng}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    let apiRes: globalThis.Response;
    try {
      apiRes = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "SevaHub-LocalServices-App/1.0 (local-services@sevahub.in)",
          "Accept-Language": "en-IN,en;q=0.9",
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!apiRes.ok) {
      return res.status(502).json({ message: "Geocoding provider unavailable" });
    }

    const rawData = await apiRes.json();
    const result = parseNominatimAddress(rawData);

    reverseCache.set(cacheKey, { data: result, expiry: Date.now() + CACHE_TTL_MS });

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to reverse geocode coordinates",
    });
  }
};
