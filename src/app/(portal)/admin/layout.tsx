import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin/cycles", label: "Goal Cycles" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/push-goal", label: "Push Shared Goal" },
  { href: "/admin/audit", label: "Audit Log" },
  { href: "/admin/reports", label: "Reports" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="flex min-h-full">
      <aside className="w-52 shrink-0 border-r bg-muted/30 px-3 py-6">
        <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Admin
        </p>
        <nav className="space-y-0.5">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 overflow-auto px-6 py-6">{children}</div>
    </div>
  );
}
