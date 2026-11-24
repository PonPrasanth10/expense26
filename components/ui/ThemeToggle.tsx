"use client";

import { useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

type ThemeOption = {
  value: "light" | "dark" | "system";
  label: string;
  Icon: typeof Sun;
};

const OPTIONS: ThemeOption[] = [
  { value: "light",  label: "Light",  Icon: Sun     },
  { value: "dark",   label: "Dark",   Icon: Moon    },
  { value: "system", label: "System", Icon: Monitor },
];

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[2];
  const { Icon } = current;

  if (compact) {
    // Cycle through themes on click
    const cycle = () => {
      const idx = OPTIONS.findIndex((o) => o.value === theme);
      const next = OPTIONS[(idx + 1) % OPTIONS.length];
      setTheme(next.value);
    };
    return (
      <button
        onClick={cycle}
        aria-label={`Current theme: ${current.label}. Click to switch.`}
        className="btn-ghost p-2 rounded-[8px]"
        title={`Theme: ${current.label}`}
      >
        <Icon size={20} aria-hidden="true" />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium w-full
                   transition-all duration-150"
        style={{ color: "var(--text-muted)" }}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Change theme"
      >
        <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
        <span>Theme: {current.label}</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Dropdown */}
          <div
            role="listbox"
            aria-label="Theme options"
            className="absolute bottom-full left-0 mb-1 w-40 rounded-[12px] border py-1 z-50
                       animate-fade-slide-up"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-color)",
              boxShadow: "var(--shadow-card-hover)",
            }}
          >
            {OPTIONS.map(({ value, label, Icon: Ico }) => (
              <button
                key={value}
                role="option"
                aria-selected={theme === value}
                onClick={() => {
                  setTheme(value);
                  setOpen(false);
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm
                           transition-colors duration-150"
                style={{
                  color: theme === value ? "var(--color-primary)" : "var(--text-secondary)",
                  backgroundColor:
                    theme === value ? "var(--color-primary-light)" : "transparent",
                }}
              >
                <Ico size={16} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
