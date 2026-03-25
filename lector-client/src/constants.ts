import { ScanLine, Upload, Info } from "lucide-react";

export const API_SCANS = "/api/scans";
export const FILE_MAX_BYTES = 35 * 1024 * 1024;
export const FILE_MAX_LABEL = "35MB";

export const ROUTES = {
  home: "/",
  scans: "/scans",
  upload: "/upload",
  about: "/about",
} as const;

export const NAV_LINKS = [
  { label: "Scans", href: ROUTES.scans, icon: ScanLine },
  { label: "Upload", href: ROUTES.upload, icon: Upload },
  { label: "About", href: ROUTES.about, icon: Info },
] as const;
