import React from "react";

interface Coin {
  id: number;
  symbol: string;
}

interface PortfolioCoinItem {
  uniqueId: number;
  coinId: number | null;
  amount: string;
  purchasePrice: string;
  purchaseDate: string;
}

interface CoinTableProps {
  coinList: Coin[];
  portfolioCoins: PortfolioCoinItem[];
  onCoinChange: (uniqueId: number, field: keyof PortfolioCoinItem, value: string | number) => void;
  onDeleteCoin: (uniqueId: number) => void;
  onAddCoin: () => void;
}

const CoinTable: React.FC<CoinTableProps> = ({
  coinList,
  portfolioCoins,
  onCoinChange,
  onDeleteCoin,
  onAddCoin,
}) => {
  return (
    <div>
      <h3>코인 추가</h3>
      <table style={{ width: "100%", marginBottom: "10px" }}>
        <thead>
          <tr>
            <th>코인명</th>
            <th>수량</th>
            <th>매수가</th>
            <th>매수일</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {portfolioCoins.map((coin) => (
            <tr key={coin.uniqueId}>
              <td>
                <select
                  value={coin.coinId ?? ""}
                  onChange={(e) =>
                    onCoinChange(
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
                    onCoinChange(coin.uniqueId, "amount", e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  type="text"
                  value={coin.purchasePrice}
                  onChange={(e) =>
                    onCoinChange(
                      coin.uniqueId,
                      "purchasePrice",
                      e.target.value
                    )
                  }
                />
              </td>
              <td>
                <input
                  type="date"
                  value={coin.purchaseDate}
                  onChange={(e) =>
                    onCoinChange(
                      coin.uniqueId,
                      "purchaseDate",
                      e.target.value
                    )
                  }
                />
              </td>
              <td>
                <button onClick={() => onDeleteCoin(coin.uniqueId)}>
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={onAddCoin}>+ 코인 추가</button>
    </div>
  );
};

export default CoinTable; 