"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home,
  PlusCircle,
  BarChart2,
  Settings,
  LogOut,
  Wallet,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const navItems = [
  { href: "/dashboard",     label: "Home",       Icon: Home       },
  { href: "/add",           label: "Add Expense", Icon: PlusCircle },
  { href: "/transactions",  label: "Transactions", Icon: Wallet    },
  { href: "/analytics",     label: "Analytics",  Icon: BarChart2  },
  { href: "/settings",      label: "Settings",   Icon: Settings   },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="sidebar hidden lg:flex flex-col py-6"
      aria-label="Sidebar navigation"
    >
      {/* Logo */}
      <div className="px-6 mb-8">
        <Link href="/dashboard" className="flex items-center gap-2.5 no-underline">
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white font-bold text-lg"
            style={{ background: "var(--color-primary)" }}
          >
            S
          </div>
          <span
            className="text-lg font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            StudentSpend
          </span>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-1" role="navigation">
        {navItems.map(({ href, label, Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard" || pathname === "/"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium
                         transition-all duration-150 group"
              style={{
                color: isActive ? "var(--color-primary)" : "var(--text-secondary)",
                backgroundColor: isActive ? "var(--color-primary-light)" : "transparent",
              }}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.75}
                aria-hidden="true"
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: theme toggle + logout */}
      <div className="px-3 pt-4 border-t space-y-1" style={{ borderColor: "var(--border-color)" }}>
        <ThemeToggle />
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium w-full
                     transition-all duration-150"
          style={{ color: "var(--text-muted)" }}
        >
          <LogOut size={20} strokeWidth={1.75} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
