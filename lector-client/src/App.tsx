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
      <div className="pt-20">
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/scans" element={<ScansPage />} />
        </Routes>
        <Toaster />
      </div>
    </BrowserRouter>
  );
}
