const getBaseUrl = (): string => {
  let url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  url = url.trim();
  if (url && !url.endsWith("/api") && !url.endsWith("/api/")) {
    url = url.endsWith("/") ? `${url}api` : `${url}/api`;
  }
  return url;
};

const BASE_URL = getBaseUrl();

export class ApiError extends Error {
  status: number;
  code?: string;
  isNetworkError: boolean;

  constructor(message: string, status = 0, code?: string, isNetworkError = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.isNetworkError = isNetworkError;
  }
}


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
      let errorCode: string | undefined;
      if (isJson) {
        try {
          const data = await res.json() as { message?: string; code?: string };
          errorMessage = data.message || errorMessage;
          errorCode = data.code;
        } catch {}
      } else {
        try {
          const text = await res.text();
          if (text && text.length < 200) {
            errorMessage = text;
          }
        } catch {}
      }
      throw new ApiError(errorMessage, res.status, errorCode);
    }

    if (isJson) {
      return await res.json();
    } else {
      const text = await res.text();
      return text as unknown as T;
    }
  } catch (error: unknown) {
    console.error(`API request error on ${url}:`, error);
    if (error instanceof ApiError) throw error;
    throw new ApiError("We could not reach SevaHub. Please check your connection and try again.", 0, "NETWORK_ERROR", true);
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body: unknown, options: RequestInit = {}) =>
    request<T>(endpoint, { ...options, method: "POST", body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: unknown, options: RequestInit = {}) =>
    request<T>(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
};

export default api;
