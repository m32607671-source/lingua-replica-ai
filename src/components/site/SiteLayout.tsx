import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CompanionWidget } from "@/components/companion/CompanionWidget";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-x-hidden">
      <div className="fixed inset-0 bg-mesh -z-10 pointer-events-none" />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CompanionWidget />
    </div>
  );
}