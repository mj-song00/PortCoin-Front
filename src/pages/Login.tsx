import React, { useState } from "react";
import Button from "../components/Button";
import Input from "../components/Input";
import { useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  type ErrorResponse = {
    statusCode: number;
    message: string;
    data?: any;
  };

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
    } catch (error) {
      const e = error as AxiosError<ErrorResponse>;

      if (e.response?.data) {
        const { message } = e.response.data;

        alert(message);
      } else {
        alert("로그인 실패: 서버 오류가 발생했습니다.");
      }
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
        placeholder="비밀번호는 대,소문자 특수문자를 포함한 8자 이상입니다."
      />

      <Button text="로그인" onClick={handleLogin} />
    </div>
  );
};

export default Login;
