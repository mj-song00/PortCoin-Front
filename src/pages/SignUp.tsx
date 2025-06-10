import React, { useState } from "react";
import Input from "../components/Input";
import Button from "../components/Button";

const SignUp: React.FC = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nickname: "",
  });

  const handleChange =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm({ ...form, [key]: e.target.value });
    };

  const SignUp = () => {
    const { email, password, confirmPassword, nickname } = form;
    console.log("Email:", `${email}`);
    console.log("Password:", `${password}`);
    console.log("ConfirmPassword:", `${confirmPassword}`);
    console.log("Nickname:", `${nickname}`);
    console.log("회원가입 시도");

    /**
     *   API 연결 영역
     */
  };

  const inputFields = [
    { type: "email", key: "email", placeholder: "이메일을 입력해주세요" },
    {
      type: "password",
      key: "password",
      placeholder: "비밀번호를 입력해주세요",
    },
    {
      type: "password",
      key: "confirmPassword",
      placeholder: "비밀번호를 다시 입력해주세요",
    },
    { type: "text", key: "nickname", placeholder: "닉네임을 입력해주세요" },
  ] as const;

  return (
    <div>
      <h2>회원가입</h2>
      {inputFields.map(({ type, key, placeholder }) => (
        <Input
          key={key}
          type={type}
          value={form[key]}
          onChange={handleChange(key)}
          placeholder={placeholder}
        />
      ))}
      <Button text="회원가입" onClick={SignUp} />
    </div>
  );
};

export default SignUp;
