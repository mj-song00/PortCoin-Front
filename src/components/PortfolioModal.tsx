import React, { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";

interface Coin {
  id: number;
  symbol: string;
}

// 포트폴리오에 담길 코인 객체
interface PortfolioCoinItem {
  uniqueId: number; // 클라이언트에서 관리하는 유니크 id (map key 등)
  coinId: number | null; // 서버 코인 id (선택 안 하면 빈 문자열)
  amount: string;
  purchasePrice: string;
}

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
}

interface PortfolioModalProps {
  onClose: () => void;
}

const PortfolioModal: React.FC<PortfolioModalProps> = ({ onClose }) => {
  const [coinList, setCoinList] = useState<Coin[]>([]);
  const [portfolio, setPortfolio] = useState<{
    title: string;
    coins: PortfolioCoinItem[];
  }>({
    title: "",
    coins: [],
  });

  // 1. 서버에서 코인 리스트 받아오기
  useEffect(() => {
    async function fetchCoinList() {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get<ApiResponse<Coin[]>>(
          "http://localhost:8080/api/v1/coin/list",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("coinlist: ", response.data.data);
        setCoinList(response.data.data!);
      } catch (error) {
        console.error("코인 리스트 로드 실패", error);
        alert("코인 리스트를 불러오지 못했습니다.");
      }
    }
    fetchCoinList();
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPortfolio((prev) => ({ ...prev, title: e.target.value }));
  };

  // 2. 포트폴리오 내 코인 정보 변경
  const handleChangeCoin = (
    uniqueId: number,
    field: keyof PortfolioCoinItem,
    value: string | number
  ) => {
    setPortfolio((prev) => ({
      ...prev,
      coins: prev.coins.map((coin) =>
        coin.uniqueId === uniqueId ? { ...coin, [field]: value } : coin
      ),
    }));
  };

  // 3. 코인 추가
  const handleAddCoin = () => {
    const newCoin: PortfolioCoinItem = {
      uniqueId: Date.now(),
      coinId: null,
      amount: "",
      purchasePrice: "",
    };
    setPortfolio((prev) => ({
      ...prev,
      coins: [...prev.coins, newCoin],
    }));
  };

  // 4. 코인 삭제
  const handleDeleteCoin = (uniqueId: number) => {
    setPortfolio((prev) => ({
      ...prev,
      coins: prev.coins.filter((coin) => coin.uniqueId !== uniqueId),
    }));
  };

  // 5. 포트폴리오 저장 (coinId가 비었거나 amount/purchasePrice 비었으면 alert 처리 추가해도 좋음)
  const handleSavePortfolio = async () => {
    if (!portfolio.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (portfolio.coins.length === 0) {
      alert("최소 하나의 코인을 추가해주세요.");
      return;
    }

    // coinId가 없는 코인이 있는지 검사
    for (const coin of portfolio.coins) {
      if (!coin.coinId) {
        alert("코인을 모두 선택해주세요.");
        return;
      }
      if (!coin.amount.trim() || !coin.purchasePrice.trim()) {
        alert("수량과 매수가를 모두 입력해주세요.");
        return;
      }
    }

    const accessToken = localStorage.getItem("accessToken");

    try {
      // 서버에 보내는 데이터 형태 맞춤
      const requestBody = {
        title: portfolio.title,
        coins: portfolio.coins.map(({ coinId, amount, purchasePrice }) => ({
          coinId,
          amount,
          purchasePrice,
        })),
      };

      await axios.post("http://localhost:8080/api/v1/portfolio", requestBody, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true,
      });
      alert("포트폴리오가 저장되었습니다!");
      onClose();
    } catch (error) {
      const e = error as AxiosError<ApiResponse<Coin[]>>;
      if (e.response?.data) {
        alert(e.response.data.message);
      } else {
        alert("서버 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "20%",
        left: "30%",
        width: "40%",
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        padding: "20px",
        zIndex: 999,
      }}
    >
      <button
        style={{
          float: "right",
          fontSize: "20px",
          border: "none",
          background: "none",
          cursor: "pointer",
        }}
        onClick={onClose}
      >
        ❌
      </button>

      <h2>포트폴리오 생성</h2>

      <input
        type="text"
        value={portfolio.title}
        onChange={handleTitleChange}
        placeholder="포트폴리오 제목 입력"
        style={{ width: "100%", padding: "8px", marginBottom: "15px" }}
      />

      <h3>코인 추가</h3>
      <table style={{ width: "100%", marginBottom: "10px" }}>
        <thead>
          <tr>
            <th>코인명</th>
            <th>수량</th>
            <th>매수가</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {portfolio.coins.map((coin) => (
            <tr key={coin.uniqueId}>
              <td>
                <select
                  value={coin.coinId ?? ""}
                  onChange={(e) =>
                    handleChangeCoin(
                      coin.uniqueId,
                      "coinId",
                      Number(e.target.value)
                    )
                  }
                >
                  <option value="">선택하세요</option>
                  {coinList.map((coin) => (
                    <option key={coin.id} value={coin.id}>
                      {coin.symbol}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="text"
                  value={coin.amount}
                  onChange={(e) =>
                    handleChangeCoin(coin.uniqueId, "amount", e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  type="text"
                  value={coin.purchasePrice}
                  onChange={(e) =>
                    handleChangeCoin(
                      coin.uniqueId,
                      "purchasePrice",
                      e.target.value
                    )
                  }
                />
              </td>
              <td>
                <button onClick={() => handleDeleteCoin(coin.uniqueId)}>
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={handleAddCoin}>+ 코인 추가</button>

      <div style={{ marginTop: "20px" }}>
        <button onClick={handleSavePortfolio}>저장하기</button>
      </div>
    </div>
  );
};

export default PortfolioModal;
