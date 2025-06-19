import React, { useState, useEffect } from "react";
import PortfolioModal from "./PortfolioModal";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface Portfolio {
  id: string; // UUID
  portfolioId: number; // Long 타입
  name: string;
}

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
}

const Side: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { refreshAccessToken, isLoggedIn, isLoading } = useAuth();

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // 모달이 닫힐 때 포트폴리오 목록 새로고침
    fetchPortfolios();
  };

  // 포트폴리오 삭제 함수
  const handleDeletePortfolio = async (portfolioId: number, portfolioName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 포트폴리오 클릭 이벤트 방지
    
    if (!window.confirm(`"${portfolioName}" 포트폴리오를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      
      if (!token) {
        console.error("액세스 토큰이 없습니다.");
        return;
      }

      await axios.patch(
        `http://localhost:8080/api/v1/portfolio/${portfolioId}/delete`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log("포트폴리오 삭제 성공:", portfolioId);
      alert("포트폴리오가 삭제되었습니다.");
      
      // 삭제 후 목록 새로고침
      fetchPortfolios();
      
    } catch (error: any) {
      console.error("포트폴리오 삭제 실패", error);
      
      if (error.response?.status === 401) {
        console.error("인증 실패 - 토큰 갱신 시도");
        try {
          await refreshAccessToken();
          // 갱신 성공 시 다시 삭제 시도
          handleDeletePortfolio(portfolioId, portfolioName, e);
          return;
        } catch (refreshError) {
          console.error("토큰 갱신 실패");
          alert("인증이 만료되었습니다. 다시 로그인해주세요.");
          navigate("/login");
          return;
        }
      } else {
        alert("포트폴리오 삭제에 실패했습니다.");
      }
    }
  };

  // 사용자의 포트폴리오 목록 불러오기
  const fetchPortfolios = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      
      if (!token) {
        console.error("액세스 토큰이 없습니다.");
        setLoading(false);
        return;
      }

      console.log("토큰 확인:", token); // 디버깅용

      const response = await axios.get<ApiResponse<Portfolio[]>>(
        "http://localhost:8080/api/v1/portfolio",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.data.data) {
        setPortfolios(response.data.data);
      } else {
        // data 필드가 없으면 전체 응답을 배열로 처리
        if (Array.isArray(response.data)) {
          setPortfolios(response.data);
        } else {
          setPortfolios([]);
        }
      }
    } catch (error: any) {
      console.error("포트폴리오 목록 로드 실패", error);
      console.error("에러 응답:", error.response); // 에러 응답 확인
      
      if (error.response?.status === 401) {
        console.error("인증 실패 - 토큰 갱신 시도");
        try {
          // refreshToken으로 토큰 갱신 시도
          await refreshAccessToken();
          // 갱신 성공 시 다시 API 호출
          fetchPortfolios();
          return;
        } catch (refreshError) {
          console.error("토큰 갱신 실패 - 로그인 페이지로 이동");
          navigate("/login");
          return;
        }
      } else if (error.response?.status === 404) {
        console.error("API 엔드포인트를 찾을 수 없습니다.");
        // 404 에러 시에도 임시 데이터 사용
        setPortfolios([
          { id: "1", portfolioId: 1, name: "내 첫 번째 포트폴리오" },
          { id: "2", portfolioId: 2, name: "암호화폐 투자 포트폴리오" },
          { id: "3", portfolioId: 3, name: "안정형 포트폴리오" },
        ]);
      } else {
        console.error("알 수 없는 에러:", error.response?.status);
        // 기타 에러 시에도 임시 데이터 사용
        setPortfolios([
          { id: "1", portfolioId: 1, name: "내 첫 번째 포트폴리오" },
          { id: "2", portfolioId: 2, name: "암호화폐 투자 포트폴리오" },
          { id: "3", portfolioId: 3, name: "안정형 포트폴리오" },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 로그인 상태가 확인되고 로그인된 경우에만 포트폴리오 목록 로드
    if (!isLoading && isLoggedIn) {
      fetchPortfolios();
    } else if (!isLoading && !isLoggedIn) {
      // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
      // 단, isLoading이 true일 때는 리다이렉트하지 않음 (토큰 확인 중)
      navigate("/login");
    }
    // isLoading이 true일 때는 아무것도 하지 않음 (토큰 확인 대기)
  }, [isLoggedIn, isLoading, navigate]);

  // 포트폴리오 목록 상태 모니터링
  useEffect(() => {
  }, [portfolios]);

  const handlePortfolioClick = (portfolioId: number) => {
    const url = `/portfolio/${portfolioId}`;
    navigate(url);
  };

  return (
    <aside
      style={{
        width: "200px",
        height: "100vh",
        borderRight: "1px solid #ddd",
        backgroundColor: "#fafafa",
        paddingTop: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        boxSizing: "border-box",
      }}
    >
      <button
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "8px 15px",
          border: "none",
          background: "none",
          cursor: "pointer",
          fontSize: "16px",
        }}
        onClick={openModal}
      >
        <span>➕</span>
        <span>포트폴리오 추가</span>
      </button>

      {/* 포트폴리오 목록 */}
      <div style={{ padding: "0 15px" }}>
        <h4 style={{ margin: "10px 0", fontSize: "14px", color: "#666" }}>
          내 포트폴리오
        </h4>
        {loading ? (
          <div style={{ fontSize: "12px", color: "#999" }}>로딩 중...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {portfolios.map((portfolio, index) => {
              console.log('포트폴리오 버튼 렌더링:', portfolio);
              return (
                <div
                  key={`${portfolio.id}-${index}`}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <button
                    onClick={() => {
                      console.log('포트폴리오 버튼 클릭됨:', portfolio);
                      console.log('클릭한 portfolioId:', portfolio.portfolioId);
                      handlePortfolioClick(portfolio.portfolioId);
                    }}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      border: "none",
                      background: "white",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px",
                      textAlign: "left",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                    }}
                  >
                    {portfolio.name}
                  </button>
                  
                  {/* 삭제 버튼 */}
                  <button
                    onClick={(e) => handleDeletePortfolio(portfolio.portfolioId, portfolio.name, e)}
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "12px",
                      color: "#ff6b6b",
                      padding: "2px 4px",
                      borderRadius: "3px",
                      opacity: 0,
                      transition: "opacity 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "1";
                      e.currentTarget.style.backgroundColor = "#ffe6e6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "0";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    title="포트폴리오 삭제"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
            {portfolios.length === 0 && (
              <div style={{ fontSize: "12px", color: "#999", textAlign: "center" }}>
                포트폴리오가 없습니다
              </div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && <PortfolioModal onClose={closeModal} />}
    </aside>
  );
};

export default Side;
