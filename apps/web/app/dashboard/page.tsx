"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import type { Incident } from "../../types/types/incident";
import Image from "next/image";
import IncidentList from "./IncidentList";

// Dynamic map import — prevents SSR issues
const Map = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-screen bg-black flex items-center justify-center text-white text-xl md:text-2xl">
      Loading map...
    </div>
  ),
});

export interface User {
  id: string;
  email: string;
  role: "VICTIM" | "VOLUNTEER";
  lat: number;
  lng: number;
  phone?: string | null;
  name?: string | null;
  image?: string | null;
}

// CLIENT COMPONENT — contains useSearchParams, useEffects...
function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [nearbyIncidents, setNearbyIncidents] = useState<Incident[]>([]);
  const [myIncidents, setMyIncidents] = useState<Incident[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(true);
  const [loadingMyResponses, setLoadingMyResponses] = useState(true);
  const [showLogOut, setShowLogout] = useState(false);

  // Load More states
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  const [radius, setRadius] = useState(10000);
  const [zoom, setZoom] = useState<number>(13);
  const [showDragTip, setShowDragTip] = useState(true);

  const [mapIncidents, setMapIncidents] = useState<Incident[]>([]);

  // Determine active tab from URL
  const activeTab =
    (searchParams.get("tab") as "responses" | null) === "responses"
      ? "responses"
      : "emergencies";

  // Close logout dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowLogout(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Effect to fetch EVERYTHING for the map whenever radius/location changes
  useEffect(() => {
    if (user && token) {
      fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/incidents/map-pins?lat=${user.lat}&lng=${user.lng}&radius=${radius}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
        .then((res) => res.json())
        .then((data) => setMapIncidents(data));
    }
  }, [user?.lat, user?.lng, radius]); // Only triggers on major changes, not scrolling

  // Fetch user profile
  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (!storedToken) {
      router.replace("/");
      return;
    }
    setToken(storedToken);

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${storedToken}`,
        "Cache-Control": "no-cache",
      },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then((data) => {
        if (!data.lat || !data.lng) {
          router.replace("/onboarding");
          return;
        }
        setUser(data as User);
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        router.replace("/");
      });
  }, [router]);

  // Fetch nearby emergencies with pagination
  // Inside DashboardContent component

  const fetchNearby = async (reset = false) => {
    if (!user || !token) return;

    // Prevent multiple simultaneous fetches
    if (isLoadingMore || (loadingNearby && !reset)) return;

    if (reset) {
      setLoadingNearby(true);
      // Don't clear incidents immediately to avoid layout jump
      setNextCursor(null);
      setHasMore(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const cursorParam = !reset && nextCursor ? `&cursor=${nextCursor}` : "";
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/incidents/nearby?lat=${user.lat}&lng=${user.lng}&radius=${radius}&limit=20${cursorParam}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();

      setNearbyIncidents((prev) =>
        reset ? result.data : [...prev, ...result.data]
      );

      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoadingNearby(false);
      setIsLoadingMore(false);
    }
  };

  // Initial fetch when user, token, or radius changes
  useEffect(() => {
    if (user && token) {
      fetchNearby(true); // Reset and load fresh data
    }
  }, [user, token, radius]);

  // Fetch my responses / my reports
  useEffect(() => {
    if (activeTab !== "responses" || !user || !token) return;

    const endpoint =
      user.role === "VOLUNTEER"
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/incidents/my-responses`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/incidents/my-reports`;

    const fetchMy = async () => {
      setLoadingMyResponses(true);
      try {
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const cleaned = Array.isArray(data)
          ? data.map((i: any) => ({
              ...i,
              lat: Number(i.lat),
              lng: Number(i.lng),
            }))
          : [];
        setMyIncidents(cleaned);
      } catch (err) {
        console.error(err);
        setMyIncidents([]);
      } finally {
        setLoadingMyResponses(false);
      }
    };

    fetchMy();
  }, [user, token, activeTab]);

  // Hide drag tip after 5 seconds
  useEffect(() => {
    const t = setTimeout(() => setShowDragTip(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // Update zoom when radius changes
  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    if (newRadius <= 10000) setZoom(11);
    else if (newRadius <= 20000) setZoom(10.5);
    else if (newRadius <= 30000) setZoom(9);
    else if (newRadius <= 40000) setZoom(8);
    else setZoom(7.5);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore && activeTab === "emergencies") {
      fetchNearby(false);
    }
  };

  const handleLogOut = () => {
    localStorage.removeItem("access_token");
    router.replace("/");
  };

  if (!user) {
    return (
      <div className="h-screen bg-black text-white flex items-center justify-center text-xl">
        Loading your profile...
      </div>
    );
  }

  const openIncidents =
    activeTab === "emergencies" ? nearbyIncidents : myIncidents;
  const isLoading =
    activeTab === "emergencies" ? loadingNearby : loadingMyResponses;

  return (
    <>
      <Map user={user} incidents={mapIncidents} zoom={zoom} token={token!} />

      {/* Top Tab Bar */}
      <div className="fixed top-4 left-2 right-2 z-50">
        <div className="flex justify-between">
          <div className="flex justify-start items-center gap-2 p-3 rounded-4xl w-full sm:w-1/3 bg-black/20 backdrop-blur-sm">
            {/* Profile Picture + Logout */}
            <div className="relative" ref={profileRef}>
              <Image
                onClick={() => setShowLogout(!showLogOut)}
                src={user.image || "/user.png"}
                width={30}
                height={30}
                alt="Profile"
                className="rounded-full cursor-pointer"
              />
              {showLogOut && (
                <div
                  onClick={handleLogOut}
                  className="absolute top-12 left-1/2 -translate-x-1/2 w-24 bg-black/90 text-white text-center py-2 rounded-lg text-sm cursor-pointer"
                >
                  Log Out
                </div>
              )}
            </div>

            {/* Emergencies Tab */}
            <button
              onClick={() => router.push("/dashboard")}
              className={`flex-1 py-2 px-4 rounded-2xl cursor-pointer font-semibold text-xs md:text-sm transition-all ${
                activeTab === "emergencies"
                  ? "bg-[#102d49] text-[#127eeb]"
                  : "bg-[#27313d] text-[#cfd3d9]"
              }`}
            >
              Emergencies ({mapIncidents.length})
            </button>

            {/* My Responses / Reports Tab */}
            <button
              onClick={() => router.push("/dashboard?tab=responses")}
              className={`flex-1 py-2 px-4 rounded-2xl cursor-pointer font-semibold text-xs md:text-sm transition-all ${
                activeTab === "responses"
                  ? "bg-[#102d49] text-[#127eeb]"
                  : "bg-[#27313d] text-[#cfd3d9]"
              }`}
            >
              {user.role === "VOLUNTEER" ? "My Responses" : "My Reports"}
            </button>
          </div>
        </div>
      </div>

      {/* Drag tip */}
      {showDragTip && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-4 py-2 rounded-full z-40 animate-pulse">
          Drag the marker to change location!
        </div>
      )}

      {/* Floating + button for victims */}
      {user.role === "VICTIM" && (
        <button
          onClick={() => router.push("/report")}
          className="fixed bottom-16 right-4 md:right-6 w-14 h-14 cursor-pointer bg-[#137fec] rounded-full shadow-2xl z-50 hover:scale-110 transition-all flex items-center justify-center"
        >
          <Plus className="w-8 h-8 text-white" />
        </button>
      )}

      {/* Incident List */}
      <IncidentList
        openIncidents={openIncidents}
        isLoading={isLoading}
        activeTab={activeTab}
        user={user}
        handleRadiusChange={handleRadiusChange}
        radius={radius}
        onLoadMore={handleLoadMore}
        hasMore={hasMore && activeTab === "emergencies"}
        isLoadingMore={isLoadingMore}
      />
    </>
  );
}

// SERVER COMPONENT — only wraps with Suspense
export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen bg-black text-white flex items-center justify-center text-2xl">
          Loading ResQ Dashboard...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
