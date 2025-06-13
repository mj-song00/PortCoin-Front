import React from "react";
import { RankingData } from "../types/Ranking";
interface Props {
  data: RankingData[];
}
const Ranking: React.FC<Props> = ({ data }) => {
  return (
    <div className="ranking-container">
      <h2 className="title"> 상위 10개 시장값 </h2>
      <table className="coin-table">
        <thead>
          <tr>
            <th>symbol</th>
            <th>이름</th>
            <th>image</th>
            <th>싯가</th>
            <th>24시간 가격 등락률</th>
            <th>총 계</th>
          </tr>
        </thead>
        <body>
          {data.map((coin, index) => (
            <tr key={index} className="coin-container">
              <td>
                <img src={coin.image} alt={coin.name} />
              </td>
              <td>{coin.name}</td>
              <td>{coin.symbol}</td>
              <td>{coin.current_price.toLocaleString()}₩</td>
              <td>{coin.price_change_percentage_24h.toFixed(2)}%</td>
              <td>{coin.total_volume.toLocaleString()}</td>
            </tr>
          ))}
        </body>
      </table>
    </div>
  );
};
export default Ranking;
