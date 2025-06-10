import React from "react";

const Header: React.FC = () => {
  return (
    <header
      style={{
        height: "80px", // 높이 지정
        borderBottom: "1px solid #ccc", // 아래 경계선
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        backgroundColor: "#f5f5f5",
      }}
    ></header>
  );
};

export default Header;
