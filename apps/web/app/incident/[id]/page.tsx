"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Phone,
  Clock,
  ArrowLeft,
  UserRound,
  PhoneCall,
  PhoneForwarded,
  MapPinPlusInside,
} from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { User } from "../../dashboard/page";
import { TimeAgo } from "../../utils/TimeAgo";
import { Incident } from "../../../types/types/incident";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

// call props interface to handle opening a call
interface CallLinkProps {
  phoneNumber: string | number;
}
interface volunteerCallLinkProps {
  phoneNumber: string | number;
}

const cleanPhoneNumber = (number: string | number) => {
  const numString = String(number);
  return numString ? numString.replace(/\D/g, "") : "";
};

//show the victims phone number as a callable element
const CallLink = ({ phoneNumber }: CallLinkProps) => {
  const callToNumber = cleanPhoneNumber(phoneNumber);

  if (!phoneNumber) {
    return (
      <p className="text-xs text-gray-500 flex items-center gap-2 mb-2">
        <Phone className="w-4 h-4 text-gray-400" /> N/A
      </p>
    );
  }

  return (
    <a
      href={`tel:${callToNumber}`}
      className="text-sm font-normal text-blue-400 flex items-center gap-2 mb-2 transition duration-150 hover:text-blue-500"
      aria-label={`Call ${phoneNumber}`}
    >
      <PhoneCall className="w-4 h-4 text-gray-400" />
      <span className="group-hover:underline cursor-pointer">
        <span className="text-gray-400 text-sm">Victim: </span>
        {phoneNumber}
      </span>
    </a>
  );
};
//show the volunteer phone number as a callable element
const VolunteerCallLink = ({ phoneNumber }: volunteerCallLinkProps) => {
  const callToNumber = cleanPhoneNumber(phoneNumber);

  if (!phoneNumber) {
    return (
      <p className="text-xs text-gray-500 flex items-center gap-2 mb-2">
        <Phone className="w-4 h-4 text-gray-400" /> N/A
      </p>
    );
  }

  return (
    <a
      href={`tel:${callToNumber}`}
      className="text-sm font-normal text-green-400 flex items-center gap-2 mb-2 transition duration-150 hover:text-green-500"
      aria-label={`Call ${phoneNumber}`}
    >
      <PhoneForwarded className="w-4 h-4 text-gray-400" />
      <span className="group-hover:underline">
        <span className="text-gray-400 text-sm cursor-pointer">
          Volunteer:{" "}
        </span>
        {phoneNumber}
      </span>
    </a>
  );
};

export default function IncidentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false); //handle accepting of a incident by volunteer
  const [canceling, setCanceling] = useState(false); //handle cancallation of a incident by a victim
  const [resolving, setResolving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [address, setAddress] = useState<string | null>(null); //fetch the address from lat,lng

  const mapContainer = useRef<HTMLDivElement>(null);

  // Load incident details
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/incidents/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setIncident(data);
        setLoading(false);
        console.log("data fetched");
      })
      .catch(() => router.push("/dashboard"));
  }, [id, router]);

  // Accept incident
  const acceptIncident = async () => {
    if (accepting || incident?.status !== "OPEN") return;
    setAccepting(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/incidents/${id}/accept`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.ok) {
        router.push("/dashboard?tab=responses");
      } else {
        console.error("Someone already accepted this incident");
      }
    } catch (err) {
      console.error("Failed to accept", err);
    } finally {
      setAccepting(false);
    }
  };

  //Cancellation of incident by the volunteer
  const cancelIncident = async () => {
    const token = localStorage.getItem("access_token");

    if (
      canceling ||
      incident?.status === "OPEN" ||
      incident?.status === "RESOLVED"
    )
      return;
    setCanceling(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/incidents/${id}/cancel`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.ok) {
        router.push("/dashboard?tab=emergencies");
      } else {
        console.log("Lookslike something wrong");
      }
    } catch (error) {
      console.error("Lookslike incident is Resolved or deleted", error);
    } finally {
      setCanceling(false);
    }
  };

  //Closing of the report after resolved by victim
  const resolveIncident = async () => {
    const token = localStorage.getItem("access_token");

    if (
      resolving ||
      incident?.status === "OPEN" ||
      incident?.status === "RESOLVED"
    )
      return;
    setResolving(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/incidents/${id}/close`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.ok) {
        router.push("/dashboard?tab=emergencies");
      } else {
        console.log("Lookslike something wrong");
      }
    } catch (error) {
      console.error("Lookslike incident is deleted", error);
    } finally {
      setResolving(false);
    }
  };

  //reverse mapping of lng,lat to fetch the address
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
  // Map component mounting
  useEffect(() => {
    if (!incident || !mapContainer.current) return;

    const lng = Number(incident.lng);
    const lat = Number(incident.lat);
    fetchAddress(lat, lng);

    // Safety check — if still NaN, don't crash
    if (isNaN(lng) || isNaN(lat)) {
      console.error("Invalid coordinates:", incident.lng, incident.lat);
      return;
    }

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [lng, lat],
      zoom: 11,
    });

    new mapboxgl.Marker({ color: "#ef4444", scale: 1.3 })
      .setLngLat([lng, lat])
      .setPopup(new mapboxgl.Popup().setText("Victim is here"))
      .addTo(map)
      .togglePopup();

    return () => map.remove();
  }, [incident, fetchAddress]);

  //fetch the api/auth/me to verify the victim is equal to the victim who created the incident
  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (!storedToken) {
      router.replace("/");
      return;
    }
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

  if (loading) {
    return (
      <div className="absolute inset-0 -z-10 h-full w-full flex items-center justify-center max-h-screen px-5 py-15 sm:py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="absolute inset-0 -z-10 h-full w-full flex items-center justify-center max-h-screen px-5 py-15 sm:py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]">
        <div className="text-red-500 text-2xl">Not found</div>
      </div>
    );
  }

  const victim = incident.user;
  const urgencyColor =
    incident.urgency === "HIGH"
      ? "text-[#ff3b30]"
      : incident.urgency === "MEDIUM"
        ? "text-orange-400"
        : "text-green-400";

  const statusColor =
    incident.status === "OPEN"
      ? "text-[#ffaa33]"
      : incident.status === "IN_PROGRESS"
        ? "text-green-400"
        : "text-gray-400";

  return (
    <div className="absolute inset-0 -z-10 h-full w-full flex items-center justify-center max-h-screen sm:px-5 sm:py-5 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_175%)]">
      <div className="w-full max-w-2xl h-full overflow-y-auto sm:border-2 sm:border-gray-400/30 sm:py-2 rounded-4xl scrollbar-hide">
        {/* Top Navigation */}
        <div className="relative top-0 z-50 bg-[#1a1f2e]/0 backdrop-blur-xl border-b border-white/10 rounded-t-3xl">
          <div className="flex items-center justify-start p-0">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/5 rounded-lg transition-all"
            >
              <ArrowLeft className="w-6 h-6 text-gray-400" />
            </button>
            <h1 className="text-base text-left font-semibold text-white">
              Emergency Details
            </h1>
            <div className="w-10" />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 px-4 pt-3 pb-6 space-y-4 backdrop-blur-sm">
          {/* Title & Description Section */}
          <div
            className={`bg-[#1a1f2e]/50 backdrop-blur-xl rounded-2xl pl-4 p-6 pt-4 space-y-2 border border-white/10`}
          >
            <div className="flex justify-between mt-0 sm:mt-2 items-center">
              <h2 className="text-[20px] font-semibold text-white max-w-2xl">
                {incident.title}
              </h2>
            </div>
            {incident.description && (
              <p className="text-gray-400 text-sm font-normal mb-3 -mt-2 sm:w-4/5">
                {incident.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mb-2 -mt-1">
              <div
                className={`inline-flex items-center gap-2 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[11px] font-bold ${urgencyColor}`}
              >
                {incident.urgency} URGENCY
              </div>
              <div
                className={`inline-flex items-center gap-2 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[11px] font-bold ${statusColor}`}
              >
                STATUS {incident.status}
              </div>
            </div>
            <p className="text-sm font-normal text-gray-400 flex gap-2 items-center mb-1">
              <UserRound className="w-4 text-gray-400" />
              {victim.name || "Unknown"}
            </p>
            <p className="text-sm font-normal text-gray-400 flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <TimeAgo createdAt={incident.createdAt} />
            </p>
            <p className="text-sm text-gray-400 flex gap-1 items-center">
              <MapPinPlusInside className="w-4" />
              {incident.distance
                ? `${(incident.distance / 1000).toFixed(1)} Km away`
                : "Location hidden"}
            </p>

            {/* Using the new external CallLink */}
            <CallLink phoneNumber={incident.phone} />
            {incident.volunteer && incident.volunteer.phone && (
              <VolunteerCallLink phoneNumber={incident.volunteer.phone} />
            )}

            <div className="space-y-3">
              {/* Scene Photos */}
              {incident.media && incident.media.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-2"></div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {incident.media.map((m, i) => {
                      const imageUrl =
                        typeof m === "string" ? m : (m as { url: string }).url;

                      return (
                        <div
                          key={i}
                          className="relative overflow-hidden rounded-xl border border-white/10 group"
                        >
                          {/*eslint-disable-next-line*/}
                          <img
                            src={imageUrl}
                            alt={`Scene ${i + 1}`}
                            className="w-auto h-44 object-cover group-hover:scale-110 transition-transform duration-300"
                            // Fallback in case Cloudinary image fails to load
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = `https://placehold.co/400x300/1a1f2e/ffffff?text=Image+Load+Failed`;
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="space-y-3 relative">
            <div className="h-60 sm:h-72 bg-[#1a1f2e]/80 backdrop-blur-xl  rounded-2xl border border-white/10 overflow-hidden">
              <div ref={mapContainer} className="w-full h-full" />
            </div>
            <div className="absolute bottom-2 left-1/2  transform -translate-x-1/2  bg-white/80 backdrop-blur-sm text-black/90 px-2.5 py-1 rounded-lg text-[10px] font-medium z-10">
              <p className="truncate">{address}</p>
            </div>
          </div>

          {/* Action Button */}
          {incident.status === "RESOLVED" ? (
            // Resolved State - check if the incident is resolved
            <div className="pt-0">
              <div className="text-center py-3 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-base font-medium text-gray-400">
                  This Incident Has Been Resolved
                </p>
              </div>
            </div>
          ) : incident.userId === user?.id ? (
            // Reporter (Victim) Actions: Only show RESOLVE button if OPEN or IN_PROGRESS
            incident.status === "OPEN" || incident.status === "IN_PROGRESS" ? (
              <div className="">
                <button
                  onClick={resolveIncident}
                  disabled={resolving}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-base font-semibold transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed  cursor-pointer border border-white/20 relaive overflow-hidden"
                >
                  <span className="relative flex items-center justify-center gap-3">
                    {resolving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        RESOLVING...
                      </>
                    ) : (
                      <>CLICK IF RESOLVED!</>
                    )}
                  </span>
                </button>
              </div>
            ) : null // Should not happen if RESOLVED check is first, but for safety
          ) : user?.role === "VOLUNTEER" ? (
            // Volunteer Actions
            incident.status === "OPEN" ? (
              // A. Volunteer Accepts: Status is OPEN, not assigned yet
              <div className="">
                <button
                  onClick={acceptIncident}
                  disabled={accepting}
                  className="w-full bg-[#0e66be] hover:bg-blue-800 cursor-pointer text-white py-3 rounded-xl text-base relative font-semibold transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed border border-white/20  overflow-hidden"
                >
                  <span className="relative flex items-center justify-center gap-3">
                    {accepting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ACCEPTING...
                      </>
                    ) : (
                      <>I'M GOING TO HELP</>
                    )}
                  </span>
                </button>
              </div>
            ) : incident.volunteerId === user?.id &&
              incident.status === "IN_PROGRESS" ? (
              // Volunteer Cancels: Status is IN_PROGRESS and assigned to current user
              <div className="">
                <button
                  onClick={cancelIncident}
                  disabled={canceling}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 cursor-pointer rounded-xl text-base font-semibold transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed border border-white/20 relaive overflow-hidden"
                >
                  <span className="relative flex items-center justify-center gap-3">
                    {canceling ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        CANCELING...
                      </>
                    ) : (
                      <>CANCEL YOUR HELP</>
                    )}
                  </span>
                </button>
              </div>
            ) : incident.volunteerId !== user?.id &&
              incident.status === "IN_PROGRESS" ? (
              // Volunteer Already Taken: Status is IN_PROGRESS but assigned to another volunteer
              <div className="pt-0">
                <div className="text-center py-3 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-base font-medium text-gray-400">
                    Already Being Helped By Another Volunteer
                  </p>
                </div>
              </div>
            ) : null // Fallback for volunteer if status is unexpected (e.g., CLOSED)
          ) : user?.role === "VICTIM" && incident.userId !== user?.id ? (
            // Victim Viewing Others: Cannot accept, not their report
            <div className="pt-0">
              <div className="text-center py-3 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-base font-medium text-gray-400">
                  VICTIM REPORT
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
