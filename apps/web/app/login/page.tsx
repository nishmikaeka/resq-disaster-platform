// apps/web/app/login/page.tsx
"use client";

export default function LoginPage() {
  return (
    <button
      onClick={() =>
        (window.location.href = "http://localhost:3001/api/auth/google")
      }
      className="px-6 py-3 bg-red-600 text-white rounded"
    >
      Login with Google
    </button>
  );
}
