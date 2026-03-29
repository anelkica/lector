// fetch wrapper with automatic 401 handling
// sends credentials and calls onUnauthorized when session expires

export async function apiFetch(
  url: string,
  options?: RequestInit,
  onUnauthorized?: () => void,
) {
  const res = await fetch(url, { ...options, credentials: "include" });

  if (res.status === 401) {
    onUnauthorized?.();
  }

  return res;
}
