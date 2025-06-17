import React, { useState } from "react";
import PortfolioModal from "./PortfolioModal";

const Side: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
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

      {isModalOpen && <PortfolioModal onClose={closeModal} />}
    </aside>
  );
};

export default Side;
