import "./App.css";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Portfolio from "./pages/Portfolio";
import PortfolioDetail from "./components/PortfolioDetail";
import Main from "./pages/Main";
import PrivateRoute from "./PrivateRoute";
import { useAuth, AuthProvider } from "./hooks/useAuth";
import MyPage from "./pages/MyPage";

const App: React.FC = () => {
  const { isLoggedIn, isLoading } = useAuth();

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/portfolio"
          element={
            <PrivateRoute isLoggedIn={isLoggedIn} isLoading={isLoading}>
            <Portfolio />
              </PrivateRoute>
          }
        />
        <Route
          path="/portfolio/:portfolioId"
          element={
            <PrivateRoute isLoggedIn={isLoggedIn} isLoading={isLoading}>
            <PortfolioDetail />
              </PrivateRoute>
          }
        />
        <Route path="/" element={<Main />} />
        <Route path="/mypage" element={<MyPage />} />
      </Routes>
    </div>
  );
};

const AppWithProvider: React.FC = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default AppWithProvider;
