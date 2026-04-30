"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RoleName, SessionUser } from "@/lib/types";
import { SessionProvider } from "@/components/session-context";
import MainHeader from "@/components/header";
import MainFooter from "@/components/footer";

const navItems: Array<{ href: string; label: string; roles?: RoleName[]; icon: React.ReactNode }> = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    )
  },
  {
    href: "/vehicles",
    label: "Vehicles & Drivers",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    )
  },
  {
    href: "/purchases",
    label: "Fuel Purchases",
    roles: ["ADMIN", "ACCOUNTANT"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    )
  },
  {
    href: "/allocations",
    label: "Fuel Allocations",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.74 5.88a6 6 0 0 1-8.48 8.48A6 6 0 0 1 5.26 11.3L12 2.69z" />
      </svg>
    )
  },
  {
    href: "/mileage",
    label: "Mileage Logs",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    )
  },
  {
    href: "/reports",
    label: "Reports",
    roles: ["ADMIN", "ACCOUNTANT"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    )
  },
  {
    href: "/admin/users",
    label: "Users",
    roles: ["ADMIN"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  },
  {
    href: "/audit",
    label: "Audit Trail",
    roles: ["ADMIN"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    )
  }
];

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SessionProvider user={user}>
      <div className="app-shell-wrapper">
        <MainHeader user={user} />
        <div className="app-shell">
          <aside className="sidebar">
            <div className="sidebar-brand">
              <span>First Pack Marketing</span>
            </div>
            <nav className="nav" aria-label="Primary navigation">
              {navItems
                .filter((item) => !item.roles || item.roles.includes(user.role))
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link ${pathname === item.href ? "active" : ""}`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
            </nav>
          </aside>
          <main className="content">{children}</main>
        </div>
        <MainFooter />
      </div>
    </SessionProvider>
  );
}

