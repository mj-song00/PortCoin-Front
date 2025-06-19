// hooks/useAuth.ts
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  exp: number;
  [key: string]: any;
}

interface AuthContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  refreshAccessToken: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // isLoggedIn 상태 변경 로그
  useEffect(() => {
    console.log("🔐 AuthProvider - isLoggedIn 상태 변경:", isLoggedIn);
  }, [isLoggedIn]);

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
  };

  // 토큰 자동 갱신 기능
  useEffect(() => {
    const checkTokenExpiry = () => {
      const token = localStorage.getItem("accessToken");
      if (token && isLoggedIn) {
        try {
          const decoded = jwtDecode<DecodedToken>(token);
          const now = Date.now() / 1000;
          const timeUntilExpiry = decoded.exp - now;
          
          console.log("⏰ 토큰 만료까지 남은 시간:", Math.floor(timeUntilExpiry / 60), "분");
          
          // 만료 5분 전에 갱신 (300초 = 5분)
          if (timeUntilExpiry < 300 && timeUntilExpiry > 0) {
            console.log("🔄 토큰 만료 5분 전 - 자동 갱신 시작");
            refreshAccessToken();
          }
        } catch (e) {
          console.log("❌ 토큰 디코딩 실패 (자동 갱신 체크)");
        }
      }
    };

    // 1분마다 토큰 만료 시간 확인 (60000ms = 1분)
    const interval = setInterval(checkTokenExpiry, 60000);
    
    // 컴포넌트 언마운트 시 인터벌 정리
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  useEffect(() => {
    checkTokenAndRefresh();
    // eslint-disable-next-line
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, refreshAccessToken, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
