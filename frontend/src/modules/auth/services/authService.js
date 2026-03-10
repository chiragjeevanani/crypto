// Backend defaults to port 5000; use 5000 so registration works without custom .env
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const request = async (path, options = {}) => {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options
    });
  } catch (err) {
    const msg = err?.message || "";
    if (msg === "Failed to fetch" || err?.name === "TypeError") {
      throw new Error("Cannot connect to server. Check that the backend is running and the API URL is correct.");
    }
    throw new Error(err?.message || "Network error");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new Error(response.status === 502 ? "Server unavailable. Try again later." : "Request failed");
    }
    throw new Error("Invalid response from server");
  }

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }
  return data;
};

export const authService = {
  register: ({ name, email, password, phone, countryCode }) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        password,
        ...(phone && { phone }),
        countryCode: countryCode || "IN"
      })
    }),

  loginUser: ({ email, password }) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),

  loginAdmin: ({ email, password }) =>
    request("/auth/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),

  getMe: (token) =>
    request("/auth/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` }
    }),

  refresh: (refreshToken) =>
    request("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken })
    }),

  updateProfile: (token, data) =>
    request("/auth/profile", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    })
};
