import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "en" | "ar";
export type Theme = "light" | "dark";

const translations = {
  en: {
    "nav.home": "Home",
    "nav.translate": "Translate",
    "nav.pricing": "Pricing",
    "nav.dashboard": "Dashboard",
    "nav.login": "Sign in",
    "nav.register": "Get started",
    "nav.profile": "Profile",
    "nav.logout": "Sign out",

    "hero.badge": "Powered by next-gen AI",
    "hero.title1": "Translate anything,",
    "hero.title2": "into anything.",
    "hero.subtitle": "Lingua AI is the world's most advanced translation platform. 100+ languages, native-level fluency, real-time speed.",
    "hero.cta": "Start translating free",
    "hero.cta2": "See pricing",

    "features.title": "Built for serious translation",
    "features.subtitle": "Everything Google Translate wishes it had.",
    "features.1.title": "Neural Accuracy",
    "features.1.desc": "Context-aware translations that preserve tone, idioms, and intent across 100+ languages.",
    "features.2.title": "Real-time Speed",
    "features.2.desc": "Translate documents, websites, and conversations in milliseconds — not seconds.",
    "features.3.title": "Document Aware",
    "features.3.desc": "Upload PDFs, DOCX, and slides. We preserve formatting, fonts, and layouts.",
    "features.4.title": "Glossaries & Memory",
    "features.4.desc": "Train Lingua on your brand voice with custom glossaries and translation memory.",
    "features.5.title": "Enterprise Security",
    "features.5.desc": "SOC 2, GDPR, zero-retention modes. Your data stays yours.",
    "features.6.title": "RTL Native",
    "features.6.desc": "First-class Arabic, Hebrew & Persian support — perfect bidirectional rendering.",

    "stats.languages": "Languages",
    "stats.accuracy": "Accuracy",
    "stats.users": "Users worldwide",
    "stats.translations": "Translations / day",

    "translate.title": "Translate instantly",
    "translate.from": "From",
    "translate.to": "To",
    "translate.placeholder": "Type or paste text to translate…",
    "translate.button": "Translate",
    "translate.swap": "Swap languages",
    "translate.copy": "Copy",
    "translate.copied": "Copied!",
    "translate.empty": "Translation will appear here",
    "translate.detect": "Detect language",

    "pricing.title": "Pricing built for everyone",
    "pricing.subtitle": "Start free. Scale when you're ready.",
    "pricing.monthly": "Monthly",
    "pricing.yearly": "Yearly",
    "pricing.save": "Save 20%",
    "pricing.free.name": "Free",
    "pricing.free.desc": "For casual users",
    "pricing.pro.name": "Pro",
    "pricing.pro.desc": "For professionals",
    "pricing.business.name": "Business",
    "pricing.business.desc": "For teams & enterprises",
    "pricing.cta": "Get started",
    "pricing.cta.contact": "Contact sales",
    "pricing.popular": "Most popular",

    "auth.login.title": "Welcome back",
    "auth.login.subtitle": "Sign in to continue translating",
    "auth.register.title": "Create your account",
    "auth.register.subtitle": "Start translating in seconds",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.name": "Full name",
    "auth.signin": "Sign in",
    "auth.signup": "Create account",
    "auth.or": "or continue with",
    "auth.noAccount": "Don't have an account?",
    "auth.haveAccount": "Already have an account?",
    "auth.forgot": "Forgot password?",

    "dash.welcome": "Welcome back",
    "dash.stats.translations": "Translations",
    "dash.stats.words": "Words translated",
    "dash.stats.languages": "Languages used",
    "dash.stats.saved": "Saved phrases",
    "dash.recent": "Recent translations",
    "dash.usage": "Monthly usage",
    "dash.upgrade": "Upgrade plan",

    "profile.title": "Your profile",
    "profile.subtitle": "Manage your account & preferences",
    "profile.account": "Account",
    "profile.preferences": "Preferences",
    "profile.billing": "Billing",
    "profile.save": "Save changes",
    "profile.theme": "Theme",
    "profile.language": "Interface language",

    "footer.tagline": "The future of translation.",
    "footer.product": "Product",
    "footer.company": "Company",
    "footer.legal": "Legal",
    "footer.rights": "All rights reserved.",
  },
  ar: {
    "nav.home": "الرئيسية",
    "nav.translate": "ترجم",
    "nav.pricing": "الأسعار",
    "nav.dashboard": "لوحة التحكم",
    "nav.login": "تسجيل الدخول",
    "nav.register": "ابدأ الآن",
    "nav.profile": "الملف الشخصي",
    "nav.logout": "تسجيل الخروج",

    "hero.badge": "مدعوم بالذكاء الاصطناعي من الجيل الجديد",
    "hero.title1": "ترجم أي شيء،",
    "hero.title2": "إلى أي لغة.",
    "hero.subtitle": "لينغوا AI هي أكثر منصة ترجمة تطورًا في العالم. أكثر من 100 لغة، طلاقة بمستوى الناطقين الأصليين، سرعة فورية.",
    "hero.cta": "ابدأ الترجمة مجانًا",
    "hero.cta2": "عرض الأسعار",

    "features.title": "مصممة للترجمة الاحترافية",
    "features.subtitle": "كل ما تتمناه Google Translate أن يكون لديه.",
    "features.1.title": "دقة عصبية",
    "features.1.desc": "ترجمات واعية للسياق تحافظ على النبرة والتعابير والمعنى عبر أكثر من 100 لغة.",
    "features.2.title": "سرعة فورية",
    "features.2.desc": "ترجم المستندات والمواقع والمحادثات في أجزاء من الثانية.",
    "features.3.title": "وعي بالمستندات",
    "features.3.desc": "ارفع ملفات PDF و DOCX والعروض. نحافظ على التنسيق والخطوط والتخطيط.",
    "features.4.title": "المسارد والذاكرة",
    "features.4.desc": "درّب لينغوا على صوت علامتك التجارية بمسارد مخصصة وذاكرة ترجمة.",
    "features.5.title": "أمان المؤسسات",
    "features.5.desc": "SOC 2، GDPR، أوضاع عدم احتفاظ. بياناتك تبقى لك.",
    "features.6.title": "دعم RTL أصيل",
    "features.6.desc": "دعم من الدرجة الأولى للعربية والعبرية والفارسية — عرض ثنائي الاتجاه مثالي.",

    "stats.languages": "لغة",
    "stats.accuracy": "دقة",
    "stats.users": "مستخدم حول العالم",
    "stats.translations": "ترجمة / يوم",

    "translate.title": "ترجم فوريًا",
    "translate.from": "من",
    "translate.to": "إلى",
    "translate.placeholder": "اكتب أو الصق النص للترجمة…",
    "translate.button": "ترجم",
    "translate.swap": "تبديل اللغات",
    "translate.copy": "نسخ",
    "translate.copied": "تم النسخ!",
    "translate.empty": "ستظهر الترجمة هنا",
    "translate.detect": "اكتشاف اللغة",

    "pricing.title": "أسعار تناسب الجميع",
    "pricing.subtitle": "ابدأ مجانًا. ثم وسّع عند الجاهزية.",
    "pricing.monthly": "شهري",
    "pricing.yearly": "سنوي",
    "pricing.save": "وفر 20٪",
    "pricing.free.name": "مجاني",
    "pricing.free.desc": "للاستخدام العادي",
    "pricing.pro.name": "احترافي",
    "pricing.pro.desc": "للمحترفين",
    "pricing.business.name": "أعمال",
    "pricing.business.desc": "للفرق والمؤسسات",
    "pricing.cta": "ابدأ الآن",
    "pricing.cta.contact": "تواصل مع المبيعات",
    "pricing.popular": "الأكثر شيوعًا",

    "auth.login.title": "مرحبًا بعودتك",
    "auth.login.subtitle": "سجّل الدخول لمتابعة الترجمة",
    "auth.register.title": "أنشئ حسابك",
    "auth.register.subtitle": "ابدأ الترجمة في ثوانٍ",
    "auth.email": "البريد الإلكتروني",
    "auth.password": "كلمة المرور",
    "auth.name": "الاسم الكامل",
    "auth.signin": "تسجيل الدخول",
    "auth.signup": "إنشاء حساب",
    "auth.or": "أو تابع باستخدام",
    "auth.noAccount": "ليس لديك حساب؟",
    "auth.haveAccount": "لديك حساب بالفعل؟",
    "auth.forgot": "نسيت كلمة المرور؟",

    "dash.welcome": "مرحبًا بعودتك",
    "dash.stats.translations": "الترجمات",
    "dash.stats.words": "الكلمات المترجمة",
    "dash.stats.languages": "اللغات المستخدمة",
    "dash.stats.saved": "العبارات المحفوظة",
    "dash.recent": "الترجمات الأخيرة",
    "dash.usage": "الاستخدام الشهري",
    "dash.upgrade": "ترقية الخطة",

    "profile.title": "ملفك الشخصي",
    "profile.subtitle": "إدارة حسابك وتفضيلاتك",
    "profile.account": "الحساب",
    "profile.preferences": "التفضيلات",
    "profile.billing": "الفواتير",
    "profile.save": "حفظ التغييرات",
    "profile.theme": "السمة",
    "profile.language": "لغة الواجهة",

    "footer.tagline": "مستقبل الترجمة.",
    "footer.product": "المنتج",
    "footer.company": "الشركة",
    "footer.legal": "قانوني",
    "footer.rights": "جميع الحقوق محفوظة.",
  },
} as const;

type TKey = keyof typeof translations["en"];

interface AppContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  t: (key: TKey) => string;
  dir: "ltr" | "rtl";
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const savedLocale = (localStorage.getItem("locale") as Locale) || "en";
    const savedTheme =
      (localStorage.getItem("theme") as Theme) ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setLocaleState(savedLocale);
    setThemeState(savedTheme);
  }, []);

  useEffect(() => {
    const dir = locale === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    localStorage.setItem("locale", locale);
  }, [locale]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const value: AppContextValue = {
    locale,
    setLocale: setLocaleState,
    theme,
    setTheme: setThemeState,
    toggleTheme: () => setThemeState((p) => (p === "dark" ? "light" : "dark")),
    t: (key) => translations[locale][key] ?? translations.en[key] ?? key,
    dir: locale === "ar" ? "rtl" : "ltr",
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}