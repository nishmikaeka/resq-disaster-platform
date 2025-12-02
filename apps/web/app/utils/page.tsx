"use client";

import { formatDistanceToNow } from "date-fns";
import React, { useState, useEffect } from "react";

// TimeAgo.tsx (or define this component inside your main file)
export const TimeAgo = ({ createdAt }: { createdAt: string }) => {
  // State to force re-render every minute
  const [time, setTime] = useState(Date.now());

  useEffect(() => {
    // Set up an interval to tick every 60 seconds (60,000 milliseconds)
    const intervalId = setInterval(() => {
      setTime(Date.now()); // Update state, forcing a re-render
    }, 60000);

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []); // Runs only once on mount

  if (!createdAt) return null;

  try {
    const createdDate = new Date(createdAt);
    const timeAgoString = formatDistanceToNow(createdDate, { addSuffix: true });

    // Return the formatted string
    return <>{timeAgoString}</>;
  } catch (error) {
    console.error("Error formatting date:", error);
    return null;
  }
};
