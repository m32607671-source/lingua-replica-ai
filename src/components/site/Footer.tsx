import { Link } from "@tanstack/react-router";
import { useApp } from "@/lib/i18n";
import { Logo } from "./Logo";
import { Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  const { t } = useApp();
  return (
    <footer className="border-t border-border/40 mt-20">
      <div className="container mx-auto px-4 py-12 grid gap-10 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground max-w-xs">{t("footer.tagline")}</p>
          <div className="flex gap-3 pt-2">
            {[Twitter, Github, Linkedin].map((Icon, i) => (
              <a key={i} href="#" className="w-9 h-9 rounded-lg glass grid place-items-center hover:shadow-glow transition-shadow">
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">{t("footer.product")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/translate" className="hover:text-foreground">{t("nav.translate")}</Link></li>
            <li><Link to="/pricing" className="hover:text-foreground">{t("nav.pricing")}</Link></li>
            <li><Link to="/dashboard" className="hover:text-foreground">{t("nav.dashboard")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">{t("footer.company")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-foreground">About</a></li>
            <li><a href="#" className="hover:text-foreground">Blog</a></li>
            <li><a href="#" className="hover:text-foreground">Careers</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">{t("footer.legal")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-foreground">Privacy</a></li>
            <li><a href="#" className="hover:text-foreground">Terms</a></li>
            <li><a href="#" className="hover:text-foreground">Security</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Lingua AI. {t("footer.rights")}
      </div>
    </footer>
  );
}