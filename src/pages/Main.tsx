import { useEffect, useState } from "react";
import Header from "../components/Header";
import Ranking from "../components/Ranking";
import axios from "axios";

const Main = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/v1/coin/price")
      .then((res) => setData(res.data.data));
  }, []);
  return (
    <div>
      <Header />
      <Ranking data={data} />
    </div>
  );
};

export default Main;
