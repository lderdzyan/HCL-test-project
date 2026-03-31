export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const BASE_URL = typeof window !== "undefined" ? window.MS_API_SERVICES : "";
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    let message = "Request failed";
    try {
      const data = await res.json();
      message = data?.message ?? message;
    } catch {
      message = message;
    }
    throw new Error(message);
  }
  return res.json();
}
