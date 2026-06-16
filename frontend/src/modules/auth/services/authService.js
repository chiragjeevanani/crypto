// Backend is running on port 5002 as per .env
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5002/api";

const request = async (path, options = {}) => {
  let response;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  try {
    const headers = {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      ...(options.headers || {})
    };

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    response = await fetch(`${API_BASE}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body,
      cache: "no-store",
      signal: options.signal
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
    const error = new Error(data?.message || "Request failed");
    error.status = response.status;
    error.response = { status: response.status, data };
    throw error;
  }
  return data;
};

export const authService = {
  register: ({ name, email, password, phone, countryCode, state, language, referralCode, agreedToTerms }) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        password,
        state: state || "",
        language: language || "English",
        ...(phone && { phone }),
        countryCode: countryCode || "IN",
        referralCode,
        agreedToTerms
      })
    }),

  loginUser: ({ email, password }) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),

  loginOrLinkPrivy: (token) =>
    request("/auth/privy", {
      method: "POST",
      body: JSON.stringify({ token })
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
    }),

  uploadAvatar: (token, file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return request("/auth/profile/avatar", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
  },

  getCountries: () => request("/location/countries"),
  getStates: (countryCode) => request(`/location/states/${countryCode}`),

  // Admin Location Management
  saveCountry: (token, data) => 
    request("/location/admin/country", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    }),
  
  deleteCountry: (token, code) => 
    request(`/location/admin/country/${code}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    }),

  addState: (token, data) => 
    request("/location/admin/state", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    }),

  deleteState: (token, id) => 
    request(`/location/admin/state/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
};
