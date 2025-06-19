import React, { JSX } from "react";
import { Navigate } from "react-router-dom";

interface PrivateRouteProps {
  children: JSX.Element;
  isLoggedIn: boolean;
  isLoading: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  isLoggedIn,
  isLoading,
}) => {
  console.log("🔒 PrivateRoute - isLoggedIn:", isLoggedIn, "isLoading:", isLoading);
  
  // 로딩 중일 때는 로딩 화면 표시
  if (isLoading) {
    console.log("⏳ PrivateRoute - 로딩 중, 로딩 화면 표시");
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '16px',
        color: '#666'
      }}>
        로딩 중...
      </div>
    );
  }
  
  if (isLoggedIn) {
    console.log("✅ PrivateRoute - 인증됨, 컴포넌트 렌더링");
    return children;
  } else {
    console.log("❌ PrivateRoute - 인증 안됨, 로그인 페이지로 리다이렉트");
    return <Navigate to="/" replace />;
  }
};

export default PrivateRoute; 