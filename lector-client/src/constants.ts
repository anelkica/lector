import { ScanLine, Upload, Info } from "lucide-react";

export const API_SCANS = "/api/scans";
export const API_HEALTH = "/health";
export const API_SCAN_IMAGE = (id: string) => `/api/scans/${id}/image`;
export const FILE_MAX_BYTES = 35 * 1024 * 1024;
export const FILE_MAX_LABEL = "35MB";

export const ROUTES = {
  home: "/",
  scans: "/scans",
  about: "/about",
} as const;

export const NAV_LINKS = [
  { label: "Upload", href: ROUTES.home, icon: Upload },
  { label: "Scans", href: ROUTES.scans, icon: ScanLine },
  { label: "About", href: ROUTES.about, icon: Info },
] as const;

// scan status codes from backend (ScanStatus enum)
export const SCAN_STATUS = {
  0: { label: "Pending", tone: "gray" },
  1: { label: "Success", tone: "green" },
  2: { label: "Error", tone: "red" },
  3: { label: "Timeout", tone: "amber" },
} as const;
