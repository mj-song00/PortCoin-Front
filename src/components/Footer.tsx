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
      <p>Copyright 2025. PortCoin. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
