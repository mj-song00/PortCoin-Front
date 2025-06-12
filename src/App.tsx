import "./App.css";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Portfolio from "./pages/Portfolio";
import Main from "./pages/Main";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/" element={<Main />} />
      </Routes>
    </div>
  );
}

export default App;
