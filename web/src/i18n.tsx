import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import zh from "./locales/zh.json";
import en from "./locales/en.json";
import ja from "./locales/ja.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";
import es from "./locales/es.json";
import ru from "./locales/ru.json";
import ptBr from "./locales/pt-br.json";
import pt from "./locales/pt.json";
import it from "./locales/it.json";
import tr from "./locales/tr.json";
import pl from "./locales/pl.json";
import hu from "./locales/hu.json";
import id from "./locales/id.json";
import ms from "./locales/ms.json";
import vi from "./locales/vi.json";
import th from "./locales/th.json";
import ar from "./locales/ar.json";
import uk from "./locales/uk.json";
import caVal from "./locales/ca-val.json";

export type Locale =
  | "zh" | "en" | "ja" | "fr" | "de" | "es" | "ru"
  | "pt-br" | "pt" | "it" | "tr" | "pl" | "hu"
  | "id" | "ms" | "vi" | "th" | "ar" | "uk" | "ca-val";

export const LOCALE_LABELS: Record<Locale, string> = {
  zh: "中文",
  en: "English",
  ja: "日本語",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  ru: "Русский",
  "pt-br": "Português (Brasil)",
  pt: "Português",
  it: "Italiano",
  tr: "Türkçe",
  pl: "Polski",
  hu: "Magyar",
  id: "Bahasa Indonesia",
  ms: "Bahasa Melayu",
  vi: "Tiếng Việt",
  th: "ไทย",
  ar: "العربية",
  uk: "Українська",
  "ca-val": "Català (Valencià)",
};

const locales: Record<Locale, Record<string, any>> = {
  zh, en, ja, fr, de, es, ru,
  "pt-br": ptBr, pt, it, tr, pl, hu,
  id, ms, vi, th, ar, uk, "ca-val": caVal,
};

function getNestedValue(obj: any, path: string): string {
  return path.split(".").reduce((acc, key) => acc?.[key], obj) ?? path;
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "zh",
  setLocale: () => {},
  t: (key) => key,
});

function getInitialLocale(): Locale {
  try {
    const saved = localStorage.getItem("upscayl-locale");
    if (saved && saved in locales) return saved as Locale;
  } catch {}
  // Auto-detect from browser language
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("zh")) return "zh";
  if (browserLang.startsWith("ja")) return "ja";
  if (browserLang.startsWith("fr")) return "fr";
  if (browserLang.startsWith("de")) return "de";
  if (browserLang.startsWith("es")) return "es";
  if (browserLang.startsWith("ru")) return "ru";
  if (browserLang.startsWith("pt-br") || browserLang === "pt-br") return "pt-br";
  if (browserLang.startsWith("pt")) return "pt";
  if (browserLang.startsWith("it")) return "it";
  if (browserLang.startsWith("tr")) return "tr";
  if (browserLang.startsWith("pl")) return "pl";
  if (browserLang.startsWith("hu")) return "hu";
  if (browserLang.startsWith("id")) return "id";
  if (browserLang.startsWith("ms")) return "ms";
  if (browserLang.startsWith("vi")) return "vi";
  if (browserLang.startsWith("th")) return "th";
  if (browserLang.startsWith("ar")) return "ar";
  if (browserLang.startsWith("uk")) return "uk";
  if (browserLang.startsWith("ca")) return "ca-val";
  return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("upscayl-locale", newLocale);
    } catch {}
  }, []);

  const t = useCallback(
    (key: string) => getNestedValue(locales[locale], key),
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const { t } = useContext(I18nContext);
  return t;
}

export function useLocale() {
  const { locale, setLocale } = useContext(I18nContext);
  return { locale, setLocale };
}
