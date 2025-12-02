"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { HeartHandshake, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSaveTokenAndRedirect } from "../../lib/auth";

const Onboarding = () => {
  useSaveTokenAndRedirect();
  const router = useRouter();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [role, setRole] = useState<"VICTIM" | "VOLUNTEER" | null>("VICTIM");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser");
      setLocationError("Geolocation not supported");
      const fallback = { lat: 6.9271, lng: 79.8612 };
      setLocation(fallback);
      localStorage.setItem("userLocation", JSON.stringify(fallback));
      setLoading(false);
      return;
    }

    // Check for saved location first
    const saved = localStorage.getItem("userLocation");
    if (saved) {
      try {
        const parsedLocation = JSON.parse(saved);
        // Verify it's not the fallback location
        if (parsedLocation.lat !== 6.9271 || parsedLocation.lng !== 79.8612) {
          console.log("Using saved location:", parsedLocation);
          setLocation(parsedLocation);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("Error parsing saved location:", e);
      }
    }

    console.log("Requesting real-time location...");

    // Request location with proper options
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        console.log("Real location obtained:", loc);
        console.log("Accuracy:", position.coords.accuracy, "meters");
        setLocation(loc);
        localStorage.setItem("userLocation", JSON.stringify(loc));
        setLocationError(null);
        setLoading(false);
      },
      (error) => {
        console.error("Location error:", error.code, error.message);

        let errorMessage = "";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied by user";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
          default:
            errorMessage = "Unknown location error";
        }

        setLocationError(errorMessage);
        console.warn("Using fallback location due to:", errorMessage);

        const fallback = { lat: 6.9271, lng: 79.8612 };
        setLocation(fallback);
        localStorage.setItem("userLocation", JSON.stringify(fallback));
        setLoading(false);
      },
      {
        enableHighAccuracy: true, // Use GPS if available
        timeout: 20000, // Wait up to 10 seconds
        maximumAge: 0, // Don't use cached location
      }
    );
  }, []);

  if (loading || !location) {
    return (
      <div className="absolute inset-0 -z-10 h-full w-full flex items-center justify-center max-h-screen px-5 py-15 sm:py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]">
        <div className="text-center">
          <div className="animate-spin sm:w-12 sm:h-12 w-9 h-9 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm sm:text-xl font-semibold text-white">
            Getting your location...
          </p>
          <p className="text-xs font-normal text-white/50 mt-2">
            Location access is necessary to instantly locate nearest incidents
            and dispatch the closest volunteer support.
          </p>
          {locationError && (
            <p className="text-xs font-medium text-yellow-400 mt-4">
              {locationError} - Using approximate location
            </p>
          )}
        </div>
      </div>
    );
  }

  const submit = async () => {
    if (!location || !role) return;

    const cleanedPhone = phone.replace(/\D/g, "");
    const token = localStorage.getItem("access_token");

    console.log("Submitting with token:", token?.substring(0, 20) + "...");

    if (!token) {
      console.error("No token found");
      router.replace("/");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/me`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            role,
            lat: location.lat,
            lng: location.lng,
            phone: role === "VOLUNTEER" ? cleanedPhone : undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Update failed:", response.status, errorText);
        throw new Error(`Failed to update profile: ${response.status}`);
      }

      const data = await response.json();
      console.log("Update response:", data);

      if (data.access_token) {
        console.log("Saving new token");
        localStorage.setItem("access_token", data.access_token);
      }
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to save profile. Please try again.");
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/\D/g, "");

    if (numericValue.length <= 10) {
      setPhone(numericValue);
    }
  };

  const retryLocation = () => {
    localStorage.removeItem("userLocation");
    window.location.reload();
  };

  return (
    <div className="absolute inset-0 -z-10 h-full w-full flex items-center justify-center max-h-screen px-5 py-15 sm:py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]">
      <div className="rounded-3xl border-2 shadow-2xl border-gray-400/30 sm:py-15 sm:px-10 py-10 px-5 max-w-md w-full">
        <div className="text-center mb-8">
          <Image
            src="/resq.png"
            alt="Resq"
            width={100}
            height={100}
            className="mx-auto mb-1 hidden sm:block"
          />
          <Image
            src="/resq.png"
            alt="Resq"
            width={60}
            height={60}
            className="mx-auto mb-1 sm:hidden block"
          />
          <h1 className="text-gray-400 font-medium text-xs sm:text-sm">
            Please select your role!
          </h1>
        </div>

        {/* Role Selection */}
        <div className="space-y-4 mb-6">
          <button
            onClick={() => setRole("VICTIM")}
            className={`w-full p-2 rounded-2xl border-4 transition-all ${
              role === "VICTIM"
                ? " bg-[#131d27] shadow-lg scale-105"
                : "bg-[#131d27]"
            }`}
          >
            <div className="flex gap-4">
              <div className="bg-[#432c38] w-13 h-13 rounded-full flex justify-center items-center">
                <TriangleAlert className="w-8 h-8 text-[#f87171]" />
              </div>
              <div className="text-left">
                <div className=" sm:text-3xl">
                  <h1 className="text-sm sm:text-base font-semibold text-white">
                    Need Help
                  </h1>
                  <p className="text-xs text-gray-400 font-medium">
                    Report emergencies near me
                  </p>
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setRole("VOLUNTEER")}
            className={`w-full p-2 rounded-2xl border-4 transition-all ${
              role === "VOLUNTEER"
                ? " bg-[#131d27] shadow-lg scale-105"
                : "bg-[#131d27]"
            }`}
          >
            <div className="flex gap-4">
              <div className="bg-[#443e2c] w-13 h-13 rounded-full flex justify-center items-center">
                <HeartHandshake className="w-8 h-8 text-[#fbbf24]" />
              </div>
              <div className="text-left">
                <div className=" sm:text-3xl">
                  <h1 className="text-sm sm:text-base font-semibold text-white">
                    I Want to Help
                  </h1>
                  <p className="text-xs text-gray-400 font-medium">
                    Respond to emergencies nearby
                  </p>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Phone number — ONLY for volunteers */}
        {role === "VOLUNTEER" && (
          <div className="mb-6 animate-fadeIn">
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Your phone number required!
            </label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="077 123 4567"
              maxLength={10}
              pattern="\d{10}"
              title="Phone number must be exactly 10 digits."
              className="w-full px-4 py-3 border-2 border-indigo-950 text-white rounded-xl focus:outline-none focus:border-green-600 text-lg"
              required
            />
            <p className="text-xs font-medium text-gray-500 mt-2">
              Victims can contact you directly if you accept an incident.
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={submit}
          disabled={!role || (role === "VOLUNTEER" && !phone)}
          className={`w-full py-3 rounded-2xl font-semibold cursor-pointer text-sm sm:text-lg transition ${
            role && (role === "VICTIM" || phone)
              ? "bg-black/30 border border-gray-50 text-white hover:opacity-90"
              : "bg-gray-500/30 border border-gray-50 text-gray-50 cursor-not-allowed"
          }`}
        >
          {role === "VICTIM" ? "Continue as Victim" : "Become a Volunteer"}
        </button>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            {locationError && " (Approximate)"}
          </p>
          {locationError && (
            <button
              onClick={retryLocation}
              className="text-xs text-blue-400 hover:text-blue-300 mt-2 underline"
            >
              Retry with precise location
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
