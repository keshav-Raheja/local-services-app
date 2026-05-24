"use client";

import { useState, useEffect } from "react";
import { auth } from "../lib/auth";

export function useAuth() {
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => {
      setRole(auth.getRole());
      setUserId(auth.getUserId());
      setIsLoggedIn(auth.isLoggedIn());
    };
    update();
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);

  return {
    role,
    userId,
    isLoggedIn,
    mounted,
    isUser: role === "user",
    isProvider: role === "provider",
    isAdmin: role === "admin",
  };
}
