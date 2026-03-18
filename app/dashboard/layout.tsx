export const dynamic = 'force-dynamic';

import AuthShell from "@/components/AuthShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
