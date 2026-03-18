import Link from "next/link";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import ThemeToggle from "@/components/ThemeToggle";
import { getSession } from "@/lib/session";

export default async function AuthShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session.user) redirect("/login");

  return (
    <div className="mx-auto min-h-screen w-full max-w-5xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div>
          <p className="text-xs text-zinc-500">Signed in as {session.user.email}</p>
          <nav className="mt-2 flex gap-4 text-sm">
            <Link href="/dashboard" className="hover:text-indigo-500">Dashboard</Link>
            <Link href="/habits" className="hover:text-indigo-500">Habits</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>
      {children}
    </div>
  );
}
