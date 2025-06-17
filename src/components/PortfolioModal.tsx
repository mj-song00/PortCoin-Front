import React, { useState } from "react";
import axios, { AxiosError } from "axios";

interface CoinItem {
  id: number;
  name: string;
  quantity: string;
  purchasePrice: string;
}
interface ErrorResponse {
  statusCode: number;
  message: string;
  data?: any;
}
interface PortfolioModalProps {
  onClose: () => void;
}

const PortfolioModal: React.FC<PortfolioModalProps> = ({ onClose }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [portfolioId, setPortfolioId] = useState<number | null>(null); // 실제 저장 시 사용 가능
  const [coins, setCoins] = useState<CoinItem[]>([]);

  const handleChange = (id: number, field: keyof CoinItem, value: string) => {
    setCoins((prev) =>
      prev.map((coin) => (coin.id === id ? { ...coin, [field]: value } : coin))
    );
  };

  const handleAddCoin = () => {
    const newCoin: CoinItem = {
      id: Date.now(),
      name: "",
      quantity: "",
      purchasePrice: "",
    };
    setCoins((prev) => [...prev, newCoin]);
  };

  const handleDeleteCoin = (id: number) => {
    setCoins((prev) => prev.filter((coin) => coin.id !== id));
  };

  const handleSaveTitle = async () => {
    if (!name.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    const accessToken = localStorage.getItem("accessToken"); // 토큰 가져오기

    try {
      const response = await axios.post(
        "http://localhost:8080/api/v1/portfolio",
        { name },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        }
      );

      const saveId = response.data.portfolioId;
      console.log(saveId);
      setStep(2); // 다음 단계로 이동
    } catch (error) {
      const e = error as AxiosError<ErrorResponse>;

      if (e.response?.data) {
        const { message } = e.response.data;

        alert(message);
      } else {
        alert("로그인 실패: 서버 오류가 발생했습니다.");
      }
    }
  };

  const handleSaveCoins = () => {
    console.log("Saving Portfolio:", {
      name,
      portfolioId,
      coins,
    });

    // TODO: coins를 백엔드에 전송하는 로직 추가
    onClose();
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

      {step === 1 && (
        <>
          <h2>포트폴리오 제목 입력</h2>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 내 암호화폐 포트폴리오"
            style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
          />
          <button onClick={handleSaveTitle}>다음</button>
        </>
      )}

      {step === 2 && (
        <>
          <h2>코인 포트폴리오 입력</h2>
          <p>
            <strong>{name}</strong> 포트폴리오에 코인을 추가하세요.
          </p>
          <table>
            <thead>
              <tr>
                <th>Coin</th>
                <th>Quantity</th>
                <th>Purchase Price</th>
                <th>Edit</th>
              </tr>
            </thead>
            <tbody>
              {coins.map((coin) => (
                <tr key={coin.id}>
                  <td>
                    <input
                      type="text"
                      value={coin.name}
                      onChange={(e) =>
                        handleChange(coin.id, "name", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={coin.quantity}
                      onChange={(e) =>
                        handleChange(coin.id, "quantity", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={coin.purchasePrice}
                      onChange={(e) =>
                        handleChange(coin.id, "purchasePrice", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <button>✏️</button>
                    <button onClick={() => handleDeleteCoin(coin.id)}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleAddCoin}>+ Add Coin</button>
          <button onClick={handleSaveCoins}>저장</button>
        </>
      )}
    </div>
  );
};

export default PortfolioModal;
