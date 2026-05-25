import { Link } from "@tanstack/react-router";
import { Languages } from "lucide-react";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <div className="relative w-9 h-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow group-hover:scale-110 transition-transform">
        <Languages className="w-5 h-5 text-white" />
      </div>
      <span className="font-bold text-lg tracking-tight">
        Lingua<span className="text-gradient"> AI</span>
      </span>
    </Link>
  );
}