"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import type { Incident } from "../../types/types/incident";
import Image from "next/image";
import IncidentList from "./IncidentList";

// Type of the user thats fetching from the api/auth/me
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

// Dynamic map import for SSR safety
const Map = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-screen bg-black flex items-center justify-center text-white text-xl md:text-2xl">
      Loading map...
    </div>
  ),
});

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [nearbyIncidents, setNearbyIncidents] = useState<Incident[]>([]);
  const [myIncidents, setMyIncidents] = useState<Incident[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(true);
  const [loadingMyResponses, setLoadingMyResponses] = useState(true);
  const [showLogOut, setShowLogout] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  //change the range of incidents thats showing
  const [radius, setRadius] = useState(10000);
  const [zoom, setZoom] = useState<number>(13); //change the zoom of map accroding to radius
  const [showDragTip, setShowDragTip] = useState(true);

  // Determine active tab from URL or default
  const activeTab =
    (searchParams.get("tab") as "responses" | null) === "responses"
      ? "responses"
      : "emergencies";

  //handle clicks outside profile picture to disable showLogout button
  // app/dashboard/page.tsx (Snippet)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If the click is outside the profile container, close the dropdown
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowLogout(false);
      }
    };

    // Attach the listener when the component mounts (every mousedown click is tracked and firing an event to check its inside the profileRef useRef)
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up the listener when the component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileRef]);

  // Load user from api/auth/me
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

  // Load nearby emergencies
  useEffect(() => {
    if (!user || !token) return;

    const fetchNearby = async () => {
      setLoadingNearby(true);
      try {
        const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/incidents/nearby?lat=${user.lat}&lng=${user.lng}&radius=${radius}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(
            `HTTP Error: ${res.status} - ${errorText || res.statusText}`
          );
        }

        let data;
        try {
          data = await res.json();
        } catch (e) {
          data = []; // Handle empty body
        }

        setNearbyIncidents(
          Array.isArray(data)
            ? data.filter((i: Incident) => i.status === "OPEN" || "IN_PROGRESS")
            : []
        );
      } catch (err) {
        console.error(err);
        setNearbyIncidents([]);
      } finally {
        setLoadingNearby(false);
      }
    };

    fetchNearby();
  }, [user, token, radius]);

  // Load my accepted responses/reports
  useEffect(() => {
    if (activeTab !== "responses" || !user || !token) return;

    const endpoint =
      user.role === "VOLUNTEER"
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/incidents/my-responses`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/incidents/my-reports`;

    const fetchMyIncidents = async () => {
      setLoadingMyResponses(true);
      try {
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(
            `HTTP Error: ${res.status} - ${errorText || res.statusText}`
          );
        }

        let data;
        try {
          data = await res.json();
        } catch (e) {
          data = []; // Handle empty body
        }

        const incidentsWithCleanCoords = Array.isArray(data)
          ? data.map((incident) => ({
              ...incident,
              lat: Number(incident.lat),
              lng: Number(incident.lng),
            }))
          : [];

        setMyIncidents(incidentsWithCleanCoords);
      } catch (err) {
        console.error(err);
        setMyIncidents([]);
      } finally {
        setLoadingMyResponses(false);
      }
    };

    fetchMyIncidents();
  }, [user, token, activeTab]);

  // Hide the drag tip after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDragTip(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Update zoom based on range selected by the user
  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);

    if (newRadius <= 10000) {
      setZoom(11);
    } else if (newRadius <= 20000) {
      setZoom(10.5);
    } else if (newRadius <= 30000) {
      setZoom(9);
    } else if (newRadius <= 40000) {
      setZoom(8);
    } else {
      setZoom(7.5);
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
      <Map user={user} incidents={openIncidents} zoom={zoom} token={token!} />

      {/*TOP tab bar containing Emergency,Response tabs*/}
      <div className="fixed top-4 left-2 right-2 z-50">
        <div className="flex justify-between">
          <div
            className={`flex justify-start items-center gap-2 p-3 rounded-4xl w-full sm:w-1/3 bg-black/30 backdrop-blur-2xl`}
          >
            {/* User Profile Picture */}
            <div
              className="relative"
              onClick={() => {
                setShowLogout(!showLogOut);
              }}
              ref={profileRef}
            >
              <Image
                src={user.image || "/user.png"}
                width={30}
                height={30}
                alt="User profile image"
                className="rounded-full"
              />
              {showLogOut && (
                <div
                  onClick={handleLogOut}
                  className="w-20 h-auto  absolute top-12 rounded-md bg-black"
                >
                  <div className="text-white text-center text-sm pt-1 p-2 font-semibold">
                    Log Out
                  </div>
                </div>
              )}
            </div>

            {/* Left Tab: All emegencies */}
            <button
              onClick={() => router.push("/dashboard")}
              className={`flex-1 py-2 px-1 flex flex-col items-center cursor-pointer font-semibold rounded-2xl justify-start gap-3 transition-all text-xs md:text-sm ${
                activeTab === "emergencies"
                  ? "bg-[#102d49] text-[#127eeb]"
                  : "bg-[#27313d] text-[#cfd3d9]"
              }`}
            >
              <span className="font-medium whitespace-nowrap">
                Emergencies ({nearbyIncidents.length})
              </span>
            </button>

            {/* Right Tab: User-Specific List */}
            <button
              onClick={() => router.push("/dashboard?tab=responses")}
              className={`flex-1 py-2 px-1 flex flex-col items-center cursor-pointer font-semibold rounded-2xl justify-center gap-1 transition-all text-xs md:text-sm ${
                activeTab === "responses"
                  ? "bg-[#102d49] text-[#127eeb]"
                  : "bg-[#27313d] text-[#cfd3d9]"
              }`}
            >
              <span className="font-medium whitespace-nowrap">
                {user.role === "VOLUNTEER" ? `My Responses` : `My Reports`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {showDragTip && (
        <div className="absolute bg-black/30 top-20 sm:top-2 left-1/2 transform -translate-x-1/2 rounded-3xl z-40 transition-opacity duration-500">
          <p className="text-white text-center text-xs font-mono p-2">
            Drag the marker to change location!
          </p>
        </div>
      )}

      {/* Blue add button to add incident only visible to victims */}
      {user.role === "VICTIM" && (
        <button
          onClick={() => router.push("/report")}
          className="fixed bottom-16 right-4 md:right-6 w-14 h-14 bg-[#137fec] rounded-full shadow-2xl z-50 hover:scale-110 transition-all flex items-center justify-center"
        >
          <Plus className="w-6 h-6 md:w-12 md:h-20 text-white" />
        </button>
      )}

      <IncidentList
        openIncidents={openIncidents}
        isLoading={isLoading}
        activeTab={activeTab}
        user={user}
        handleRadiusChange={handleRadiusChange}
        radius={radius}
      />
    </>
  );
}
