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
  
  // 로딩 중일 때는 로딩 화면 표시
  if (isLoading) {
  
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
    return children;
  } else {
    return <Navigate to="/" replace />;
  }
};

export default PrivateRoute; 