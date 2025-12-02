import IncidentCard from "./IncidentCard";
import type { Incident } from "../../types/types/incident";
import type { User } from "./page";

// Props structure for the IncidentList
interface IncidentListProps {
  openIncidents: Incident[];
  isLoading: boolean;
  activeTab: "emergencies" | "responses";
  user: User;
  radius: number;
  handleRadiusChange: (newRadius: number) => void;
}

export default function IncidentList({
  openIncidents,
  isLoading,
  activeTab,
  user,
  handleRadiusChange,
}: IncidentListProps) {
  return (
    // The main container for the bottom sheet
    <div className="fixed inset-x-0 bottom-0 mx-auto max-h-1/2 rounded-t-3xl p-4 md:p-6 z-40 text-white pt-3 md:pt-5 bg-black/70">
      <div className="max-w-3xl mx-auto py-3 px-0 sm:px-10">
        {/* Header and Range Selector */}
        <div className="block sm:flex justify-between space-y-2 items-start mb-5 sm:mb-2 mt- sm:mt-0">
          <div>
            <h2 className="text-lg md:text-xl text-gray-200 font-semibold text-left sm:text-center">
              {activeTab === "emergencies"
                ? "Active Emergencies Nearby"
                : user.role === "VICTIM"
                  ? "My Active Reports"
                  : "My Active Responses"}
            </h2>
          </div>
          <div
            className={`text-right flex items-center ${activeTab === "emergencies" ? "block" : "hidden"}`}
          >
            <label
              htmlFor="range"
              className="text-gray-400 font-semibold text-sm mr-2"
            >
              Range:
            </label>
            <select
              className="text-gray-400  font-semibold cursor-pointer bg-transparent border border-gray-600 rounded-lg p-1 text-xs sm:text-sm"
              id="range"
              name="range_selection"
              onChange={(e) => {
                const value = Number(e.target.value);
                if (!isNaN(value)) {
                  handleRadiusChange(value);
                }
              }}
              defaultValue={10000} // Set default value in the select element
            >
              <option value="10000">10Km</option>
              <option value="20000">20Km</option>
              <option value="30000">30Km</option>
              <option value="40000">40Km</option>
              <option value="50000">50Km</option>
              <option value="300000">All of Sri Lanka</option>
            </select>
          </div>
        </div>

        {/* Content Area: Loading, Empty State, or Incident Cards */}
        {isLoading ? (
          <p className="text-center text-gray-400 py-10">Loading...</p>
        ) : openIncidents.length === 0 ? (
          <div className="text-center py-20 scroll-smooth">
            <p className="text-md md:text-2xl font-bold text-[#127eeb]">
              {activeTab === "emergencies"
                ? "All clear! Sri Lanka is safe right now"
                : "No active responses"}
            </p>
            <p className="text-gray-400 text-sm md:text-base">
              {activeTab === "emergencies"
                ? "You're a hero on standby"
                : "Ready for the next call"}
            </p>
          </div>
        ) : (
          // Scrollable List of Incidents
          <div className="space-y-3 max-h-72 md:max-h-96 overflow-y-auto pb-16 scroll-smooth scrollbar-hide">
            {openIncidents.map((inc) => (
              <IncidentCard
                key={inc.id}
                inc={inc}
                activeTab={activeTab}
                userRole={user.role}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
