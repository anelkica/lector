// from Lector.API backend
export interface ScanDto {
  id: string;
  alias: string;
  ocrResult: string | null;
  status: number;
  createdAt: string;
  isDuplicate: boolean;
}
