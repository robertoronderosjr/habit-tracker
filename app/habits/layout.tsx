export const dynamic = 'force-dynamic';

import AuthShell from "@/components/AuthShell";

export default async function HabitsLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
