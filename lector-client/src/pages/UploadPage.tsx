import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ScanDto } from "@/types/scan";
import { API_SCANS, FILE_MAX_LABEL } from "@/constants";
import { validateFile } from "@/utils/fileValidation";

type UploadState =
  | { status: "empty" }
  | { status: "selected"; file: File; preview: string }
  | { status: "uploading"; file: File; preview: string }
  | {
      status: "success";
      result: ScanDto;
      isDuplicate: boolean;
      preview: string;
      fileName: string;
    }
  | { status: "error"; error: string; file: File; preview: string };

export default function UploadPage() {
  const [state, setState] = useState<UploadState>({ status: "empty" });
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const preview =
    state.status === "selected" ||
    state.status === "uploading" ||
    state.status === "error" ||
    state.status === "success"
      ? state.preview
      : undefined;

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const revokePreview = (p?: string) => {
    if (p) URL.revokeObjectURL(p);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast.error(error);
      if (inputRef.current) inputRef.current.value = ""; // clear to re-select
      return;
    }

    revokePreview(preview);
    setState({ status: "selected", file, preview: URL.createObjectURL(file) });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const error = validateFile(file ?? null);
    if (error) {
      toast.error(error);
      if (inputRef.current) inputRef.current.value = ""; // clear to re-select
      return;
    }
    revokePreview(preview);
    if (file)
      setState({
        status: "selected",
        file,
        preview: URL.createObjectURL(file),
      });
  };

  const handleUpload = async () => {
    if (state.status !== "selected" && state.status !== "error") return;

    const currentFile = state.file;
    const currentPreview = state.preview;

    setState({
      status: "uploading",
      file: currentFile,
      preview: currentPreview,
    });

    const formData = new FormData();
    formData.append("image", currentFile);

    try {
      const response = await fetch(API_SCANS, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();

        if (response.status === 400) {
          throw new Error(
            "Invalid file format. Please upload a valid image file (PNG, JPG, WEBP).",
          );
        }
        if (response.status === 413) {
          throw new Error(
            `File too large. Maximum file size is ${FILE_MAX_LABEL}.`,
          );
        }
        if (response.status === 404) {
          throw new Error(
            "Scan service unavailable. Please check if the backend is running.",
          );
        }
        if (response.status === 500) {
          throw new Error(
            "Server error during scan. Please try again with a different file.",
          );
        }
        if (response.status === 503) {
          throw new Error(
            "Scan service temporarily unavailable. Please try again in a moment.",
          );
        }

        throw new Error(errorText || `Upload failed (HTTP ${response.status})`);
      }

      const result: ScanDto = await response.json();
      setState({
        status: "success",
        result,
        isDuplicate: result.isDuplicate,
        preview: currentPreview,
        fileName: currentFile.name,
      });
      toast.success("Scan complete!");
    } catch (error) {
      // network errors (no internet, server down)
      let errorMessage = "Scan failed";
      if (error instanceof TypeError && error.message.includes("fetch")) {
        errorMessage =
          "Please check your network connection and ensure the server is running."; // what are the chances this is even gonna happen? just in case
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setState({
        status: "error",
        error: errorMessage,
        file: currentFile,
        preview: currentPreview,
      });
    }
  };

  const handleUploadClick = () => {
    if (state.status !== "selected" && state.status !== "error") {
      if (state.status !== "uploading") {
        toast.error("Please select an image first");
      }
      return;
    }
    handleUpload();
  };

  const handleReset = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    revokePreview(preview);
    setState({ status: "empty" });
  };

  const handleCopy = () => {
    if (state.status !== "success") return;
    navigator.clipboard.writeText(state.result.ocrResult || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background p-6 pt-23.5">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* error alert - above card */}
        {state.status === "error" && (
          <Alert variant="destructive" className="bg-rose-700 text-white">
            <AlertDescription className="font-bold">
              {state.error}
            </AlertDescription>
          </Alert>
        )}

        {/* upload card, shown in all states except success */}
        {state.status !== "success" && (
          <Card
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "transition-colors",
              isDragging && "bg-main/10 border-main",
            )}
          >
            <CardHeader>
              <CardTitle className="font-bold">Upload Image for OCR</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-2">
                <Label className="font-bold">Image</Label>
                <p className="text-xs text-gray-500">
                  PNG, JPG, WEBP supported
                </p>

                <Input
                  ref={inputRef}
                  id="upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={state.status === "uploading"}
                  className="hidden"
                />

                {/* custom trigger button bcuz native input is ass */}
                <Button
                  variant="neutral"
                  onClick={() => inputRef.current?.click()}
                  disabled={state.status === "uploading"}
                  className="w-1/3"
                >
                  Choose File
                </Button>
              </div>

              {/* preview */}
              {(state.status === "selected" ||
                state.status === "uploading" ||
                state.status === "error") && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Selected: {state.file.name}
                  </p>
                  <img
                    src={state.preview}
                    alt="Preview"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    className="max-w-xs max-h-48 object-contain rounded-base border-2 border-border"
                  />
                </div>
              )}

              {/* drag hint, shown when no file is selected */}
              {state.status === "empty" && (
                <div
                  role="button"
                  tabIndex={0}
                  className="border-2 border-dashed border-border rounded-base p-6 text-center cursor-pointer hover:bg-main/5 transition-colors"
                  onClick={() => inputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      inputRef.current?.click();
                    }
                  }}
                >
                  <p className="text-sm">or drag and drop an image here</p>
                </div>
              )}

              {/* upload */}
              <Button
                onClick={handleUploadClick}
                disabled={state.status === "uploading"}
                className="w-full"
              >
                {state.status === "uploading" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {state.status === "uploading" ? "Scanning..." : "Upload & Scan"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* result card */}
        {state.status === "success" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-bold">OCR Result</CardTitle>
                {state.isDuplicate && (
                  <span className="text-sm font-bold text-gray-500">
                    Previously scanned
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* preview thumbnail */}
              {state.preview && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    {state.fileName}
                  </p>
                  <img
                    src={state.preview}
                    alt="Scanned preview"
                    className="max-h-44 object-contain rounded-base border-2 border-border shadow-[6px_6px_0_0_var(--border)]"
                    draggable={false}
                  />
                </div>
              )}

              {/* OCR result */}
              <div className="max-h-64 overflow-y-auto p-4 bg-secondary-background rounded-base border-2 border-border">
                {state.result.ocrResult ? (
                  <p className="whitespace-pre-wrap font-mono text-sm">
                    {state.result.ocrResult}
                  </p>
                ) : (
                  <p className="text-gray-500">No text detected</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCopy}
                  variant="neutral"
                  disabled={!state.result.ocrResult}
                >
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button onClick={handleReset} className="flex-1">
                  Scan Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
