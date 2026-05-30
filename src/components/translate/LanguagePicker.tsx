import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Lock, Search, Star } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  LANGUAGES,
  FREE_CODES,
  isLanguageLocked,
  type Language,
  type Region,
} from "@/lib/languages";
import { useSubscription } from "@/lib/subscription";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const REGION_ORDER: Region[] = [
  "Popular",
  "European",
  "Asian",
  "Middle Eastern",
  "African",
  "Americas",
  "Other",
];

const RECENT_KEY = "lingua_recent_langs";
const FAV_KEY = "lingua_fav_langs";

function readList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function pushRecent(code: string) {
  if (typeof window === "undefined") return;
  const list = [code, ...readList(RECENT_KEY).filter((c) => c !== code)].slice(0, 6);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
}

function toggleFav(code: string): string[] {
  const cur = readList(FAV_KEY);
  const next = cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code].slice(0, 12);
  localStorage.setItem(FAV_KEY, JSON.stringify(next));
  return next;
}

interface Props {
  value: string;
  onChange: (code: string) => void;
  /** When true, shows "Auto-detect" entry. */
  withAuto?: boolean;
  detectedCode?: string | null;
  className?: string;
  ariaLabel?: string;
}

export function LanguagePicker({
  value,
  onChange,
  withAuto,
  detectedCode,
  className,
  ariaLabel = "Select language",
}: Props) {
  const { activePlan, loading, unlimitedLanguages, trackEvent } = useSubscription();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [favs, setFavs] = useState<string[]>(() => readList(FAV_KEY));
  const recents = readList(RECENT_KEY);

  const filtered = useMemo<Language[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LANGUAGES;
    return LANGUAGES.filter(
      (l) =>
        l.code.toLowerCase().includes(q) ||
        l.name.toLowerCase().includes(q) ||
        l.native.toLowerCase().includes(q),
    );
  }, [query]);

  const grouped = useMemo(() => {
    const g = new Map<Region, Language[]>();
    for (const l of filtered) {
      const arr = g.get(l.region) ?? [];
      arr.push(l);
      g.set(l.region, arr);
    }
    return g;
  }, [filtered]);

  const selected = LANGUAGES.find((l) => l.code === value);
  const triggerLabel =
    value === "auto"
      ? `🌐 Auto${detectedCode ? ` · ${LANGUAGES.find((l) => l.code === detectedCode)?.native ?? detectedCode}` : ""}`
      : selected
        ? `${selected.flag} ${selected.native}`
        : value.toUpperCase();

  const pick = (code: string) => {
    const locked = !loading && !unlimitedLanguages && isLanguageLocked(code, activePlan);
    if (locked) {
      trackEvent("language_access_failure", { language: code, source: "picker" });
      toast.error("This language requires Pro or Business.", {
        action: { label: "Upgrade", onClick: () => (window.location.href = "/pricing") },
      });
      return;
    }
    onChange(code);
    if (code !== "auto") pushRecent(code);
    setOpen(false);
    setQuery("");
  };

  const renderRow = (l: Language) => {
    const locked = !loading && !unlimitedLanguages && isLanguageLocked(l.code, activePlan);
    const isFav = favs.includes(l.code);
    return (
      <button
        key={l.code}
        onClick={() => pick(l.code)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors",
          locked ? "opacity-70 hover:bg-muted/40" : "hover:bg-accent",
          value === l.code && "bg-accent",
        )}
      >
        <span className="text-lg shrink-0">{l.flag}</span>
        <div className="min-w-0 flex-1">
          <div className="font-medium truncate flex items-center gap-1.5">
            {l.native}
            {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">{l.name}</div>
        </div>
        {locked ? (
          <Badge variant="secondary" className="text-[10px] gap-1">
            <Lock className="h-2.5 w-2.5" /> Pro
          </Badge>
        ) : value === l.code ? (
          <Check className="h-4 w-4 text-primary" />
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFavs(toggleFav(l.code));
            }}
            className="h-7 w-7 grid place-items-center rounded-md hover:bg-muted"
            aria-label={isFav ? "Unfavorite" : "Favorite"}
          >
            <Star className={cn("h-3.5 w-3.5", isFav ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
          </button>
        )}
      </button>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-label={ariaLabel}
          className={cn("w-full h-12 justify-between rounded-2xl bg-background/60 text-sm font-medium", className)}
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronsUpDown className="h-4 w-4 opacity-60 shrink-0 ms-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(95vw,22rem)] p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 100+ languages…"
              className="pl-8 h-9"
            />
          </div>
          {!loading && !unlimitedLanguages && (
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{FREE_CODES.size} free · {LANGUAGES.length - FREE_CODES.size} premium</span>
              <Link to="/pricing" className="text-primary hover:underline">Upgrade</Link>
            </div>
          )}
        </div>

        <ScrollArea className="h-80">
          <div className="p-2 space-y-3">
            {withAuto && !query && (
              <button
                onClick={() => pick("auto")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm hover:bg-accent",
                  value === "auto" && "bg-accent",
                )}
              >
                <span className="text-lg">🌐</span>
                <div className="flex-1">
                  <div className="font-medium">Auto-detect</div>
                  {detectedCode && (
                    <div className="text-[11px] text-muted-foreground">
                      Detected: {LANGUAGES.find((l) => l.code === detectedCode)?.native ?? detectedCode}
                    </div>
                  )}
                </div>
                {value === "auto" && <Check className="h-4 w-4 text-primary" />}
              </button>
            )}

            {!query && favs.length > 0 && (
              <Section title="Favorites">
                {favs.map((c) => LANGUAGES.find((l) => l.code === c)).filter(Boolean).map((l) => renderRow(l!))}
              </Section>
            )}

            {!query && recents.length > 0 && (
              <Section title="Recent">
                {recents.map((c) => LANGUAGES.find((l) => l.code === c)).filter(Boolean).map((l) => renderRow(l!))}
              </Section>
            )}

            {REGION_ORDER.map((region) => {
              const list = grouped.get(region);
              if (!list || list.length === 0) return null;
              return (
                <Section key={region} title={region}>
                  {list.map(renderRow)}
                </Section>
              );
            })}

            {filtered.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No languages match “{query}”.
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
