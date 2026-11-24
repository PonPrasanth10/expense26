"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  PlusCircle,
  BarChart2,
  Settings,
} from "lucide-react";

const tabs = [
  { href: "/dashboard", label: "Home",      Icon: Home       },
  { href: "/add",       label: "Add",       Icon: PlusCircle },
  { href: "/analytics", label: "Analytics", Icon: BarChart2  },
  { href: "/settings",  label: "Settings",  Icon: Settings   },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="bottom-nav lg:hidden"
      aria-label="Main navigation"
      role="navigation"
    >
      {tabs.map(({ href, label, Icon }) => {
        const isActive =
          href === "/dashboard"
            ? pathname === "/dashboard" || pathname === "/"
            : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full
                       transition-colors duration-150"
            style={{
              color: isActive ? "var(--color-primary)" : "var(--text-muted)",
            }}
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.5 : 1.75}
              aria-hidden="true"
            />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
