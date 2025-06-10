import React from "react";

const Footer: React.FC = () => {
  return (
    <footer
      style={{
        height: "40px",
        borderTop: "1px solid #ccc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
      }}
    >
      여기가 Footer 영역입니다
    </footer>
  );
};

export default Footer;
