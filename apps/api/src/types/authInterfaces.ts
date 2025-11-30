// src/common/interfaces/auth.interface.ts (or wherever you manage shared types)

import type { Request } from 'express';

// Define the exact shape of the user object populated by JwtStrategy
export interface AuthUserPayload {
  id: string;
  email: string;
  name: string | null;
  role: string;
  phone: string | null;
  image: string | null;
  // ⭐️ CRITICAL FIX: Include location fields ⭐️
  lat: number | null;
  lng: number | null;
}

// Define the custom request object used across all controllers
export interface AuthRequest extends Request {
  user: AuthUserPayload;
}
