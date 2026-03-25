import "./globals.css";
import { Titlebar } from "@/components/Titlebar";
import UploadPage from "@/pages/UploadPage";
import { Toaster } from "sonner";

export default function App() {
  return (
    <>
      <Titlebar />
      <UploadPage />
      <Toaster />
    </>
  );
}
