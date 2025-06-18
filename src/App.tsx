import "./App.css";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Portfolio from "./pages/Portfolio";
import PortfolioDetail from "./components/PortfolioDetail";
import Main from "./pages/Main";
import PrivateRoute from "./PrivateRoute"
import { useAuth } from "./hooks/useAuth";

const App: React.FC = () => {
   const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/portfolio/:portfolioId"
          element={
              <PrivateRoute isLoggedIn={isLoggedIn}>
            <PortfolioDetail />
              </PrivateRoute>
          }
        />
        <Route
          path="/portfolio"
          element={
               <PrivateRoute isLoggedIn={isLoggedIn}>
            <Portfolio />
              </PrivateRoute>
          }
        />
        <Route path="/" element={<Main />} />
      </Routes>
    </div>
  );
};

export default App;
