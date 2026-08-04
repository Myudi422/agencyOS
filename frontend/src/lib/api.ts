const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getErrorMessage(res: Response, fallback: string): string {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return fallback;
  }
  return fallback;
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const normalizedEndpoint = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {};

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const stored = localStorage.getItem("agencyos-auth");
    if (stored) {
      const parsed = JSON.parse(stored);
      const token = parsed?.state?.idToken;
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
  } catch {}

  try {
    const res = await fetch(normalizedEndpoint, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers as Record<string, string> | undefined),
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      let message = `API Error ${res.status}`;
      if (errText) {
        try {
          const parsed = JSON.parse(errText);
          message = parsed?.detail || parsed?.message || message;
        } catch {
          message = errText;
        }
      }
      throw new Error(message || getErrorMessage(res, "Request failed"));
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return await res.json();
    }

    return (await res.text()) as unknown as T;
  } catch (err) {
    console.warn(`Fetch error for ${normalizedEndpoint}`, err);
    throw err;
  }
}
