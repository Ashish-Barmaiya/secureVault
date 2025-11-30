// utils/authFetch.js

// A wrapper around fetch that:
// 1. Always includes cookies (credentials)
// 2. Automatically refreshes the access token on 401 and retries once

export async function authFetch(url, options = {}) {
  // Always include cookies
  const opts = { ...options, credentials: "include" };

  // First attempt
  let res = await fetch(url, opts);

  // If access token expired, try refresh flow
  if (res.status === 401) {
    console.warn("[authFetch] Access token expired. Attempting refresh...");

    // Try refreshing
    const refreshRes = await fetch("/api/auth/refresh-token", {
      method: "POST",
      credentials: "include",
    });

    if (refreshRes.ok) {
      console.log("[authFetch] Token refreshed. Retrying original request...");
      // Retry the original request once
      res = await fetch(url, opts);
    } else {
      console.error(
        "[authFetch] Refresh token invalid. User must log in again."
      );
    }
  }

  return res;
}
