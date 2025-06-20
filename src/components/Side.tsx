import React, { useState, useEffect, useRef } from "react";
import PortfolioModal from "./PortfolioModal";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const { refreshAccessToken, isLoggedIn, isLoading } = useAuth();
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const menuRef = useRef<HTMLDivElement | null>(null);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // 모달이 닫힐 때 포트폴리오 목록 새로고침
    fetchPortfolios();
  };

  //포트폴리오 제목 수정 함수 (수정: 삭제 함수 호출 제거)
  const handleUpdatePortfolio = async (portfolioId: number, newTitle: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`포트폴리오 제목을 "${newTitle}"(으)로 수정하시겠습니까?`)) {
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("액세스 토큰이 없습니다.");
        return;
      }
      await axios.patch(
        `http://localhost:8080/api/v1/portfolio/${portfolioId}`,
        { title: newTitle },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true, 
        }
      );  
      alert("포트폴리오 제목이 수정되었습니다.");
      setEditingId(null);
      setEditTitle("");
      fetchPortfolios();
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.error("인증 실패 - 토큰 갱신 시도");
        try {
          await refreshAccessToken();
          // 갱신 성공 시 다시 수정 시도
          await handleUpdatePortfolio(portfolioId, newTitle);
          return;
        } catch (refreshError) {
          console.error("토큰 갱신 실패");
          alert("인증이 만료되었습니다. 다시 로그인해주세요.");
          navigate("/login");
          return;
        }
      } else {
        alert("포트폴리오 수정에 실패했습니다.");
      }
    }
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
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true, 
        }
      );
   
      alert("포트폴리오가 삭제되었습니다.");
      // 현재 보고 있는 포트폴리오라면 리다이렉트
      const match = location.pathname.match(/\/portfolio\/(\d+)/);
      if (match && Number(match[1]) === portfolioId) {
        navigate("/portfolio");
      } else {
        // 삭제 후 목록 새로고침
        fetchPortfolios();
      }
    } catch (error: any) {
   
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
  const fetchPortfolios = async (retryCount = 0) => {
    try {
      const token = localStorage.getItem("accessToken");
      
      if (!token) {
        console.error("액세스 토큰이 없습니다.");
        setPortfolios([
          { id: "1", portfolioId: 1, name: "내 첫 번째 포트폴리오" },
          { id: "2", portfolioId: 2, name: "암호화폐 투자 포트폴리오" },
          { id: "3", portfolioId: 3, name: "안정형 포트폴리오" },
        ]);
        setLoading(false);
        return;
      }
      const response = await axios.get<ApiResponse<Portfolio[]>>(
        "http://localhost:8080/api/v1/portfolio",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.data.data && response.data.data.length > 0) {
        setPortfolios(response.data.data);
      } else {
        // data 필드가 없거나 빈 배열이면 임시 데이터 사용
        setPortfolios([
          { id: "1", portfolioId: 1, name: "내 첫 번째 포트폴리오" },
          { id: "2", portfolioId: 2, name: "암호화폐 투자 포트폴리오" },
          { id: "3", portfolioId: 3, name: "안정형 포트폴리오" },
        ]);
      }
    } catch (error: any) {
     
      if (error.response?.status === 401 && retryCount < 1) {
        console.error("인증 실패 - 토큰 갱신 시도");
        try {
          // refreshToken으로 토큰 갱신 시도
          await refreshAccessToken();
          
          // 갱신 성공 후 잠시 대기 (토큰이 localStorage에 저장될 시간)
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // 갱신된 토큰으로 다시 API 호출 (재시도 횟수 증가)
          fetchPortfolios(retryCount + 1);
          return;
        } catch (refreshError) {
          console.error("토큰 갱신 실패 - 로그인 페이지로 이동");
          navigate("/login");
          return;
        }
      } else if (error.response?.status === 401 && retryCount >= 1) {
  
        // 토큰 갱신 후에도 401 오류가 발생하면 임시 데이터 표시
        setPortfolios([
          { id: "1", portfolioId: 1, name: "내 첫 번째 포트폴리오" },
          { id: "2", portfolioId: 2, name: "암호화폐 투자 포트폴리오" },
          { id: "3", portfolioId: 3, name: "안정형 포트폴리오" },
        ]);
        return;
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

  // 바깥 클릭 시 메뉴 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }
    if (openMenuId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

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
            {portfolios.map((portfolio, index) => (
              <div
                key={`${portfolio.id}-${index}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  marginBottom: "4px",
                  position: "relative",
                }}
              >
                {editingId === portfolio.portfolioId ? (
                  <>
                    <input
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      style={{ flex: 1, padding: "6px 8px", fontSize: "13px", borderRadius: "6px", border: "1px solid #ccc" }}
                    />
                    <button
                      onClick={() => handleUpdatePortfolio(portfolio.portfolioId, editTitle)}
                      style={{ marginLeft: "2px", color: "#007bff", background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}
                    >저장</button>
                    <button
                      onClick={() => { setEditingId(null); setEditTitle(""); }}
                      style={{ marginLeft: "2px", color: "#888", background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}
                    >취소</button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handlePortfolioClick(portfolio.portfolioId)}
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
                    >
                      {portfolio.name}
                    </button>
                    {/* ... (더보기) 버튼 */}
                    <button
                      onClick={() =>
                        setOpenMenuId(openMenuId === portfolio.portfolioId ? null : portfolio.portfolioId)
                      }
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "18px",
                        color: "#888",
                        padding: "2px 6px",
                        borderRadius: "3px",
                      }}
                      title="더보기"
                    >
                      ...
                    </button>
                    {/* 드롭다운 메뉴 */}
                    {openMenuId === portfolio.portfolioId && (
                      <div
                        ref={menuRef}
                        style={{
                          position: "absolute",
                          right: 0,
                          top: "100%",
                          background: "#fff",
                          border: "1px solid #ddd",
                          borderRadius: "6px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          zIndex: 10,
                          minWidth: "80px",
                          padding: "4px 0",
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                        }}
                      >
                        <button
                          onClick={() => {
                            setEditingId(portfolio.portfolioId);
                            setEditTitle(portfolio.name);
                            setOpenMenuId(null);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "14px",
                            color: "#007bff",
                            padding: "6px 12px",
                            textAlign: "left",
                          }}
                        >
                          ✏️ 수정
                        </button>
                        <button
                          onClick={(e) => {
                            handleDeletePortfolio(portfolio.portfolioId, portfolio.name, e);
                            setOpenMenuId(null);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "14px",
                            color: "#ff6b6b",
                            padding: "6px 12px",
                            textAlign: "left",
                          }}
                        >
                          🗑️ 삭제
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
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
