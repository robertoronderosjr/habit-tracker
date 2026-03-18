"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Login failed");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <form onSubmit={onSubmit} className="w-full space-y-4 rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
        <h1 className="text-2xl font-semibold">Login</h1>
        <input className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <button className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white" type="submit">Sign in</button>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No account? <Link href="/register" className="text-indigo-600">Create one</Link>
        </p>
      </form>
    </main>
  );
}
