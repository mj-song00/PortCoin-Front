// hooks/useAuth.ts
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  exp: number;
  [key: string]: any;
}

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAccessToken = useCallback(async () => {
    try {
      const res = await axios.post(
        "http://localhost:8080/api/v1/users/auth/refresh-token",
        {},
        { withCredentials: true }
      );
      localStorage.setItem("accessToken", res.data);
      setIsLoggedIn(true);
      return true;
    } catch (err) {
      console.error("토큰 갱신 실패:", err);
      setIsLoggedIn(false);
      localStorage.removeItem("accessToken");
      return false;
    }
  }, []);

  const checkTokenAndRefresh = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setIsLoggedIn(false);
      setIsLoading(false);
      return;
    }
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const now = Date.now() / 1000;
      if (decoded.exp < now) {
        await refreshAccessToken();
      } else {
        setIsLoggedIn(true);
      }
    } catch (e) {
      setIsLoggedIn(false);
      localStorage.removeItem("accessToken");
    }
    setIsLoading(false);
  }, [refreshAccessToken]);

  useEffect(() => {
    checkTokenAndRefresh();
  }, [checkTokenAndRefresh]);

  return { isLoggedIn, setIsLoggedIn, refreshAccessToken, isLoading };
};
