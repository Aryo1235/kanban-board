import "./App.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import HomePage from "./pages/HomePage";
import BoardLocal from "./pages/BoardLocal";
import BoardSupabase from "./pages/BoardSupabase";
import BoardDetail from "./pages/BoardDetail";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./layout/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import LandingPage from "./pages/LandingPage";
import LandingLayout from "./layout/LandingLayout";
import RealtimeTest from "./pages/RealtimeTest";
import Profile from "./pages/Profile";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/realtime" element={<RealtimeTest />} />
        <Route element={<LandingLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>
        <Route element={<Layout />}>
          <Route path="/homepage" element={<HomePage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/supabase" element={<BoardSupabase />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/supabase/board/:id" element={<BoardDetail />} />
          </Route>
          <Route path="/local" element={<BoardLocal />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
