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
  const [isRefreshing, setIsRefreshing] = useState(false); // 토큰 갱신 중 플래그

  // isLoggedIn 상태 변경 로그
  useEffect(() => {
  }, [isLoggedIn]);

  const refreshAccessToken = async () => {
    // 이미 갱신 중이면 기존 요청을 기다림
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    
    try {
      const res = await axios.post(
        "http://localhost:8080/api/v1/users/auth/refresh-token",
        {},
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      // 응답 데이터가 문자열인지 확인
      let token = typeof res.data === 'string' ? res.data : res.data.accessToken || res.data.token;
      
      if (!token) {
        throw new Error("토큰이 응답에 없습니다");
      }
      
      // Bearer 접두사가 포함되어 있다면 제거
      if (token.startsWith('Bearer ')) {
        token = token.substring(7); // "Bearer " (7글자) 제거
      }
      localStorage.setItem("accessToken", token);
      setIsLoggedIn(true);
    } catch (err: any) {
      
      // 로그아웃 상태로 정리
      setIsLoggedIn(false);
      localStorage.removeItem("accessToken");
    } finally {
      setIsRefreshing(false);
    }
  };

  const checkTokenAndRefresh = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("accessToken");
    
    if (!token) {
      // accessToken이 없어도 refreshToken으로 새 토큰 발급 시도
      try {
        await refreshAccessToken();
      } catch (error) {
        setIsLoggedIn(false);
      }
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
        // 토큰이 유효하면 refreshToken 호출하지 않음
      }
    } catch (e) {
      // 토큰 디코딩 실패 시에도 refreshToken으로 새 토큰 발급 시도
      try {
        await refreshAccessToken();
      } catch (error) {
        setIsLoggedIn(false);
      }
    }
    setIsLoading(false);
  };

  // 토큰 자동 갱신 기능
  useEffect(() => {
    const checkTokenExpiry = () => {
      const token = localStorage.getItem("accessToken");
      if (token && isLoggedIn && !isRefreshing) {
        try {
          const decoded = jwtDecode<DecodedToken>(token);
          const now = Date.now() / 1000;
          const timeUntilExpiry = decoded.exp - now;
          
          // 만료 5분 전에 갱신 (300초 = 5분)
          if (timeUntilExpiry < 300 && timeUntilExpiry > 0) {
            refreshAccessToken();
          }
        } catch (e) {
          // 토큰 디코딩 실패 시 무시
        }
      }
    };

    // 1분마다 토큰 만료 시간 확인 (60000ms = 1분)
    const interval = setInterval(checkTokenExpiry, 60000);
    
    // 컴포넌트 언마운트 시 인터벌 정리
    return () => clearInterval(interval);
  }, [isLoggedIn, isRefreshing]);

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
