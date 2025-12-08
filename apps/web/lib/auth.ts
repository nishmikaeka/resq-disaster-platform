// lib/auth.js (or wherever your hook is located)

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { jwtDecode } from "jwt-decode"; // Import the library

export const useSaveTokenAndRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("access_token");
    // This 'redirect' parameter is what the BACKEND tells the frontend to use
    // as the final destination *after* the token is saved.
    const finalRedirect = params.get("redirect") || "/dashboard";

    if (token) {
      localStorage.setItem("access_token", token); // Clean the URL immediately to hide the token

      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);

      let destination = finalRedirect;

      try {
        // 1. DECODE THE TOKEN
        const payload = jwtDecode<{ isOnboarded: boolean }>(token);

        // 2. CONDITIONAL CHECK: If user is ALREADY onboarded,
        // force the destination to the dashboard, overriding the URL parameter.
        if (payload.isOnboarded) {
          console.log("User already onboarded. Redirecting to dashboard.");
          destination = "/dashboard";
        }
      } catch (e) {
        console.error("Failed to decode token:", e);
        // If token decode fails, we still redirect to the original path as a fallback
      } // Force full reload to ensure the new token is read by the app context

      window.location.href = destination;
    }
  }, [router]);
};
