import Footer from "../components/Footer";
import Header from "../components/Header";
import Side from "../components/Side";

const Portfolio = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Side />
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          <h1>포트폴리오 목록</h1>
          <p>왼쪽 사이드바에서 포트폴리오를 선택하세요.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Portfolio;
