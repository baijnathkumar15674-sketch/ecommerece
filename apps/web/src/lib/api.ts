
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export type ApiHealth = {
  success: boolean;
  status: string;
  service: string;
  timestamp: string;
};

export function checkApiHealth(): Promise<ApiHealth> {
  return apiGet<ApiHealth>("/health");
}
