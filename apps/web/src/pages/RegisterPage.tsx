
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth";

export default function RegisterPage() {
  const { customer, loading, register } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!loading && customer) {
    return <Navigate to="/account" replace />;
  }

async function handleSubmit(
  event: React.FormEvent<HTMLFormElement>,
) {
  event.preventDefault();

  if (submitting) return;

  setSubmitting(true);
  setError("");

  try {
    await register(name, email, password, phone);
    navigate("/account");
  } catch (err: unknown) {
    console.error("Registration failed:", err);

    setError(
      err instanceof Error
        ? err.message
        : "Unable to create your account. Please try again.",
    );
  } finally {
    setSubmitting(false);
  }
}

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-bold">Create your account</h1>
      <p className="mt-2 text-neutral-600">
        Join SHOPORA for a better shopping experience.
      </p>

      <div className="my-6 flex items-center gap-3">
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            Full name
          </label>
          <input
            id="name"
            autoComplete="name"
            required
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-4 py-3"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-4 py-3"
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-2 block text-sm font-medium">
            Phone (optional)
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            maxLength={20}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-4 py-3"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={128}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-4 py-3"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Use at least 12 characters.
          </p>
        </div>
        <button
            type="submit"
            className="create-account-btn"
            disabled={submitting || loading}
          >
            {submitting ? "Creating account..." : "Create Account"}
          </button>

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}

      </form>

      <p className="mt-6 text-sm text-neutral-600">
        Already registered?{" "}
        <Link to="/login" className="font-semibold text-orange-700">
          Sign in
        </Link>
      </p>
    </main>
  );
}
