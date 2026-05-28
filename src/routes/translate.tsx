import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftRight,
  Copy,
  Sparkles,
  Volume2,
  Loader2,
  Mic,
  MicOff,
  Save,
  Share2,
  Wand2,
  Languages,
  Check,
  Trash2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useApp } from "@/lib/i18n";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { translateText } from "@/lib/translate.functions";
import { LanguagePicker } from "@/components/translate/LanguagePicker";
import { isRtl, languageLabel, getLanguage } from "@/lib/languages";

const MAX_CHARS = 5000;

const langName = (code: string) => getLanguage(code)?.native ?? code.toUpperCase();


// Tiny deterministic pseudo-detection by character ranges
function detectLanguage(text: string): string {
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  if (/[\u4E00-\u9FFF]/.test(text)) return "zh";
  if (/[\u3040-\u30FF]/.test(text)) return "ja";
  if (/[\uAC00-\uD7AF]/.test(text)) return "ko";
  if (/[\u0400-\u04FF]/.test(text)) return "ru";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[áéíóúñ¿¡]/i.test(text)) return "es";
  if (/[àâçéèêëîïôûùüÿœæ]/i.test(text)) return "fr";
  if (/[äöüß]/i.test(text)) return "de";
  return "en";
}

function TranslatePage() {
  const { t } = useApp();
  const translateFn = useServerFn(translateText);
  const [from, setFrom] = useState("auto");
  const [to, setTo] = useState("ar");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [saved, setSaved] = useState(false);
  const [detected, setDetected] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sourceLang = from === "auto" ? detected ?? "en" : from;

  // Auto-detect language on input change
  useEffect(() => {
    if (from === "auto" && input.trim()) {
      setDetected(detectLanguage(input));
    } else if (!input.trim()) {
      setDetected(null);
    }
  }, [input, from]);

  // Debounced auto translate
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!input.trim()) {
      setOutput("");
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await translateFn({
          data: { text: input, from: sourceLang, to },
        });
        if (result.error) {
          toast.error(result.error);
          setOutput("");
        } else {
          setOutput(result.translation);
          setSaved(false);
        }
      } catch (err) {
        console.error(err);
        toast.error("Translation failed. Please try again.");
        setOutput("");
      } finally {
        setLoading(false);
      }
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input, to, sourceLang, translateFn]);

  const swap = () => {
    if (from === "auto") setFrom(sourceLang);
    const prevFrom = from === "auto" ? sourceLang : from;
    setFrom(to);
    setTo(prevFrom);
    setInput(output);
    setOutput("");
  };

  const copy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(t("translate.copied"));
  };

  const speak = (text: string, lang: string) => {
    if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Text-to-speech not available");
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const startVoiceInput = () => {
    const SR =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;
    if (!SR) {
      toast.error("Voice input not supported in this browser");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = sourceLang === "auto" ? "en-US" : sourceLang;
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setInput(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  const save = () => {
    if (!output) return;
    try {
      const key = "lingua_saved";
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      list.unshift({ from: sourceLang, to, input, output, at: Date.now() });
      localStorage.setItem(key, JSON.stringify(list.slice(0, 50)));
      setSaved(true);
      toast.success("Saved to your library");
    } catch {
      toast.error("Could not save");
    }
  };

  const share = async () => {
    if (!output) return;
    const shareData = {
      title: "Lingua AI translation",
      text: `${input}\n\n→ ${output}`,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.text);
        toast.success("Copied share text to clipboard");
      }
    } catch {
      /* user cancelled */
    }
  };

  const clear = () => {
    setInput("");
    setOutput("");
  };

  return (
    <SiteLayout>
      <section className="relative px-4 py-12 md:py-16 bg-mesh">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 md:mb-10 animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              AI Translator
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              <span className="text-gradient">{t("translate.title")}</span>
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-sm md:text-base">
              {t("hero.subtitle")}
            </p>
          </div>

          <div className="glass rounded-3xl p-4 md:p-6 shadow-elegant animate-fade-up">
            {/* Language bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-5">
              <div className="flex-1 relative">
                <Languages className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <select
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full h-12 ps-10 pe-4 rounded-2xl bg-background/60 border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm font-medium cursor-pointer transition-all hover:border-primary/40"
                >
                  <option value="auto">
                    {t("translate.detect")}
                    {detected ? ` · ${langName(detected)}` : ""}
                  </option>
                  {LANGS.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={swap}
                className="h-12 w-12 mx-auto rounded-2xl glass grid place-items-center hover:shadow-glow hover:rotate-180 transition-all duration-500 shrink-0 group"
                aria-label={t("translate.swap")}
              >
                <ArrowLeftRight className="w-4 h-4 group-hover:text-primary transition-colors" />
              </button>

              <div className="flex-1 relative">
                <Languages className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <select
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full h-12 ps-10 pe-4 rounded-2xl bg-background/60 border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm font-medium cursor-pointer transition-all hover:border-primary/40"
                >
                  {LANGS.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Panels */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Source panel */}
              <div className="group relative rounded-2xl bg-background/40 border border-border overflow-hidden transition-all hover:border-primary/30">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {from === "auto"
                      ? `${t("translate.detect")}${detected ? ` · ${langName(detected)}` : ""}`
                      : langName(from)}
                  </span>
                  {input && (
                    <button
                      onClick={clear}
                      className="w-7 h-7 rounded-md hover:bg-accent/20 grid place-items-center text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Clear"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <textarea
                  value={input}
                  onChange={(e) =>
                    e.target.value.length <= MAX_CHARS && setInput(e.target.value)
                  }
                  placeholder={t("translate.placeholder")}
                  dir={isRtl(sourceLang) ? "rtl" : "ltr"}
                  className="w-full h-56 md:h-72 p-5 bg-transparent resize-none focus:outline-none text-lg leading-relaxed placeholder:text-muted-foreground/60"
                />

                <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 bg-background/30">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={startVoiceInput}
                      className={`h-9 w-9 rounded-xl grid place-items-center transition-all ${
                        listening
                          ? "bg-destructive text-destructive-foreground animate-glow"
                          : "hover:bg-accent/20"
                      }`}
                      aria-label="Voice input"
                    >
                      {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => speak(input, sourceLang)}
                      disabled={!input}
                      className="h-9 w-9 rounded-xl hover:bg-accent/20 grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Listen"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => copy(input)}
                      disabled={!input}
                      className="h-9 w-9 rounded-xl hover:bg-accent/20 grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Copy source"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <span
                    className={`text-xs tabular-nums font-medium transition-colors ${
                      input.length > MAX_CHARS * 0.9
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {input.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Output panel */}
              <div className="group relative rounded-2xl bg-gradient-soft border border-border overflow-hidden transition-all hover:border-primary/30">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    {langName(to)}
                    {loading && (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        translating
                      </span>
                    )}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    <Wand2 className="w-3 h-3" /> AI
                  </span>
                </div>

                <div
                  dir={isRtl(to) ? "rtl" : "ltr"}
                  className="w-full h-56 md:h-72 p-5 overflow-auto text-lg leading-relaxed"
                >
                  {output ? (
                    <span className="animate-fade-up inline-block">{output}</span>
                  ) : loading ? (
                    <div className="space-y-2">
                      <div className="h-4 rounded bg-foreground/10 animate-pulse w-3/4" />
                      <div className="h-4 rounded bg-foreground/10 animate-pulse w-1/2" />
                      <div className="h-4 rounded bg-foreground/10 animate-pulse w-2/3" />
                    </div>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {t("translate.empty")}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 bg-background/30">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => speak(output, to)}
                      disabled={!output}
                      className="h-9 w-9 rounded-xl hover:bg-accent/20 grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Listen"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => copy(output)}
                      disabled={!output}
                      className="h-9 w-9 rounded-xl hover:bg-accent/20 grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Copy translation"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={save}
                      disabled={!output}
                      className={`h-9 w-9 rounded-xl grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
                        saved ? "bg-primary/15 text-primary" : "hover:bg-accent/20"
                      }`}
                      aria-label="Save"
                    >
                      {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={share}
                      disabled={!output}
                      className="h-9 w-9 rounded-xl hover:bg-accent/20 grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copy(output)}
                    disabled={!output}
                    className="text-xs"
                  >
                    {t("translate.copy")}
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick phrases */}
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                "Hello, how are you?",
                "Where is the nearest restaurant?",
                "Thank you very much.",
                "I would like to book a hotel.",
              ].map((p) => (
                <button
                  key={p}
                  onClick={() => setInput(p)}
                  className="text-xs px-3 py-1.5 rounded-full glass hover:shadow-glow hover:text-primary transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}