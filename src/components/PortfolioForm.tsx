import React from "react";

interface PortfolioFormProps {
  title: string;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PortfolioForm: React.FC<PortfolioFormProps> = ({ title, onTitleChange }) => {
  return (
    <div>
      <h2>포트폴리오 생성</h2>
      <input
        type="text"
        value={title}
        onChange={onTitleChange}
        placeholder="포트폴리오 제목 입력"
        style={{ width: "100%", padding: "8px", marginBottom: "15px" }}
      />
    </div>
  );
};

export default PortfolioForm; 