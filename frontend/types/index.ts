export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "provider" | "admin";
  phone?: string;
  address?: string;
  avatar?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  _id: string;
  name: string;
  description?: string;
  price?: number;
  icon?: string;
  createdAt?: string;
}

export interface UserLocation {
  displayLabel?: string;
  address?: string;
  locality?: string;
  city: string;
  state?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  source?: "gps" | "manual" | "search";
}

export interface Provider {
  _id: string;
  name: string;
  phone: string;
  experience?: number;
  location?: { lat: number; lng: number };
  address?: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  serviceAreas?: string[];
  serviceRadiusKm?: number;
  serviceId: string | Service;
  userId: string | User;
  rating: number;
  reviewCount?: number;
  bio?: string;
  avatar?: string;
  isVerified?: boolean;
  totalBookings?: number;
  price?: number;
  createdAt: string;
}

export interface ServiceAddress {
  address: string;
  recipientName?: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
}

export interface Booking {
  _id: string;
  userId: string | User;
  serviceId: string | Service;
  providerId: string | Provider;
  date: string;
  serviceAddress?: ServiceAddress;
  status: "pending" | "confirmed" | "completed" | "rejected";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  userId: string | User;
  providerId: string | Provider;
  rating: number;
  feedback?: string;
  bookingId: string | Booking;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
}
