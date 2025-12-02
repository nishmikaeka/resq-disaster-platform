"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { ArrowLeft } from "lucide-react";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface Location {
  lat: number;
  lng: number;
}

const ReportPage = () => {
  const router = useRouter();

  // Incident states
  const [title, settitle] = useState("");
  const [description, setdescription] = useState("");
  const [urgency, seturgency] = useState<"LOW" | "MEDIUM" | "HIGH">("HIGH");
  const [phone, setPhone] = useState<string>("");

  // Location states
  const [location, setlocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  // File state handling
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map refs
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  //Performs reverse geocoding (lat, lng -> address) using Mapbox API.
  const fetchAddress = useCallback(async (lat: number, lng: number) => {
    setAddress("Fetching location details...");
    const token = mapboxgl.accessToken;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        setAddress(data.features[0].place_name);
      } else {
        setAddress(`Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      setAddress("Could not fetch address details.");
    }
  }, []);

  // Geolocation fetch
  useEffect(() => {
    const fallbackLocation = { lat: 6.9271, lng: 79.8612 }; // Colombo fallback location if fetching unsuccesful
    const timeoutSeconds = 20000;

    const errorCallback = (error: GeolocationPositionError) => {
      let errorMessage = "Location access denied or timed out.";

      if (error.code === error.PERMISSION_DENIED) {
        errorMessage = "Location permission denied. Using fallback location.";
      } else if (error.code === error.TIMEOUT) {
        errorMessage = "Location request timed out. Using fallback location.";
      }

      console.error("Geolocation Error:", error.message);
      setlocation(fallbackLocation);
      setLocationError(errorMessage);
    };

    const options = {
      enableHighAccuracy: true,
      timeout: timeoutSeconds,
      maximumAge: 0,
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLoc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setlocation(newLoc);
          setLocationError(
            `Accuracy: ${pos.coords.accuracy.toFixed(0)}m. Drag marker to correct.`
          );
        },
        errorCallback,
        options
      );
    } else {
      setlocation(fallbackLocation);
      setLocationError("Geolocation is not supported by your browser.");
    }
  }, []);

  // Map intialization with marker logic
  useEffect(() => {
    if (!location || !mapContainer.current) return;

    const { lng, lat } = location;

    // Always fetch the address for the current state location
    fetchAddress(lat, lng);

    // Map Initialization (Run only once)
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [lng, lat],
        zoom: 13,
      });

      // Add Draggable Marker
      marker.current = new mapboxgl.Marker({
        color: "#ef4444",
        draggable: true,
      })
        .setLngLat([lng, lat])
        .addTo(map.current);

      // Setup Drag End Listener
      marker.current.on("dragend", () => {
        if (marker.current) {
          const newLngLat = marker.current.getLngLat();

          const newLocation = { lat: newLngLat.lat, lng: newLngLat.lng };
          setlocation(newLocation);
          console.log(newLocation);
          setLocationError("Location manually set by user.");
        }
      });
    }

    // Update Map/Marker (Runs on subsequent state changes)
    else {
      map.current.flyTo({ center: [lng, lat], speed: 1.5 });
      marker.current?.setLngLat([lng, lat]);
    }

    // F. Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [location, fetchAddress]);

  // Image File Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file (JPG, PNG, GIF, WEBP).");
        setImageFile(null);
        setImagePreviewUrl(null);
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreviewUrl(null);
    }
  };

  // FORM SUBMISSION
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      alert("Location data is unavailable. Cannot submit report.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();

    // Append Incident data fields
    formData.append("title", title);
    formData.append("description", description);
    formData.append("urgency", urgency);
    formData.append("lat", location.lat.toString());
    formData.append("lng", location.lng.toString());
    formData.append("phone", phone);

    // Append the image file
    if (imageFile) {
      formData.append("file", imageFile);
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("Authentication required.");
      setIsSubmitting(false);
      router.replace("/");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/incidents`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        alert(
          `Failed to report incident: ${errorData.message || response.statusText}`
        );
        return;
      }
      alert("Incident reported successfully! Help is on the way.");
      console.log(location);
      router.push("/dashboard");
    } catch (err) {
      console.error("Submission error:", err);
      alert("An unexpected error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function for urgency styling
  const getUrgencyStyles = (level: "LOW" | "MEDIUM" | "HIGH") => {
    if (urgency === level) {
      switch (level) {
        case "HIGH":
          return "bg-red-500 text-white";
        case "MEDIUM":
          return "bg-yellow-500 text-gray-900";
        case "LOW":
          return "bg-green-400 text-gray-900 ";
      }
    }
    return "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 border border-gray-700/50";
  };

  // Rendering part
  return (
    <div className="absolute inset-0 -z-10 h-full w-full flex items-center justify-center max-h-screen sm:px-5 sm:py-5 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_155%)]">
      <div className="w-full max-w-2xl h-full overflow-y-auto sm:border-2 sm:border-gray-400/30 sm:py-2 rounded-3xl scrollbar-hide">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="text-left flex items-center mb-2">
            <button
              onClick={() => router.back()}
              className="pr-2 hover:bg-white/5 rounded-lg transition-all"
            >
              <ArrowLeft className="w-6 h-6 text-gray-400" />
            </button>
            <div>
              <h1 className="text-base sm:text-xl font-semibold text-white">
                Report Emergency
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Title Input */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10 hover:border-blue-500/50 transition-all">
              <label className="text-xs text-gray-400 mb-1 block font-medium">
                Emergency Title
              </label>
              <input
                type="text"
                placeholder="e.g., House Fire, Car Crash, Medical Emergency"
                value={title}
                onChange={(e) => settitle(e.target.value)}
                required
                className="w-full bg-transparent text-white text-xs placeholder-gray-500 focus:outline-none"
              />
            </div>

            {/* Description */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10 hover:border-blue-500/50 transition-all">
              <label className="text-xs text-gray-400 mb-1 block font-medium">
                Description
              </label>
              <textarea
                placeholder="Provide detailed information about the emergency..."
                value={description}
                onChange={(e) => setdescription(e.target.value)}
                rows={2}
                className="w-full bg-transparent text-white text-xs placeholder-gray-500 focus:outline-none resize-none"
              />
            </div>

            {/* Urgency & Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Phone Input */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 hover:border-blue-500/50 transition-all">
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">
                  Contact Number
                </label>
                <input
                  type="tel"
                  placeholder="0703193449"
                  value={phone}
                  maxLength={10}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none"
                />
              </div>
              {/* Urgency Selector */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <label className="text-xs text-gray-400 mb-2 block font-medium">
                  Urgency Level
                </label>
                <div className="flex gap-1.5">
                  {(["HIGH", "MEDIUM", "LOW"] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => seturgency(level)}
                      className={`flex-1 py-1.5 px-1 rounded-lg text-xs font-medium transition-all ${getUrgencyStyles(level)}`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <label className="text-xs text-gray-400 mb-2 block font-medium">
                Attach Image (Optional)
              </label>
              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/gif, image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isSubmitting}
                />
                <div
                  className={`p-3 rounded-lg border-2 border-dashed transition-all text-center ${
                    imageFile
                      ? "border-green-400/50 bg-green-400/5"
                      : "border-gray-700/50 hover:border-blue-500/50 bg-gray-800/30"
                  }`}
                >
                  {imageFile ? (
                    <div className="flex items-center justify-center gap-2">
                      {imagePreviewUrl && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={imagePreviewUrl}
                          alt="Preview"
                          className="w-10 h-10 rounded-lg object-cover border border-green-400/50"
                        />
                      )}
                      <div className="text-left">
                        <p className="text-green-400 text-xs font-medium">
                          Image Selected
                        </p>
                        <p className="text-gray-400 text-xs truncate max-w-[150px]">
                          {imageFile.name}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-400 text-xs mb-0.5">
                        Click to upload an image
                      </p>
                      <p className="text-gray-500 text-xs">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* Map Display */}
            <div className="relative h-48 sm:h-56 rounded-xl overflow-hidden border border-white/10 shadow-lg">
              <div
                ref={mapContainer}
                className="absolute inset-0 w-full h-full"
              />
              <div className="absolute top-2 left-1/2  transform -translate-x-1/2 bg-red-500/90 backdrop-blur-sm text-white font-semibold px-2 py-1 rounded-full text-[10px] z-10 shadow-lg">
                SELECT LOCATION
              </div>
              <div className="absolute bottom-2 left-1/2  transform -translate-x-1/2  bg-black/80 backdrop-blur-sm text-white/90 px-2.5 py-1.5 rounded-lg text-[10px] z-10">
                <p className="truncate">
                  {address ? address : locationError || "Getting location..."}
                </p>
              </div>
            </div>

            {/* Submission Button */}
            <button
              type="submit"
              disabled={!location || !title || isSubmitting}
              className={`w-full py-3 rounded-xl font-semibold text-base transition-all ${
                location && title && !isSubmitting
                  ? "bg-[#0e66be] hover:bg-blue-800 shadow-lg  hover:scale-[1.02] text-white"
                  : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? "Submitting Report..." : "Report Emergency Now"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
