"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, formToObject } from "@/lib/client-api";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(formToObject(event.currentTarget))
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="form-grid">
        <div className="field full">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" defaultValue="you@firstpack.co.zw" required />
        </div>
        <div className="field full">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" defaultValue=" " required />
        </div>
      </div>
      {error ? <div className="error">{error}</div> : null}
      <div className="button-row">
        <button className="button" disabled={loading} type="submit">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </div>
    </form>
  );
}
