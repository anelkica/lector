import "./globals.css";
import { Titlebar } from "@/components/Titlebar";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { RequireAuth } from "@/components/RequireAuth";
import { MainLayout } from "@/components/MainLayout";
import UploadPage from "@/pages/UploadPage";
import ScansPage from "@/pages/ScansPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import NotFoundPage from "@/pages/NotFoundPage";
import { Toaster } from "sonner";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Titlebar />
        <div className="pt-20">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<RequireAuth><UploadPage /></RequireAuth>} />
            <Route path="/scans" element={<RequireAuth><ScansPage /></RequireAuth>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}
