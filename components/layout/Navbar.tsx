"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const navItems = useMemo(
    () => [
      { href: "/", label: "Home" },
      { href: "/upload", label: "Upload" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/history", label: "History" },
      { href: "/patient", label: "Patient" },
    ],
    []
  );

  useEffect(() => {
    if (pathname === "/login") {
      setLoading(false);
      setIsAuthenticated(false);
      return;
    }

    let supabase;
    try {
      supabase = createClient();
    } catch {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!mounted) return;
        setIsAuthenticated(Boolean(data.user));
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setIsAuthenticated(false);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(Boolean(session?.user));
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore logout errors and still return user to login page.
    }
    router.push("/login?message=You%20have%20been%20logged%20out%20successfully.&variant=success");
  };

  if (pathname === "/login") return null;

  const linkClassName = (href: string) =>
    `rounded-full px-3 py-1.5 text-sm font-medium transition ${
      pathname === href
        ? "bg-[#0EA5E9] text-white shadow-sm shadow-[#0EA5E9]/20"
        : "text-[#475569] hover:bg-[#E0F2FE] hover:text-[#0369A1]"
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-[#0EA5E9]/20 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0EA5E9] shadow-lg shadow-[#0EA5E9]/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#64748B]">MedLens</p>
            <p className="text-base font-bold text-[#0F172A]">Clinical AI Workspace</p>
          </div>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={linkClassName(item.href)}>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <span className="text-sm text-[#94A3B8]">Checking session...</span>
          ) : isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-[#0EA5E9] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[#0EA5E9]/20 transition hover:bg-[#0369A1]"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}