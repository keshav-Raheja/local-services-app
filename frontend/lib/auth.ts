export const auth = {
  getToken: (): string | null =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null,

  getUserId: (): string | null =>
    typeof window !== "undefined" ? localStorage.getItem("userId") : null,

  getRole: (): string | null =>
    typeof window !== "undefined" ? localStorage.getItem("role") : null,

  isLoggedIn: (): boolean => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("token");
  },

  isProvider: (): boolean => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("role") === "provider";
  },

  isAdmin: (): boolean => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("role") === "admin";
  },

  setSession: (token: string, role: string) => {
    const payload = JSON.parse(atob(token.split(".")[1]));
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("userId", payload.id);
    if (role === "provider") {
      localStorage.setItem("providerId", payload.id);
    }
    window.dispatchEvent(new Event("storage"));
  },

  clearSession: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("providerId");
    localStorage.removeItem("role");
    window.dispatchEvent(new Event("storage"));
  },
};

export default auth;
