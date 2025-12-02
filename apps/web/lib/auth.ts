// apps/web/lib/auth.ts

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const useSaveTokenAndRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("access_token");
    const redirect = params.get("redirect") || "/dashboard";

    console.log("Current Query Params:", params.toString());

    if (token) {
      console.log("Token found! Saving and redirecting...");
      localStorage.setItem("access_token", token);

      // Clean the URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);

      // Force full reload to ensure dashboard sees the token
      window.location.href = redirect;
    }
  }, [router]);
};
