import React, { useState } from "react";
import Button from "../components/Button";
import Input from "../components/Input";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const Login = () => {
    console.log("로그인 시도!");
    console.log("Email:", email);
    console.log("Password:", password);
    /**
     *  api 연결 영역
     */
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
      />

      <Button text="로그인" onClick={Login} />
    </div>
  );
};

export default Login;
