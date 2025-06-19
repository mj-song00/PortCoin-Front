import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../css/Main.css";
import axios from "axios";
import "../css/Header.css";
import { useAuth } from "../hooks/useAuth";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, setIsLoggedIn } = useAuth();
  
  const navigateToLogin = () => {
    navigate("/login");
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        "http://localhost:8080/api/v1/users/auth/logout",
        {},
        { withCredentials: true }
      );
    } catch (e) {
        console.error("로그아웃 실패", e);
    } finally {
      // API 호출 성공/실패와 관계없이 클라이언트 상태 정리
      localStorage.removeItem("accessToken");
      setIsLoggedIn(false);
      
      // 로그아웃 시 무조건 메인 페이지로 이동
      navigate("/", { replace: true });
    }
  };

  return (
    <header className="header">
      <div className="logo-container">
        <div className="logo" onClick={() => navigate("/")}>
          PortCoin
        </div>
      </div>

      <div className="nav-container">
        <nav
          onClick={() =>
            isLoggedIn
              ? navigate("/portfolio")
              : (alert("로그인이 필요합니다"), navigate("/login"))
          }
          className="portfolio-btn"
        >
          포트폴리오
        </nav>

        <nav onClick={() => navigate("/")} className="mainbtn">
          시세 보기
        </nav>
      </div>

      <div className="login-container">
        <button onClick={() => navigate("/mypage")} className="mypage-btn">
          <img className="account" src="/img/user.png" alt="프로필" />
        </button>
        
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
