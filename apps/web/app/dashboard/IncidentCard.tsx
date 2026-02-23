import { useRouter } from "next/navigation";
import { MapPin, Clock, UserRound, HandHelping } from "lucide-react";
import type { Incident } from "../../types/types/incident";
import { TimeAgo } from "../utils/TimeAgo";
import { useEffect, useState } from "react";
import { User } from "./page";

// Props structure for the IncidentCard
interface IncidentCardProps {
  inc: Incident;
  activeTab: "emergencies" | "responses";
  userRole: "VICTIM" | "VOLUNTEER";
}

/**
 * Renders a single, detailed incident card.
 * @param {IncidentCardProps} props - Incident data and context (activeTab, userRole).
 */
export default function IncidentCard({ inc, activeTab }: IncidentCardProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isUserReady, setIsUserReady] = useState(false);

  // fetch the api/auth/me to change the button state if the volunteer accepted incident is shown in emergensies tab
  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (!storedToken) {
      router.replace("/");
      setIsUserReady(true); // Treat as ready if unauthenticated
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
        setIsUserReady(true); // Set ready on success
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        router.replace("/");
        setIsUserReady(true); // Set ready on failure
      });
  }, [router]);

  const getButtonText = () => {
    if (user?.id === inc.userId) {
      return "View Report";
    }
    return "View Details";
  };

  // Urgency tag styling with relevent colors
  const getUrgencyClasses = (urgency: string) => {
    switch (urgency) {
      case "HIGH":
        return "bg-red-400 px-2 text-red-800 border border-red-700";
      case "MEDIUM":
        return "bg-orange-400 px-2 text-orange-800 border border-orange-700";
      default:
        return "bg-green-400 px-2 text-green-800 border border-green-800";
    }
  };

  // Status tag styling
  const getStatusClasses = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-amber-400 text-orange-800 border border-orange-600";
      case "IN_PROGRESS":
        return "bg-green-400 text-green-800 border border-green-800";

      case "RESOLVED":
        return "bg-gray-400 text-gray-800 border border-gray-700";

      default:
        return "bg-gray-400 text-gray-800 border border-gray-700";
    }
  };

  return (
    //incident card loading the details of each incident that is fetched nearby
    <div
      key={inc.id}
      className={`bg-[#131d27] backdrop-blur-xl rounded-xl p-4 md:p-6 border ${activeTab === "responses" ? "border-gray-300/10" : "border-white/20"
        }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg sm:text-xl  font-semibold">{inc.title}</h3>
          <p className="flex items-center text-gray-400 text-xs gap-1">
            <UserRound className="w-3" />
            {inc.user.name}
          </p>
          {(activeTab === "emergencies" || activeTab === "responses") && (
            <p className="text-xs text-gray-400 flex gap-1 items-center">
              <MapPin className="w-3" />
              {inc.distance
                ? `${(inc.distance / 1000).toFixed(1)} Km away`
                : "Location hidden"}
            </p>
          )}
          {inc.createdAt && (
            <p className="text-gray-400 text-xs font-normal flex items-center gap-1">
              <Clock className="w-3" />
              <TimeAgo createdAt={inc.createdAt} />
            </p>
          )}
          {(activeTab === "emergencies" || activeTab === "responses") &&
            inc.volunteer?.name && (
              <p className="text-xs text-green-400  flex gap-1 items-center">
                <HandHelping className="w-4 text-gray-400" />
                Volunteer: {inc.volunteer.name}
              </p>
            )}
        </div>
        <div className="space-y-1 flex flex-col items-end shrink-0">
          {/* Urgency Tag */}
          <div
            className={`py-1 px-2 text-[9px] rounded-2xl font-bold text-center min-w-[85px] border ${getUrgencyClasses(
              inc.urgency
            )}`}
          >
            {inc.urgency}
          </div>
          {/* Status Tag */}
          <div
            className={`px-2 py-1 text-[9px] rounded-2xl font-bold text-center min-w-[85px] border ${getStatusClasses(
              inc.status
            )}`}
          >
            {inc.status.replace("_", " ")}
          </div>
        </div>
      </div>

      <button
        onClick={() => router.push(`/incident/${inc.id}`)}
        className={`w-full mt-4 py-2 text-sm rounded-lg cursor-pointer font-semibold transition-all transform hover:scale-[1.02] bg-[#0e66be] hover:bg-blue-800 disabled:opacity-50`}
        disabled={!isUserReady} // Disable button while user data is fetching
      >
        {/* Display "Loading..." until isUserReady is true, then display the correct button text */}
        {isUserReady ? getButtonText() : "Loading..."}
      </button>
    </div>
  );
}
