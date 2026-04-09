import { useEffect } from "react";
import api from "./api";

export const useSaveTokenAndRedirect = () => {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkAuthAndRedirect = async () => {
      const params = new URLSearchParams(window.location.search);
      const finalRedirect = params.get("redirect") || "/dashboard";

      // Clean the URL immediately
      if (window.location.search) {
        window.history.replaceState({}, "", window.location.pathname);
      }

      try {
        // Verify current session using cookies
        const response = await api.get("/auth/me");
        const user = response.data;

        if (user) {
          // Consider a user onboarded once required location is saved.
          // This matches dashboard gating logic and supports both victims and volunteers.
          const hasLocation = user.lat !== null && user.lng !== null;
          const isOnboarded = hasLocation;

          if (isOnboarded) {
            console.log("User already onboarded. Redirecting to dashboard.");
            window.location.href = "/dashboard";
          } else {
            console.log("User needs onboarding.");
            // Stay on /onboarding if we are already there, otherwise redirect
            if (window.location.pathname !== "/onboarding") {
              window.location.href = "/onboarding";
            }
          }
        }
      } catch (e) {
        console.error("Auth check failed:", e);
        // Fallback for failed auth - redirect to login
        // window.location.href = "/login";
      }
    };

    checkAuthAndRedirect();
  }, []);
};
