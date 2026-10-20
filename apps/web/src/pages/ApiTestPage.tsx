
import { useState } from "react";
import { checkApiHealth, type ApiHealth } from "../lib/api";

export default function ApiTestPage() {
  const [data, setData] = useState<ApiHealth | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function testConnection() {
    setLoading(true);
    setError("");
    setData(null);

    try {
      const result = await checkApiHealth();
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the API.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-extrabold">API Connection Test</h1>
      <p className="mt-3 text-neutral-600">
        Verify that the SHOPORA frontend can communicate with NestJS.
      </p>

      <button
        type="button"
        onClick={testConnection}
        disabled={loading}
        className="mt-6 rounded-lg bg-neutral-950 px-6 py-3 font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
      >
        {loading ? "Testing connection..." : "Test API connection"}
      </button>

      {data && (
        <section className="mt-8 rounded-xl border border-green-200 bg-green-50 p-5">
          <h2 className="font-bold text-green-800">
            API connection successful
          </h2>
          <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-sm text-green-950">
            {JSON.stringify(data, null, 2)}
          </pre>
        </section>
      )}

      {error && (
        <section role="alert" className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5">
          <h2 className="font-bold text-red-800">Connection failed</h2>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <p className="mt-2 text-sm text-red-700">
            Check that the backend is running and that CORS allows the frontend origin.
          </p>
        </section>
      )}
    </main>
  );
}
