import type { Request } from 'express';
import { User } from '@repo/database';

// Define the exact shape of the user object populated by JwtStrategy
export interface AuthUserPayload {
  id: string;
  email: string;
  name: string | null;
  role: string;
  phone: string | null;
  image: string | null;
  lat: number | null;
  lng: number | null;
}

// Define the custom request object used across all controllers
export interface AuthRequest extends Request {
  user: AuthUserPayload;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  image: string | null;
}

export interface DbUser {
  id: string;
  email: string;
  role: string;
  lat: number | null;
  lng: number | null;
  name: string | null;
  phone: string | null;
  image: string | null;
}
export interface GoogleUser {
  email: string;
  name: string;
  picture: string | null;
}

export interface IncidentWithGeo {
  id: string;
  title: string;
  description: string;
  urgency: string;
  status: string;
  phone: string | null;
  createdAt: Date;
  lat: number;
  lng: number;
  distance: number;
  distance_meters: number;
  user: User;
  volunteer: User;
}
