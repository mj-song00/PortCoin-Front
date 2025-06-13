import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Main.css";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "../css/Header.css";

interface DecodedToken {
  exp: number;
  sub: string;
  role: string;
}

const Header: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  const navigateToLogin = () => {
    navigate("/login");
  };

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
      navigate("/");
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
        console.log("accessToken 만료, 리프레시 토큰 요청");
        await refreshAccessToken();
      } else {
        setIsLoggedIn(true);
      }
    } catch (e) {
      console.log("토큰 디코딩 실패 또는 유효하지 않음", e);
      setIsLoggedIn(false);
      localStorage.removeItem("accessToken");
    }
  };

  useEffect(() => {
    checkTokenAndRefresh();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(
        "http://localhost:8080/api/v1/users/auth/logout",
        {},
        { withCredentials: true }
      );
      localStorage.removeItem("accessToken");
      setIsLoggedIn(false);
    } catch (e) {
      console.error("로그아웃 실패", e);
    }
  };

  return (
    <header
      className="header"
      style={{
        height: "80px",
        borderBottom: "1px solid #ccc",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        backgroundColor: "#f5f5f5",
      }}
    >
      {/* <div onClick={() => navigate("/portfolio")} className="portfolio-btn">
        <div>포트폴리오</div>
      </div>

      <div onClick={() => navigate("/")} className="portfolio-btn">
        <div>최근 시세보기</div>
      </div> */}

      <div className="nav-container">
        <nav onClick={() => navigate("/portfolio")} className="portfolio-btn">
          포트폴리오
        </nav>

        <nav onClick={() => navigate("/")} className="mainbtn">
          시세 보기
        </nav>

        <button onClick={() => navigate("/mypage")} className="mypage-btn">
          <img className="account" src="/img/user.png" alt=""></img>
        </button>
      </div>

      <div className="login-container">
        {!isLoggedIn ? (
          <button type="button" className="login-btn" onClick={navigateToLogin}>
            로그인
          </button>
        ) : (
          <button type="button" className="logout-btn" onClick={handleLogout}>
            로그아웃
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
