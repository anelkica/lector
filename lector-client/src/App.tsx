import "./globals.css";
import { Titlebar } from "@/components/Titlebar";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import UploadPage from "@/pages/UploadPage";
import ScansPage from "@/pages/ScansPage";
import { Toaster } from "sonner";

export default function App() {
  return (
    <BrowserRouter>
      <Titlebar />
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/scans" element={<ScansPage />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
