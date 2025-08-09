import "./App.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import HomePage from "./pages/HomePage";
import BoardLocal from "./pages/BoardLocal";
import BoardSupabase from "./pages/BoardSupabase";
import BoardDetail from "./pages/BoardDetail";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./layout/Layout";
import AuthForm from "./components/AuthForm";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<AuthForm />} />
        <Route element={<Layout />}>
          <Route path="/homepage" element={<HomePage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/supabase" element={<BoardSupabase />} />
            <Route path="/supabase/board/:id" element={<BoardDetail />} />
          </Route>
          <Route path="/local" element={<BoardLocal />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
