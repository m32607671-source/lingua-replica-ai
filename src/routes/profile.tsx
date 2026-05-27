import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useApp } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/lib/subscription";
import { Button } from "@/components/ui/button";
import {
  User, Mail, Moon, Sun, Globe, Camera, Lock, FileText, Crown, Flame,
  Zap, Coins, Trophy, Sparkles, Languages, BookOpen, Star, Lock as LockIcon,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Profile — Lingua AI" },
      { name: "description", content: "Your Lingua AI profile, XP, streaks, achievements and learning analytics." },
    ],
    links: [{ rel: "canonical", href: "/profile" }],
  }),
});

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "ar", label: "Arabic" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "ru", label: "Russian" },
  { code: "hi", label: "Hindi" },
  { code: "tr", label: "Turkish" },
];

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles, flame: Flame, languages: Languages, "book-open": BookOpen,
  star: Star, crown: Crown, trophy: Trophy,
};

type Achievement = {
  id: string; code: string; title: string; description: string;
  icon: string; xp_reward: number;
};

function xpForLevel(level: number) { return level * 200; }
function levelFromXp(xp: number) {
  let lvl = 1;
  while (xp >= xpForLevel(lvl)) { xp -= xpForLevel(lvl); lvl++; }
  return { level: lvl, xpInLevel: xp, xpNeeded: xpForLevel(lvl) };
}

function ProfilePage() {
  const { t, theme, setTheme, locale, setLocale } = useApp();
  const { user, profile, loading, refreshProfile, signOut } = useAuth();
  const { activePlan } = useSubscription();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [nativeLang, setNativeLang] = useState("en");
  const [learningLang, setLearningLang] = useState("es");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setBio(profile.bio ?? "");
      setNativeLang(profile.native_language ?? "en");
      setLearningLang(profile.learning_language ?? "es");
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data: ach } = await supabase.from("achievements").select("*").order("xp_reward");
      setAchievements((ach as Achievement[]) ?? []);
      const { data: ua } = await supabase.from("user_achievements").select("achievement_id").eq("user_id", user.id);
      setUnlocked(new Set((ua ?? []).map((r: { achievement_id: string }) => r.achievement_id)));
    })();
  }, [user]);

  const levelInfo = useMemo(() => levelFromXp(profile?.xp ?? 0), [profile?.xp]);

  if (loading || !user || !profile) {
    return <SiteLayout><div className="py-24 text-center text-muted-foreground">Loading…</div></SiteLayout>;
  }

  const initial = (profile.full_name || user.email || "?").charAt(0).toUpperCase();

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName, bio, native_language: nativeLang, learning_language: learningLang,
    }).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated");
    await refreshProfile();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { toast.error(upErr.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: updErr } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    setUploading(false);
    if (updErr) { toast.error(updErr.message); return; }
    toast.success("Avatar updated");
    await refreshProfile();
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) { toast.error("At least 6 characters"); return; }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPw(false);
    if (error) { toast.error(error.message); return; }
    setNewPassword("");
    toast.success("Password changed");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const langLabel = (code: string) => LANGUAGES.find((l) => l.code === code)?.label ?? code;
  const progressPct = Math.min(100, Math.round((levelInfo.xpInLevel / levelInfo.xpNeeded) * 100));

  // Weekly XP (mock visualization based on totals)
  const weeklyXp = Array.from({ length: 7 }, (_, i) => {
    const seed = (profile.xp + i * 13) % 100;
    return Math.max(8, seed);
  });

  return (
    <SiteLayout>
      <section className="px-4 py-10 md:py-14">
        <div className="container mx-auto max-w-5xl">
          {/* HERO */}
          <div className="relative overflow-hidden glass rounded-3xl p-6 md:p-8">
            <div className="absolute inset-0 bg-gradient-primary opacity-10 pointer-events-none" />
            <div className="relative flex flex-col md:flex-row md:items-center gap-6">
              <div className="relative shrink-0">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-24 h-24 md:w-28 md:h-28 rounded-3xl object-cover shadow-glow ring-4 ring-background" />
                ) : (
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-gradient-primary grid place-items-center text-white text-4xl font-bold shadow-glow ring-4 ring-background">
                    {initial}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -end-1 w-9 h-9 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-lg hover:scale-105 transition disabled:opacity-50"
                  aria-label="Upload avatar"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">
                    {profile.full_name || user.email}
                  </h1>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-primary text-white capitalize">{profile.plan}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-0.5 truncate">{user.email}</div>
                {profile.bio && <p className="mt-2 text-sm text-foreground/80 max-w-xl">{profile.bio}</p>}

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-background/60 border border-border">
                    <Globe className="w-3 h-3" /> Native: {langLabel(profile.native_language)}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-background/60 border border-border">
                    <BookOpen className="w-3 h-3" /> Learning: {langLabel(profile.learning_language)}
                  </span>
                </div>
              </div>

              {/* Level ring */}
              <div className="md:w-56 w-full">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold">Level {levelInfo.level}</span>
                  <span className="text-muted-foreground">{levelInfo.xpInLevel} / {levelInfo.xpNeeded} XP</span>
                </div>
                <div className="h-3 rounded-full bg-background/60 overflow-hidden border border-border">
                  <div className="h-full bg-gradient-primary transition-all" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground">
                  {levelInfo.xpNeeded - levelInfo.xpInLevel} XP to level {levelInfo.level + 1}
                </div>
              </div>
            </div>
          </div>

          {/* GAMIFICATION STATS */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <StatTile icon={Flame} label="Day streak" value={profile.streak} accent="from-orange-500 to-red-500" />
            <StatTile icon={Zap} label="Total XP" value={profile.xp} accent="from-violet-500 to-indigo-500" />
            <StatTile icon={Coins} label="Coins" value={profile.coins} accent="from-amber-400 to-yellow-500" />
            <StatTile icon={Crown} label="Level" value={levelInfo.level} accent="from-indigo-500 to-blue-500" />
          </div>

          {/* ANALYTICS */}
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <div className="glass rounded-3xl p-6 md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Weekly activity</h2>
                <span className="text-xs text-muted-foreground">Last 7 days</span>
              </div>
              <div className="flex items-end justify-between gap-2 h-32">
                {weeklyXp.map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full rounded-t-md bg-gradient-primary transition-all" style={{ height: `${v}%`, minHeight: 6 }} />
                    <span className="text-[10px] text-muted-foreground">{["M","T","W","T","F","S","S"][i]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass rounded-3xl p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Languages className="w-4 h-4 text-primary" /> Translation stats</h2>
              <div className="space-y-3 text-sm">
                <Row label="Translations" value={profile.translations_count.toLocaleString()} />
                <Row label="Words translated" value={profile.words_count.toLocaleString()} />
                <Row label="Avg per translation" value={profile.translations_count ? Math.round(profile.words_count / profile.translations_count).toString() : "0"} />
                <Row label="Plan" value={profile.plan} capitalize />
              </div>
            </div>
          </div>

          {/* ACHIEVEMENTS */}
          <div className="mt-6 glass rounded-3xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold flex items-center gap-2"><Trophy className="w-4 h-4 text-primary" /> Achievements</h2>
              <span className="text-xs text-muted-foreground">{unlocked.size} / {achievements.length} unlocked</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {achievements.map((a) => {
                const Icon = ICONS[a.icon] ?? Trophy;
                const isUnlocked = unlocked.has(a.id);
                return (
                  <div
                    key={a.id}
                    className={`rounded-2xl border p-4 transition-all ${isUnlocked
                      ? "bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 shadow-glow"
                      : "bg-background/40 border-border opacity-60"}`}
                  >
                    <div className={`w-10 h-10 rounded-xl grid place-items-center mb-2 ${isUnlocked ? "bg-gradient-primary text-white" : "bg-muted text-muted-foreground"}`}>
                      {isUnlocked ? <Icon className="w-5 h-5" /> : <LockIcon className="w-4 h-4" />}
                    </div>
                    <div className="text-sm font-semibold truncate">{a.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{a.description}</div>
                    <div className="mt-2 text-[10px] font-semibold text-primary">+{a.xp_reward} XP</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ACCOUNT */}
          <div className="mt-6 glass rounded-3xl p-6 md:p-8">
            <h2 className="font-semibold text-lg mb-5">{t("profile.account")}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label={t("auth.name")} icon={User}>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full h-11 ps-10 pe-3 rounded-xl bg-background/50 border border-border focus:outline-none focus:ring-2 focus:ring-ring" />
              </Field>
              <Field label={t("auth.email")} icon={Mail}>
                <input type="email" disabled value={user.email ?? ""} className="w-full h-11 ps-10 pe-3 rounded-xl bg-background/30 border border-border opacity-70" />
              </Field>
              <Field label="Native language" icon={Globe}>
                <select value={nativeLang} onChange={(e) => setNativeLang(e.target.value)} className="w-full h-11 ps-10 pe-3 rounded-xl bg-background/50 border border-border focus:outline-none focus:ring-2 focus:ring-ring appearance-none">
                  {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </Field>
              <Field label="Learning language" icon={BookOpen}>
                <select value={learningLang} onChange={(e) => setLearningLang(e.target.value)} className="w-full h-11 ps-10 pe-3 rounded-xl bg-background/50 border border-border focus:outline-none focus:ring-2 focus:ring-ring appearance-none">
                  {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </Field>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 280))}
                  rows={3}
                  placeholder="Tell the community a bit about yourself…"
                  className="w-full p-3 rounded-xl bg-background/50 border border-border focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <div className="text-[11px] text-muted-foreground text-end">{bio.length}/280</div>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="bg-gradient-primary text-white shadow-glow h-11 px-7">
                {saving ? "..." : t("profile.save")}
              </Button>
            </div>
          </div>

          {/* PASSWORD */}
          <div className="mt-6 glass rounded-3xl p-6 md:p-8">
            <h2 className="font-semibold text-lg mb-5">Change password</h2>
            <Field label="New password" icon={Lock}>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full h-11 ps-10 pe-3 rounded-xl bg-background/50 border border-border focus:outline-none focus:ring-2 focus:ring-ring" placeholder="At least 6 characters" />
            </Field>
            <div className="mt-5 flex justify-end">
              <Button onClick={handlePasswordChange} disabled={changingPw || !newPassword} variant="outline" className="h-11 px-7">
                {changingPw ? "..." : "Update password"}
              </Button>
            </div>
          </div>

          {/* PREFERENCES */}
          <div className="mt-6 glass rounded-3xl p-6 md:p-8">
            <h2 className="font-semibold text-lg mb-5">{t("profile.preferences")}</h2>
            <div className="flex items-center justify-between py-3 border-b border-border/40">
              <div className="flex items-center gap-3">
                {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                <span className="text-sm font-medium">{t("profile.theme")}</span>
              </div>
              <div className="flex gap-1 p-1 rounded-full glass">
                {(["light", "dark"] as const).map((th) => (
                  <button key={th} onClick={() => setTheme(th)} className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${theme === th ? "bg-gradient-primary text-white" : ""}`}>{th}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">{t("profile.language")}</span>
              </div>
              <div className="flex gap-1 p-1 rounded-full glass">
                {(["en", "ar"] as const).map((l) => (
                  <button key={l} onClick={() => setLocale(l)} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${locale === l ? "bg-gradient-primary text-white" : ""}`}>{l === "en" ? "English" : "العربية"}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button onClick={handleSignOut} variant="outline" className="h-11 px-7">{t("nav.logout")}</Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function StatTile({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | string; accent: string }) {
  return (
    <div className="relative overflow-hidden glass rounded-2xl p-4">
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-10 pointer-events-none`} />
      <div className="relative flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${accent} text-white grid place-items-center`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="relative mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

function Row({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${capitalize ? "capitalize" : ""}`}>{value}</span>
    </div>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <div className="relative">
        <Icon className="w-4 h-4 absolute top-3.5 start-3 text-muted-foreground pointer-events-none" />
        {children}
      </div>
    </div>
  );
}