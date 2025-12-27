"use client";

import { useEffect, useRef } from "react";
import IncidentCard from "./IncidentCard";
import type { Incident } from "../../types/types/incident";
import type { User } from "./page";

interface IncidentListProps {
  openIncidents: Incident[];
  isLoading: boolean;
  activeTab: "emergencies" | "responses";
  user: User;
  radius: number;
  handleRadiusChange: (newRadius: number) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

export default function IncidentList({
  openIncidents,
  isLoading,
  activeTab,
  user,
  handleRadiusChange,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: IncidentListProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Trigger load more when the sentinel is visible and there's more data
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoadingMore &&
          !isLoading
        ) {
          onLoadMore();
        }
      },
      { threshold: 0.1 } // Trigger as soon as the sentinel starts appearing
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading, onLoadMore]);

  return (
    <div className="fixed inset-x-0 bottom-0 mx-auto max-h-1/2 rounded-t-3xl p-4 md:p-6 z-40 text-white pt-3 md:pt-5 bg-black/80 backdrop-blur-md border-t border-white/10">
      <div className="max-w-3xl mx-auto py-3 px-0 sm:px-10">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg md:text-xl text-gray-200 font-semibold">
            {activeTab === "emergencies"
              ? "Active Emergencies Nearby"
              : user.role === "VICTIM"
                ? "My Active Reports"
                : "My Active Responses"}
          </h2>

          {activeTab === "emergencies" && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="range"
                className="text-gray-400 font-semibold text-sm"
              >
                Range:
              </label>
              <select
                className="text-gray-400 font-semibold cursor-pointer bg-transparent border border-gray-600 rounded-lg p-1 text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                id="range"
                onChange={(e) => handleRadiusChange(Number(e.target.value))}
                defaultValue={10000}
              >
                <option value="10000">10Km</option>
                <option value="20000">20Km</option>
                <option value="50000">50Km</option>
                <option value="300000">All Sri Lanka</option>
              </select>
            </div>
          )}
        </div>

        {isLoading && openIncidents.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-gray-400 text-sm">Finding help...</p>
          </div>
        ) : openIncidents.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl font-bold text-blue-500">All clear!</p>
            <p className="text-gray-400 text-sm">
              No active incidents found in this range.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-72 md:max-h-96 overflow-y-auto pb-10 scrollbar-hide scroll-smooth">
            {openIncidents.map((inc) => (
              <IncidentCard
                key={inc.id}
                inc={inc}
                activeTab={activeTab}
                userRole={user.role}
              />
            ))}

            {/* The Invisible Sentinel */}
            <div
              ref={observerTarget}
              className="h-20 w-full flex items-center justify-center"
            >
              {isLoadingMore && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              )}
              {!hasMore && (
                <p className="text-gray-500 text-xs italic">
                  You've reached the end of the list
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
