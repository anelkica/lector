import { FILE_MAX_BYTES, FILE_MAX_LABEL } from "@/constants";

export const validateFile = (file: File | null): string | null => {
  if (!file) return "No file selected";
  if (!file.type.startsWith("image/")) return "Only image files are supported";
  if (file.size > FILE_MAX_BYTES) return `File too large (max ${FILE_MAX_LABEL})`;
  return null;
};
