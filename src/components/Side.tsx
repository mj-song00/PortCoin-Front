import React from "react";

const Side: React.FC = () => {
  return (
    <aside
      style={{
        width: "200px", // 너비
        height: "100vh",
        borderRight: "1px solid #ddd",
        backgroundColor: "#fafafa",
        paddingTop: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "15px", // 아이템 사이 간격
        boxSizing: "border-box",
      }}
    >
      <button
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px", // 아이콘과 텍스트 사이 간격
          padding: "8px 15px",
          border: "none",
          background: "none",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        <span>➕</span>
        <span>포트폴리오 추가</span>
      </button>
    </aside>
  );
};

export default Side;
