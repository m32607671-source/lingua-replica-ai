import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, Sparkles, Check, ArrowLeftRight, Volume2, Copy,
  Brain, Mic, FileText, ScanLine, History, Users,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteLayout";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Lingua AI — AI-powered translation for 100+ languages" },
      { name: "description", content: "Translate text, documents and conversations with native-level AI fluency across 100+ languages." },
      { property: "og:title", content: "Lingua AI" },
      { property: "og:description", content: "The world's most advanced AI translation platform." },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

function Index() {
  const { t } = useApp();
  return (
    <SiteLayout>
      <Hero />
      <LiveDemo />
      <Features />
      <Stats />
      <PricingPreview />
      <FinalCta />
    </SiteLayout>
  );
}

/* ----- Hero ----- */
function Hero() {
  const { t } = useApp();
  return (
    <section className="relative pt-20 pb-24 px-4">
      <div className="container mx-auto text-center max-w-5xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium mb-6 animate-fade-up">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          {t("hero.badge")}
        </div>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] animate-fade-up">
          Translate Anything
          <br />
          <span className="text-gradient">Instantly with AI</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-up">
          Native-level fluency across <strong className="text-foreground">100+ languages</strong>. Translate text, voice, files, and images in real-time — powered by next-generation AI.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 animate-fade-up">
          <Link to="/translate">
            <Button size="lg" className="bg-gradient-primary text-white hover:opacity-90 shadow-glow h-12 px-7 text-base">
              Start Translating <ArrowRight className="w-4 h-4 ms-2 rtl:rotate-180" />
            </Button>
          </Link>
          <Link to="/register">
            <Button size="lg" variant="outline" className="h-12 px-7 text-base glass">
              Create Account
            </Button>
          </Link>
        </div>
        <div className="mt-6 flex justify-center gap-6 text-xs text-muted-foreground animate-fade-up">
          {["No credit card", "Free forever plan", "Cancel anytime"].map((x) => (
            <span key={x} className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-primary" /> {x}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----- Live Demo ----- */
const DEMO_LANGS = [
  { code: "en", name: "English" },
  { code: "ar", name: "العربية" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "zh", name: "中文" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
];
const DEMO_SAMPLES: Record<string, Record<string, string>> = {
  "en-ar": { in: "The future of translation is here.", out: "مستقبل الترجمة أصبح هنا." },
  "en-es": { in: "The future of translation is here.", out: "El futuro de la traducción ya está aquí." },
  "en-fr": { in: "The future of translation is here.", out: "L'avenir de la traduction est arrivé." },
  "en-de": { in: "The future of translation is here.", out: "Die Zukunft der Übersetzung ist da." },
  "en-ja": { in: "The future of translation is here.", out: "翻訳の未来がここにあります。" },
};

function LiveDemo() {
  const [from, setFrom] = useState("en");
  const [to, setTo] = useState("ar");
  const [input, setInput] = useState("The future of translation is here.");
  const [output, setOutput] = useState("مستقبل الترجمة أصبح هنا.");
  const [loading, setLoading] = useState(false);
  const isRtl = (c: string) => ["ar", "fa", "he", "ur"].includes(c);

  const translate = async (text = input, f = from, target = to) => {
    if (!text.trim()) { setOutput(""); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const key = `${f}-${target}`;
    setOutput(DEMO_SAMPLES[key]?.out ?? `[${target.toUpperCase()}] ${text}`);
    setLoading(false);
  };

  const swap = () => {
    setFrom(to); setTo(from);
    setInput(output); setOutput(input);
  };

  return (
    <section className="px-4 py-16">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-[10px] font-semibold uppercase tracking-wider mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live demo
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Try it right now</h2>
          <p className="mt-3 text-muted-foreground">No sign-up required.</p>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 bg-gradient-primary opacity-20 blur-3xl -z-10 rounded-full" />
          <div className="glass rounded-3xl p-5 md:p-7 shadow-elegant border-2 border-white/20">
            <div className="flex items-center gap-3 mb-5">
              <select
                value={from}
                onChange={(e) => { setFrom(e.target.value); translate(input, e.target.value, to); }}
                className="flex-1 h-10 px-3 rounded-xl bg-background/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {DEMO_LANGS.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
              <button
                onClick={swap}
                className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow hover:scale-110 transition-transform shrink-0"
                aria-label="Swap languages"
              >
                <ArrowLeftRight className="w-4 h-4 text-white" />
              </button>
              <select
                value={to}
                onChange={(e) => { setTo(e.target.value); translate(input, from, e.target.value); }}
                className="flex-1 h-10 px-3 rounded-xl bg-background/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {DEMO_LANGS.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onBlur={() => translate()}
                  dir={isRtl(from) ? "rtl" : "ltr"}
                  maxLength={500}
                  placeholder="Type text to translate…"
                  className="w-full h-44 md:h-52 p-5 rounded-2xl bg-background/40 border border-border resize-none focus:outline-none focus:ring-2 focus:ring-ring text-base md:text-lg"
                />
                <div className="absolute bottom-3 start-3 text-[11px] text-muted-foreground">{input.length}/500</div>
              </div>
              <div className="relative">
                <div
                  dir={isRtl(to) ? "rtl" : "ltr"}
                  className="w-full h-44 md:h-52 p-5 rounded-2xl bg-gradient-soft border border-border text-base md:text-lg overflow-auto"
                >
                  {loading ? (
                    <div className="flex gap-1.5 items-center h-full">
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:120ms]" />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:240ms]" />
                    </div>
                  ) : output || <span className="text-muted-foreground">Translation will appear here…</span>}
                </div>
                {output && !loading && (
                  <div className="absolute bottom-3 end-3 flex gap-1">
                    <button
                      onClick={() => { navigator.clipboard.writeText(output); toast.success("Copied!"); }}
                      className="w-8 h-8 rounded-lg hover:bg-accent/20 grid place-items-center"
                      aria-label="Copy"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button className="w-8 h-8 rounded-lg hover:bg-accent/20 grid place-items-center" aria-label="Listen">
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-between items-center">
              <span className="text-xs text-muted-foreground hidden sm:block">⚡ Powered by Lingua Neural Engine</span>
              <Button onClick={() => translate()} className="bg-gradient-primary text-white h-10 px-6 shadow-glow ms-auto">
                Translate
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----- Features ----- */
const FEATURES = [
  { icon: Brain, title: "AI Translation", desc: "Context-aware neural translations that preserve tone, idioms, and intent across 100+ languages.", color: "from-indigo-500 to-blue-500" },
  { icon: Mic, title: "Voice Translation", desc: "Speak naturally and watch your words translate in real-time. Perfect for travel and meetings.", color: "from-blue-500 to-cyan-500" },
  { icon: FileText, title: "File Translation", desc: "Drop in PDFs, DOCX, and slides. We preserve formatting, fonts, and complex layouts.", color: "from-purple-500 to-pink-500" },
  { icon: ScanLine, title: "OCR Image Translation", desc: "Snap a photo of any text — menus, signs, documents — and translate it instantly.", color: "from-violet-500 to-indigo-500" },
  { icon: History, title: "Translation History", desc: "Every translation is searchable and synced across all your devices. Never lose a phrase.", color: "from-fuchsia-500 to-purple-500" },
  { icon: Users, title: "Team Collaboration", desc: "Shared glossaries, brand voice training, and team workspaces for global organizations.", color: "from-blue-500 to-indigo-600" },
] as const;

function Features() {
  return (
    <section className="px-4 py-20">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-[10px] font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3 h-3 text-primary" /> Features
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Everything you need to communicate globally</h2>
          <p className="mt-4 text-lg text-muted-foreground">Six powerful tools built on a single AI engine.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="group glass rounded-2xl p-6 hover:shadow-glow transition-all hover:-translate-y-1 duration-300 relative overflow-hidden"
            >
              <div className={`absolute -top-12 -end-12 w-32 h-32 rounded-full bg-gradient-to-br ${color} opacity-10 group-hover:opacity-20 blur-2xl transition-opacity`} />
              <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${color} grid place-items-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="relative text-lg font-semibold mb-2">{title}</h3>
              <p className="relative text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----- Stats ----- */
function Stats() {
  const stats = [
    { v: "100+", label: "Supported Languages" },
    { v: "12M+", label: "Daily Translations" },
    { v: "850K", label: "Active Users" },
    { v: "99.4%", label: "Accuracy Rate" },
  ];
  return (
    <section className="px-4 py-16">
      <div className="container mx-auto max-w-6xl">
        <div className="relative glass rounded-3xl p-8 md:p-14 overflow-hidden border-2 border-white/20">
          <div className="absolute inset-0 bg-gradient-primary opacity-5" />
          <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-5xl md:text-6xl font-extrabold text-gradient tracking-tight">{s.v}</div>
                <div className="text-sm md:text-base text-muted-foreground mt-2 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----- Pricing Preview ----- */
function PricingPreview() {
  const plans = [
    { name: "Free", price: 0, desc: "For casual users", features: ["5,000 chars/day", "20 languages", "Web app"], popular: false },
    { name: "Pro", price: 19, desc: "For professionals", features: ["Unlimited text", "100+ languages", "Files & OCR", "API access"], popular: true },
    { name: "Business", price: 59, desc: "For teams", features: ["Everything in Pro", "Team workspace", "SSO & SOC 2", "Dedicated support"], popular: false },
  ];
  return (
    <section className="px-4 py-20">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-[10px] font-semibold uppercase tracking-wider mb-3">
            Pricing
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Simple plans, big impact</h2>
          <p className="mt-4 text-lg text-muted-foreground">Start free. Scale when you're ready.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative glass rounded-3xl p-7 transition-all hover:-translate-y-1 ${
                p.popular ? "border-2 border-primary/50 shadow-glow md:scale-105" : ""
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-primary text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-glow">
                  <Sparkles className="w-3 h-3" /> Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold">{p.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold">${p.price}</span>
                <span className="text-muted-foreground text-sm">/mo</span>
              </div>
              <Link to="/pricing" className="block mt-5">
                <Button
                  className={`w-full h-10 ${p.popular ? "bg-gradient-primary text-white shadow-glow" : ""}`}
                  variant={p.popular ? "default" : "outline"}
                >
                  Get Started
                </Button>
              </Link>
              <ul className="mt-6 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link to="/pricing" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            See full pricing details <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ----- Final CTA ----- */
function FinalCta() {
  return (
    <section className="px-4 py-20">
      <div className="container mx-auto max-w-4xl">
        <div className="relative glass rounded-3xl p-10 md:p-14 text-center overflow-hidden border-2 border-white/20">
          <div className="absolute inset-0 bg-gradient-primary opacity-10" />
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 bg-gradient-primary rounded-full opacity-30 blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Ready to <span className="text-gradient">speak the world's language?</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-md mx-auto">
              Join 850,000+ people translating smarter every day.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/register">
                <Button size="lg" className="bg-gradient-primary text-white shadow-glow h-12 px-7">
                  Start Translating <ArrowRight className="w-4 h-4 ms-2 rtl:rotate-180" />
                </Button>
              </Link>
              <Link to="/translate">
                <Button size="lg" variant="outline" className="h-12 px-7 glass">
                  Try the demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
