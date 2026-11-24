export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Background decoration */}
      <div
        className="fixed inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10"
          style={{ background: "var(--color-primary)", filter: "blur(60px)" }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-10"
          style={{ background: "#7C3AED", filter: "blur(60px)" }}
        />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex w-14 h-14 rounded-2xl items-center justify-center text-white text-2xl font-bold mb-4 animate-float"
            style={{ background: "var(--color-primary)" }}
          >
            S
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Smart budget tracker for students
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
