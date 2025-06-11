import React, { useState } from "react";
import Button from "../components/Button";
import Input from "../components/Input";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8080/api/v1/users/auth/sign-in",
        { email, password },
        { withCredentials: true }
      );

      const accessToken = response.data;
      const tokenOnly = accessToken.replace("Bearer ", "");
      localStorage.setItem("accessToken", tokenOnly);
      navigate("/main");
    } catch (e) {
      alert(e);
    }
  };

  return (
    <div>
      <h2>로그인</h2>
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일을 입력해주세요"
      />

      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호를 입력해주세요"
        autocomplete="current-password"
      />

      <Button text="로그인" onClick={handleLogin} />
    </div>
  );
};

export default Login;
