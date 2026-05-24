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

export interface Provider {
  _id: string;
  name: string;
  phone: string;
  experience?: number;
  location?: { lat: number; lng: number };
  serviceId: string | Service;
  userId: string | User;
  rating: number;
  bio?: string;
  avatar?: string;
  isVerified?: boolean;
  totalBookings?: number;
  createdAt: string;
}

export interface Booking {
  _id: string;
  userId: string | User;
  serviceId: string | Service;
  providerId: string | Provider;
  date: string;
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
