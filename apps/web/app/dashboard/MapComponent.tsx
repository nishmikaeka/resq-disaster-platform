"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

import "mapbox-gl/dist/mapbox-gl.css";
import type { Incident } from "../../types/types/incident";
import { User } from "./page";
import { useRouter } from "next/navigation";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface Props {
  user: User;
  incidents: Incident[];
  token: string;
  zoom: number;
}

export default function MapComponent({ user, incidents, zoom, token }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const router = useRouter();

  const showMessage = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const updateLocation = useCallback(
    async (lat: number, lng: number) => {
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/location`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ lat, lng }),
          }
        );
        showMessage("Location updated successfully!", "success");
      } catch (err) {
        console.error("Failed to update user location:", err);
        showMessage("Failed to save new location.", "error");
      }
    },
    [token]
  );

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map only once
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [user.lng, user.lat],
        zoom: zoom,
      });
      console.log(incidents);

      //add user  marker with green dot (current location fetched)
      marker.current = new mapboxgl.Marker({
        color: "#da1f1f",
        draggable: true,
      })
        .setLngLat([user.lng, user.lat])
        .setPopup(
          new mapboxgl.Popup().setText("Your are here! Drag me if im inacurate")
        )
        .addTo(map.current);

      marker.current.on("dragend", () => {
        if (marker.current) {
          const newLngLat = marker.current.getLngLat();
          updateLocation(newLngLat.lat, newLngLat.lng);
        }
      });
    }
    // Explicitly call the Mapbox API to change the zoom level
    if (map.current.getZoom() !== zoom) {
      map.current.setZoom(zoom);
    }
    // Clear old incident markers
    document.querySelectorAll(".mapboxgl-marker").forEach((el) => {
      if (!el.innerHTML.includes("da1f1f")) el.remove(); // Keep only green user marker
    });

    // Add incident markers
    incidents.forEach((inc) => {
      const el = document.createElement("div");
      el.innerHTML = `
          <div class="w-4 h-4 bg-red-700/90 rounded-full animate-ping absolute inset-0"></div>
          <div class="relative w-4 h-4 bg-red-700 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-2xl">
          </div>
        `;

      el.addEventListener("click", () => {
        // Navigate to the incident details page
        // Replace this URL with your actual route (e.g., /incidents/[id])
        router.push(`/incident/${inc.id}`);
      });

      new mapboxgl.Marker({ element: el })
        .setLngLat([
          inc.lng + (Math.random() - 0.5) * 0.005,
          inc.lat + (Math.random() - 0.5) * 0.005,
        ]) // Mock location
        .setPopup(
          new mapboxgl.Popup({ offset: 30 }).setHTML(`
              <div class="p-3 bg-gray-900 text-white rounded-lg">
                <h3 class="font-bold">${inc.title || "Emergency"}</h3>
                <p class="text-xs opacity-80">Nearby • ${inc.urgency || "MEDIUM"}</p>
              </div>
            `)
        )
        .addTo(map.current!);
    });
  }, [user, incidents, zoom, updateLocation]);

  return (
    <>
      <div className="fixed inset-0">
        <div ref={mapContainer} className="w-full h-full" />
      </div>

      {/* Toast */}
      {message && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-100 px-1 py-2 rounded-4xl font-mono text-xs text-white bg-black/20 shadow-2xl transition-all ${
            message.type === "success" ? "text-center" : "bg-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Bottom Sheet */}
    </>
  );
}
