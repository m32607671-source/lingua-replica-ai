import { Link } from "@tanstack/react-router";
import { Moon, Sun, Globe, Menu, X, User as UserIcon, LogOut } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";

export function Header() {
  const { t, locale, setLocale, theme, toggleTheme } = useApp();
  const { user, profile, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/translate", label: t("nav.translate") },
    { to: "/games", label: "Games" },
    { to: "/leaderboard", label: "Leaderboard" },
    { to: "/clans", label: "Clans" },
    { to: "/store", label: "Store" },
    { to: "/pricing", label: t("nav.pricing") },
    { to: "/dashboard", label: t("nav.dashboard") },
    ...(isAdmin ? [{ to: "/admin", label: "Admin" } as const] : []),
  ] as const;

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass border-b border-border/40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Logo />

          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent/10 transition-colors"
                activeProps={{ className: "text-foreground bg-accent/10" }}
                activeOptions={{ exact: l.to === "/" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocale(locale === "en" ? "ar" : "en")}
              className="h-9 px-3 rounded-lg hover:bg-accent/10 flex items-center gap-1.5 text-sm font-medium transition-colors"
              aria-label="Toggle language"
            >
              <Globe className="w-4 h-4" />
              {locale === "en" ? "العربية" : "EN"}
            </button>
            <button
              onClick={toggleTheme}
              className="h-9 w-9 rounded-lg hover:bg-accent/10 grid place-items-center transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {user ? (
              <>
                <Link to="/profile" className="hidden sm:flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-accent/10">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-primary grid place-items-center text-white text-xs font-bold">
                      {(profile?.full_name || user.email || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <UserIcon className="w-4 h-4 sm:hidden" />
                </Link>
                <button
                  onClick={() => void signOut()}
                  className="hidden sm:grid h-9 w-9 rounded-lg hover:bg-accent/10 place-items-center transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm">{t("nav.login")}</Button>
                </Link>
                <Link to="/register" className="hidden sm:block">
                  <Button size="sm" className="bg-gradient-primary text-white hover:opacity-90 shadow-glow">
                    {t("nav.register")}
                  </Button>
                </Link>
              </>
            )}
            <button
              className="md:hidden h-9 w-9 grid place-items-center"
              onClick={() => setOpen((o) => !o)}
              aria-label="Menu"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="md:hidden border-t border-border/40 px-4 py-3 space-y-1 animate-fade-up">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent/10"
              >
                {l.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              {user ? (
                <>
                  <Link to="/profile" className="flex-1"><Button variant="outline" className="w-full">{t("nav.profile")}</Button></Link>
                  <Button className="flex-1 bg-gradient-primary text-white" onClick={() => void signOut()}>{t("nav.logout")}</Button>
                </>
              ) : (
                <>
                  <Link to="/login" className="flex-1"><Button variant="outline" className="w-full">{t("nav.login")}</Button></Link>
                  <Link to="/register" className="flex-1"><Button className="w-full bg-gradient-primary text-white">{t("nav.register")}</Button></Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}