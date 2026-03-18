"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      className="rounded-lg border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
    >
      Logout
    </button>
  );
}
