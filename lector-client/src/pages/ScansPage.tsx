import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react";
import type { ScanDto } from "@/types/scan";
import { API_SCANS, API_SCAN_IMAGE, ROUTES } from "@/constants";
import { formatRelative } from "@/utils/dateFormat";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/utils/apiFetch";

export default function ScansPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [scans, setScans] = useState<ScanDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedScan, setSelectedScan] = useState<ScanDto | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [modalCopied, setModalCopied] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const loadScans = async (signal?: AbortSignal) => {
    try {
      const response = await apiFetch(`${API_SCANS}?limit=50`, { signal }, () => {
        logout();
        navigate(ROUTES.login);
      });
      if (!response.ok) {
        const text = await response.text();

        if (response.status === 404) {
          throw new Error("Scan service unavailable. Please check if the backend is running.");
        }
        if (response.status === 500) {
          throw new Error("Server error while loading scans. Please try again later.");
        }
        if (response.status === 503) {
          throw new Error("Scan service temporarily unavailable. Please try again in a moment.");
        }

        throw new Error(text || `Failed to load scans (HTTP ${response.status})`);
      }
      return await response.json();
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        throw new Error("Cannot connect to server. Please check your network connection and ensure the backend is running.");
      }
      throw err;
    }
  };

  useEffect(() => {
    const abortController = new AbortController();

    loadScans(abortController.signal)
      .then((data) => setScans(data))
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));

    return () => abortController.abort();
  }, []);

  const handleRetry = async () => {
    setError(null);
    setRetrying(true);
    const abortController = new AbortController();

    try {
      const data = await loadScans(abortController.signal);
      setScans(data);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      setRetrying(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);

    const deletedScan = scans.find(s => s.id === id);
    setScans((s) => s.filter((x) => x.id !== id));

    if (selectedScan?.id === id) {
      setSelectedScan(null);
    }

    try {
      const response = await apiFetch(`${API_SCANS}/${id}`, {
        method: "DELETE",
      }, () => {
        logout();
        navigate(ROUTES.login);
      });
      if (!response.ok) throw new Error(await response.text());
      toast.success("Scan deleted");
    } catch {
      if (deletedScan) {
        setScans((s) => [...s, deletedScan].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
      toast.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = async () => {
    if (!selectedScan?.ocrResult) return;
    try {
      await navigator.clipboard.writeText(selectedScan.ocrResult);
      setModalCopied(true);
      setTimeout(() => setModalCopied(false), 2000);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedScan(null);
    };
    if (selectedScan) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [selectedScan]);

  if (error && scans.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-background p-6 ">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h1 className="text-2xl font-bold">Scan History</h1>
          </div>
          <Alert variant="destructive" className="bg-rose-700 text-white">
            <AlertDescription className="font-bold">{error}</AlertDescription>
          </Alert>
          <Card className="border-2 border-border max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="font-bold">Unable to load scans</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-500">
                There was a problem loading your scan history
              </p>
              <Button onClick={handleRetry} className="w-full min-h-[44px]" disabled={retrying}>
                {retrying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {retrying ? "Loading..." : "Try Again"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (scans.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6 ">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h1 className="text-2xl font-bold">Scan History</h1>
          </div>
          <Card className="border-2 border-border">
            <CardHeader>
              <CardTitle className="font-bold">No scans yet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-500">
                Upload an image to get started with OCR scanning
              </p>
              <Button asChild className="w-full min-h-[44px]">
                <Link to={ROUTES.home}>Upload Image</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 ">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* error alert - inline */}
        {error && (
          <Alert variant="destructive" className="bg-rose-700 text-white">
            <AlertDescription className="font-bold">{error}</AlertDescription>
          </Alert>
        )}

        {/* header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">Scan History</h1>
          {error && (
            <Button variant="neutral" size="sm" onClick={handleRetry} disabled={retrying}>
              {retrying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {retrying ? "Loading..." : "Retry"}
            </Button>
          )}
        </div>

        {/* card grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scans.map((scan) => (
            <Card
              key={scan.id}
              onClick={() => setSelectedScan(scan)}
              className="transition-colors hover:bg-main/5 cursor-pointer border-2 border-border"
            >
              <CardHeader>
                {scan.ocrResult && (
                  <div className="aspect-4/3 w-full relative overflow-hidden rounded-base bg-secondary-background/80 border border-border mb-2">
                    <div className="p-2 flex items-center justify-center h-full w-full">
                      <img
                        src={API_SCAN_IMAGE(scan.id)}
                        alt={scan.alias}
                        loading="lazy"
                        decoding="async"
                        className="object-contain w-full h-full rounded-md shadow-sm"
                        onError={(e) => {
                          console.error(
                            "Preview load failed",
                            API_SCAN_IMAGE(scan.id),
                          );
                          e.currentTarget.style.display = "none";
                          const wrapper = e.currentTarget.parentElement;
                          if (wrapper) {
                            wrapper.textContent = "Preview unavailable";
                            wrapper.classList.add(
                              "text-xs",
                              "text-muted-foreground",
                              "text-center",
                            );
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="font-bold text-sm line-clamp-1">
                    {scan.alias}
                  </CardTitle>
                  {scan.isDuplicate && (
                    <span className="text-xs font-bold text-gray-500 shrink-0">
                      Duplicate
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="text-xs text-gray-500"
                    title={new Date(scan.createdAt).toISOString()}
                  >
                    {formatRelative(scan.createdAt)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="neutral"
                    size="sm"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!scan.ocrResult) return;
                      try {
                        await navigator.clipboard.writeText(scan.ocrResult);
                        setCopiedId(scan.id);
                        toast.success("Copied to clipboard");
                        setTimeout(() => setCopiedId(null), 2000);
                      } catch {
                        toast.error("Failed to copy");
                      }
                    }}
                    disabled={!scan.ocrResult}
                    className="flex-[2] min-h-[44px]"
                  >
                    {copiedId === scan.id ? "Copied!" : "Copy text"}
                  </Button>
                  <Button
                    variant="neutral"
                    size="sm"
                    onClick={(e) => handleDelete(scan.id, e)}
                    disabled={deletingId === scan.id}
                    className="flex-1 min-h-[44px] bg-rose-700 text-white"
                  >
                    {deletingId === scan.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* modal */}
        {selectedScan && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/80 p-4"
            onClick={() => setSelectedScan(null)}
          >
            <Card
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="font-bold">
                    {selectedScan.alias}
                  </CardTitle>
                  <Button
                    variant="neutral"
                    onClick={() => setSelectedScan(null)}
                    className="shrink-0 min-h-[30px] w-10 h-10 p-0"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* metadata */}
                <div className="flex flex-wrap items-center gap-2">
                  {selectedScan.isDuplicate && (
                    <span className="text-xs font-bold text-gray-500">
                      Previously scanned
                    </span>
                  )}
                  <span
                    className="text-xs text-gray-500"
                    title={new Date(selectedScan.createdAt).toISOString()}
                  >
                    {formatRelative(selectedScan.createdAt)}
                  </span>
                </div>

                {/* ocr result */}
                <div className="max-h-64 overflow-y-auto p-4 bg-secondary-background rounded-base border-2 border-border">
                  {selectedScan.ocrResult ? (
                    <p className="whitespace-pre-wrap font-mono text-sm">
                      {selectedScan.ocrResult}
                    </p>
                  ) : (
                    <p className="text-gray-500">No text detected</p>
                  )}
                </div>

                {/* actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={handleCopy}
                    variant="neutral"
                    disabled={!selectedScan.ocrResult}
                    className="flex-[2] min-h-[44px]"
                  >
                    {modalCopied ? "Copied!" : "Copy text"}
                  </Button>
                  <Button
                    onClick={(e) => handleDelete(selectedScan.id, e)}
                    disabled={deletingId === selectedScan.id}
                    className="flex-1 min-h-[44px] bg-rose-700 text-white"
                  >
                    {deletingId === selectedScan.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
