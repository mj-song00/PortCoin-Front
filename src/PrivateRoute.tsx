import React, { JSX, ReactNode } from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({
  children,
  isLoggedIn,
}: {
  children: JSX.Element;
  isLoggedIn: boolean;
}) => {
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
