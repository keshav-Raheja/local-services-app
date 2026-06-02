const getBaseUrl = (): string => {
  let url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  url = url.trim();
  if (url && !url.endsWith("/api") && !url.endsWith("/api/")) {
    url = url.endsWith("/") ? `${url}api` : `${url}/api`;
  }
  return url;
};

const BASE_URL = getBaseUrl();


function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...(options.headers || {}),
      },
    });

    const contentType = res.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    if (!res.ok) {
      let errorMessage = `Server error: ${res.status} ${res.statusText}`;
      if (isJson) {
        try {
          const data = await res.json();
          errorMessage = data.message || errorMessage;
        } catch (_) {}
      } else {
        try {
          const text = await res.text();
          if (text && text.length < 200) {
            errorMessage = text;
          }
        } catch (_) {}
      }
      throw new Error(errorMessage);
    }

    if (isJson) {
      return await res.json();
    } else {
      const text = await res.text();
      return text as unknown as T;
    }
  } catch (error: any) {
    console.error(`API request error on ${url}:`, error);
    throw new Error(error.message || "Failed to connect to the server. Please check if the API is online.");
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
};

export default api;
