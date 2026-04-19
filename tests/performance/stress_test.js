import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  // This simulates 100 users ramping up and down
  stages: [
    { duration: "30s", target: 100 }, // Ramp up to 100 users
    { duration: "1m", target: 100 }, // Stay at 100 users for 1 minute
    { duration: "20s", target: 0 }, // Ramp down to 0
  ],
};

export default function () {
  // 1. Define a center point (e.g., Colombo)
  const baseLat = 6.9271;
  const baseLng = 79.8612;

  // 2. Add a small random offset (approx. +/- 5km)
  // Math.random() gives 0 to 1. Subtracting 0.5 gives -0.5 to 0.5.
  const lat = baseLat + (Math.random() - 0.5) * 0.1;
  const lng = baseLng + (Math.random() - 0.5) * 0.1;

  // 3. The URL is now unique for almost every request!
  const url = `http://localhost:3001/api/incidents/nearby?lat=${lat}&lng=${lng}&radius=50000`;
  // If your API requires a Token, replace 'YOUR_TOKEN_HERE'
  const params = {
    headers: {
      "Content-Type": "application/json",
      // 'Authorization': 'Bearer YOUR_TOKEN_HERE',
      Cookie:
        "resq_access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbW5vZWJ5bHUwMDAwbzBob3E2ajI0NnQ0IiwiZW1haWwiOiJudXJhbm5pc2htaWthMjJAZ21haWwuY29tIiwicm9sZSI6IlZPTFVOVEVFUiIsIm5hbWUiOiJOaXNobWlrYSBOdXJhbiIsInBob25lIjoiMDcwMzMxOTM5OSIsImltYWdlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSlI0cVVGYjQzTkh1cWhDMGFqLWk4bFBSSlAtUDZua2RON3JyUEo1SUo0bzJoanhyNEI9czk2LWMiLCJsYXQiOjYuODA5NDE2OTgwMzc4MzE2LCJsbmciOjgwLjA3MzQwOTQxNTg3MjM5LCJpc09uYm9hcmRlZCI6dHJ1ZSwiaWF0IjoxNzc2NDk4ODc3LCJleHAiOjE3NzY0OTk3Nzd9.fcqIuNtSSv6FxqcnvePc0kcxm09GAH7fIDqNwtw0Xp0; resq_refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbW5vZWJ5bHUwMDAwbzBob3E2ajI0NnQ0IiwianRpIjoiNTA3NTBhZDg5MDA4Yzg3Mjk4NTJjZjAwOWIzMmZjYzMiLCJpYXQiOjE3NzY0OTg4NzcsImV4cCI6MTc3NzEwMzY3N30.iLI2TKOOB9XFiko4xisPe32WtxxiZ4-q59o9ElCexlo",
    },
  };

  const res = http.get(url, params);

  // This tracks if the server is responding correctly
  check(res, {
    "is status 200": (r) => r.status === 200,
    "is status 429": (r) => r.status === 429, // Throttling check
  });

  sleep(1); // Each virtual user waits 1 second before requesting again
}
