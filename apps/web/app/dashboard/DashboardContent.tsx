"use client";

import { useSearchParams } from "next/navigation";

export default function DashboardContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "nearby";

  return <div>Current tab: {tab}</div>;
}
