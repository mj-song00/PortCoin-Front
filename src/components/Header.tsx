import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Main.css";
import axios from "axios";

const Header: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const navigate = useNavigate();
  const navigateToLogin = () => {
    navigate("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
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
      style={{
        height: "80px", // 높이 지정
        borderBottom: "1px solid #ccc", // 아래 경계선
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        backgroundColor: "#f5f5f5",
      }}
    >
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
