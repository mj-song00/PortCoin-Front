// hooks/useAuth.ts
import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  exp: number;
  [key: string]: any;
}

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const refreshAccessToken = async () => {
    try {
      const res = await axios.post(
        "http://localhost:8080/api/v1/users/auth/refresh-token",
        {},
        { withCredentials: true }
      );
      localStorage.setItem("accessToken", res.data);
      setIsLoggedIn(true);
    } catch (err) {
      setIsLoggedIn(false);
      localStorage.removeItem("accessToken");
    }
  };

  const checkTokenAndRefresh = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setIsLoggedIn(false);
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
  };

  useEffect(() => {
    checkTokenAndRefresh();
  }, []);

  return { isLoggedIn, setIsLoggedIn, refreshAccessToken };
};
