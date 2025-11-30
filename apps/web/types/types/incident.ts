import { User } from "../../app/dashboard/page";

export interface Incident {
  id: string;
  title?: string;
  description?: string;
  lat: number;
  lng: number;
  phone: string;
  urgency?: "LOW" | "MEDIUM" | "HIGH";
  media?: { url: string; type?: string }[];
  distance?: number;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED"; // ← REQUIRED, NOT OPTIONAL
  createdAt?: string;
  reporterId?: string;
  user: User;
  volunteerId?: string | null;
  volunteer?: User | null;
}
