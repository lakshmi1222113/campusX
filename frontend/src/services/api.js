
const API_BASE_URL = "https://campusx-api-pi50.onrender.com/api";

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("campusx_token");

  const isFormData = options.body instanceof FormData;

  const headers = {
    // Do not set Content-Type for FormData.
    // The browser automatically adds the multipart boundary.
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || data.error || "Something went wrong"
    );
  }

  return data;
}
