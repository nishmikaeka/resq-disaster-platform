// apps/web/lib/auth.ts
import { cookies } from "next/headers";

export async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return null;

  const res = await fetch("http://localhost:3001/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.ok ? await res.json() : null;
}
