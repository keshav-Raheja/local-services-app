import { Request, Response } from "express";
import Provider from "../models/providerModel";
import Service from "../models/serviceModel";
import Booking from "../models/bookingModel";
import { evaluateProviderCoverage, isValidCoordinates, isValidRadius, type LocationTarget, type ProviderCoverage } from "../services/providerEligibility";

// Helper: Haversine distance calculation in kilometers
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ✅ GET PROVIDERS BY SERVICE (WITH LOCATION AWARENESS)
function queryString(value: unknown, field: string): string {
  if (value === undefined) return "";
  if (typeof value !== "string" || value.length > 120) throw new Error(`Invalid ${field}`);
  return value.trim();
}

function publicProvider(provider: { toObject: () => Record<string, unknown> }, distanceKm: number | null, serviceId?: string) {
  const { address: _address, phone: _phone, location: _location, ...safeProvider } = provider.toObject();
  const offerings = Array.isArray(safeProvider.offerings) ? safeProvider.offerings as Array<{ serviceId?: { _id?: string } | string; price?: number; active?: boolean }> : [];
  const matchingOffering = offerings.find((offering) => String(typeof offering.serviceId === "object" ? offering.serviceId?._id : offering.serviceId) === serviceId && offering.active !== false);
  const result = matchingOffering ? { ...safeProvider, price: matchingOffering.price } : safeProvider;
  return distanceKm === null ? result : { ...result, distanceKm: Number(distanceKm.toFixed(2)) };
}

export const getProviders = async (req: Request, res: Response) => {
  try {
    const city = queryString(req.query.city, "city").toLocaleLowerCase();
    const locality = queryString(req.query.locality, "locality").toLocaleLowerCase();
    const pincode = queryString(req.query.pincode, "pincode");
    const hasLat = req.query.lat !== undefined;
    const hasLng = req.query.lng !== undefined;
    if (hasLat !== hasLng) return res.status(400).json({ message: "Latitude and longitude must be provided together" });
    let lat: number | undefined;
    let lng: number | undefined;
    if (hasLat && hasLng) {
      lat = Number(req.query.lat);
      lng = Number(req.query.lng);
      if (!isValidCoordinates({ lat, lng })) return res.status(400).json({ message: "Invalid latitude or longitude" });
    }
    const target: LocationTarget = { city, locality, pincode, lat, lng };
    const hasTarget = Boolean(city || locality || pincode || lat !== undefined || lng !== undefined);
    const allProviders = await Provider.find({ $or: [{ serviceId: String(req.params.serviceId) }, { offerings: { $elemMatch: { serviceId: String(req.params.serviceId), active: { $ne: false } } } }] }).populate("offerings.serviceId", "name");
    if (!hasTarget) return res.status(200).json(allProviders.map((provider) => publicProvider(provider, null, String(req.params.serviceId))));
    const eligible = allProviders.map((provider) => ({ provider, result: evaluateProviderCoverage(provider.toObject() as ProviderCoverage, target) })).filter(({ result }) => result.eligible).sort((left, right) => {
      if (left.result.distanceKm === null && right.result.distanceKm === null) return 0;
      if (left.result.distanceKm === null) return 1;
      if (right.result.distanceKm === null) return -1;
      return left.result.distanceKm - right.result.distanceKm;
    });
    return res.status(200).json(eligible.map(({ provider, result }) => publicProvider(provider, result.distanceKm, String(req.params.serviceId))));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid ")) return res.status(400).json({ message: error.message });
    console.error("Error fetching providers:", error);
    return res.status(500).json({ message: "Error fetching providers" });
  }
};
export const createProvider = async (req: Request, res: Response) => {
  try {
    const { name, phone, experience, location, serviceId, price, address, locality, city, state, pincode, serviceAreas, serviceRadiusKm, bio } = req.body;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    if (typeof name !== "string" || !name.trim() || typeof phone !== "string" || !phone.trim() || typeof serviceId !== "string") return res.status(400).json({ message: "Name, phone and service category are required" });
    if (!await Service.exists({ _id: serviceId })) return res.status(400).json({ message: "Service category not found" });
    if (serviceRadiusKm !== undefined && !isValidRadius(Number(serviceRadiusKm))) return res.status(400).json({ message: "Service radius must be greater than zero" });
    if (location !== undefined && !isValidCoordinates(location)) return res.status(400).json({ message: "Invalid latitude or longitude" });
    const hasAddress = (typeof city === "string" && city.trim().length > 0) || (typeof address === "string" && address.trim().length > 0);
    if (location === undefined && !hasAddress) return res.status(400).json({ message: "Please provide either a city/address or detect your location" });
    if (await Provider.exists({ userId })) return res.status(400).json({ message: "Provider profile already exists for this user" });
    const parsedAreas = Array.isArray(serviceAreas) ? serviceAreas.map((value: unknown) => String(value).trim()).filter(Boolean) : typeof serviceAreas === "string" ? serviceAreas.split(",").map((value: string) => value.trim()).filter(Boolean) : [];
    const providerData = {
      name: name.trim(), phone: phone.trim(), experience: Number(experience || 0), serviceId, userId, price: Number(price || 0),
      address: typeof address === "string" ? address.trim() : "", locality: typeof locality === "string" ? locality.trim() : "", city: typeof city === "string" ? city.trim() : "", state: typeof state === "string" ? state.trim() : "", pincode: typeof pincode === "string" ? pincode.trim() : "", serviceAreas: parsedAreas, ...(serviceRadiusKm !== undefined ? { serviceRadiusKm: Number(serviceRadiusKm) } : {}), bio: typeof bio === "string" ? bio.trim() : "", isProfileComplete: true,
      offerings: [{ serviceId, price: Number(price || 0), active: true, serviceAreas: parsedAreas }],
      ...(location !== undefined ? { location: { lat: location.lat, lng: location.lng } } : {}),
    };
    return res.status(201).json(await Provider.create(providerData));
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return res.status(409).json({ code: "PROVIDER_PROFILE_EXISTS", message: "Provider profile already exists for this account" });
    console.error("Error creating provider:", error);
    return res.status(500).json({ message: "Error creating provider profile" });
  }
};
export const getProviderOfferings = async (req: Request, res: Response) => {
  try {
    const provider = await Provider.findOne({ userId: req.user?.id }).populate("offerings.serviceId", "name");
    if (!provider) return res.status(404).json({ code: "PROVIDER_PROFILE_MISSING", message: "Provider profile not found" });
    const offerings = provider.offerings?.length ? provider.offerings : [{ serviceId: provider.serviceId, price: provider.price, active: true, serviceAreas: provider.serviceAreas }];
    return res.json(offerings);
  } catch (error) {
    console.error("Error fetching provider offerings:", error);
    return res.status(500).json({ message: "Error fetching provider offerings" });
  }
};

export const createProviderOffering = async (req: Request, res: Response) => {
  try {
    const { serviceId, price, serviceAreas } = req.body;
    const provider = await Provider.findOne({ userId: req.user?.id });
    if (!provider) return res.status(404).json({ code: "PROVIDER_PROFILE_MISSING", message: "Provider profile not found" });
    const amount = Number(price);
    if (typeof serviceId !== "string" || !await Service.exists({ _id: serviceId }) || !Number.isFinite(amount) || amount < 0) return res.status(400).json({ message: "A valid profession and non-negative price are required" });
    if (provider.offerings?.some((offering) => String(offering.serviceId) === serviceId)) return res.status(409).json({ code: "OFFERING_EXISTS", message: "This profession is already offered" });
    const areas = Array.isArray(serviceAreas) ? serviceAreas.map((value: unknown) => String(value).trim()).filter(Boolean) : [];
    provider.offerings.push({ serviceId, price: amount, active: true, serviceAreas: areas });
    await provider.save();
    return res.status(201).json(provider.offerings[provider.offerings.length - 1]);
  } catch (error) {
    console.error("Error creating provider offering:", error);
    return res.status(500).json({ message: "Error creating provider offering" });
  }
};

export const updateProviderOffering = async (req: Request, res: Response) => {
  try {
    const provider = await Provider.findOne({ userId: req.user?.id });
    const offering = provider?.offerings?.id(String(req.params.offeringId));
    if (!provider || !offering) return res.status(404).json({ message: "Offering not found" });
    if (req.body.price !== undefined) { const amount = Number(req.body.price); if (!Number.isFinite(amount) || amount < 0) return res.status(400).json({ message: "Price must be a non-negative number" }); offering.price = amount; }
    if (req.body.active !== undefined) { if (typeof req.body.active !== "boolean") return res.status(400).json({ message: "Active must be boolean" }); offering.active = req.body.active; }
    if (req.body.serviceAreas !== undefined) offering.serviceAreas = Array.isArray(req.body.serviceAreas) ? req.body.serviceAreas.map((value: unknown) => String(value).trim()).filter(Boolean) : [];
    await provider.save();
    return res.json(offering);
  } catch (error) {
    console.error("Error updating provider offering:", error);
    return res.status(500).json({ message: "Error updating provider offering" });
  }
};

export const getProviderBookings = async (req: Request, res: Response) => {
  try {
const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const provider = await Provider.findOne({ userId });

    if (!provider) {
      return res.json([]);
    }

    const bookings = await Booking.find({ providerId: provider._id })
      .populate("userId", "name email phone")
      .populate("serviceId", "name");

    return res.status(200).json(bookings);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching provider bookings" });
  }
};

// ✅ GET PROVIDER PROFILE BY USER ID
export const getProviderProfile = async (req: Request, res: Response) => {
  try {
const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const provider = await Provider.findOne({ userId }).populate("serviceId", "name");
    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found" });
    }
    return res.status(200).json(provider);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching provider profile" });
  }
};

// ✅ UPDATE PROVIDER PROFILE
export const updateProviderProfile = async (req: Request, res: Response) => {
  try {
const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const {
      name,
      phone,
      experience,
      bio,
      avatar,
      price,
      address,
      locality,
      city,
      state,
      pincode,
      serviceAreas,
      serviceRadiusKm,
      location,
    } = req.body;

    const provider = await Provider.findOne({ userId });
    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found" });
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) return res.status(400).json({ message: "Business name is required" });
      provider.name = name.trim();
    }
    if (phone !== undefined) {
      if (typeof phone !== "string" || !phone.trim()) return res.status(400).json({ message: "Phone is required" });
      provider.phone = phone.trim();
    }
    if (experience !== undefined) {
      const value = Number(experience);
      if (!Number.isFinite(value) || value < 0) return res.status(400).json({ message: "Experience must be a non-negative number" });
      provider.experience = value;
    }
    if (bio !== undefined) provider.bio = String(bio);
    if (avatar !== undefined) provider.avatar = String(avatar).trim();
    if (price !== undefined) {
      const value = Number(price);
      if (!Number.isFinite(value) || value < 0) return res.status(400).json({ message: "Price must be a non-negative number" });
      provider.price = value;
    }

    if (address !== undefined) provider.address = String(address).trim();
    if (locality !== undefined) provider.locality = String(locality).trim();
    if (city !== undefined) provider.city = String(city).trim();
    if (state !== undefined) provider.state = String(state).trim();
    if (pincode !== undefined) provider.pincode = String(pincode).trim();

    if (serviceAreas !== undefined) {
      if (Array.isArray(serviceAreas)) {
        provider.serviceAreas = serviceAreas.map((s) => String(s).trim()).filter(Boolean);
      } else if (typeof serviceAreas === "string") {
        provider.serviceAreas = serviceAreas.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }

    if (serviceRadiusKm !== undefined) {
      const value = Number(serviceRadiusKm);
      if (!Number.isFinite(value) || value <= 0) return res.status(400).json({ message: "Service radius must be greater than zero" });
      provider.serviceRadiusKm = value;
    }

    if (location !== undefined) {
      if (!location || typeof location.lat !== "number" || typeof location.lng !== "number" || !Number.isFinite(location.lat) || !Number.isFinite(location.lng) || location.lat < -90 || location.lat > 90 || location.lng < -180 || location.lng > 180) {
        return res.status(400).json({ message: "Invalid location coordinates" });
      }
      provider.location = {
        lat: Number(location.lat),
        lng: Number(location.lng),
      };
    }

    await provider.save();
    return res.status(200).json(provider);
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ message: "Error updating provider profile" });
  }
};
