"use client";

import { Toaster } from "react-hot-toast";

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3500,
        style: {
          background: "#111827",
          color: "#f9fafb",
          border: "1px solid #374151",
        },
      }}
    />
  );
}
