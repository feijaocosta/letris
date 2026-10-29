import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import pt from '../locales/pt.json';
import en from '../locales/en.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';
import { KEYS, load, save } from './storage';
import { DEFAULT_LANG, LANGUAGE_CONFIGS, LANGUAGE_LIST, type Lang } from '../config/languages';

// Textos da interface. Cada idioma é um JSON em locales/ com as MESMAS chaves
// (em inglês, agrupadas por tela: "home.play", "pause.resume"...). O
// português é o idioma de referência: chave que faltar em outro idioma cai
// no texto em português. O build confere as chaves (scripts/check-locales.mjs).
//
// Interpolação: "Nível {level}" + { level: 3 } → "Nível 3".
//
// Idioma ao abrir: ?lang= na URL → escolha salva no aparelho → idiomas do
// navegador → inglês (se existir) → português. Só entram idiomas prontos
// (config/languages.json).

export type { Lang };

type Messages = { [key: string]: string | Messages };

// Textos de cada idioma (o build confere que todo idioma de
// config/languages.json tem o seu locale)
const MESSAGES: Record<Lang, Messages> = { pt, en, es, fr };

const FALLBACK: Lang = DEFAULT_LANG;

/** Idiomas prontos, na ordem do seletor */
export const LANGUAGES = LANGUAGE_LIST.map(({ code, label }) => ({ code, label }));

const isLang = (value: string): value is Lang => value in LANGUAGE_CONFIGS;
const baseOf = (tag: string) => tag.toLowerCase().split(/[-_]/)[0];

/** Escolhe o idioma entre os disponíveis (função pura, testada em tests/logica). */
export function detectLanguage(
  { param, saved, browser }: { param?: string | null; saved?: string | null; browser?: readonly string[] },
  available: readonly string[] = Object.keys(LANGUAGE_CONFIGS),
): string {
  const pick = (tag?: string | null) => (tag && available.includes(baseOf(tag)) ? baseOf(tag) : null);
  return pick(param) ?? pick(saved) ?? (browser ?? []).map(pick).find(Boolean)
    ?? (available.includes('en') ? 'en' : FALLBACK);
}

const LANG_PARAM = 'lang';

function initialLanguage(): Lang {
  const url = new URL(window.location.href);
  const param = url.searchParams.get(LANG_PARAM);
  const lang = detectLanguage({ param, saved: load<string | null>(KEYS.lang, null), browser: navigator.languages });
  if (param !== null) {
    // Link de divulgação (?lang=en): vale como escolha e sai da URL
    if (isLang(baseOf(param))) save(KEYS.lang, lang);
    url.searchParams.delete(LANG_PARAM);
    window.history.replaceState(null, '', url.toString());
  }
  return isLang(lang) ? lang : FALLBACK;
}

// Idioma atual fora do React (métricas)
let currentLang: Lang = FALLBACK;
export const getLanguage = () => currentLang;

// Todas as chaves do pt.json no formato "grupo.chave" (o editor completa e
// acusa chave errada)
type Paths<T> = { [K in keyof T & string]: T[K] extends string ? K : `${K}.${Paths<T[K]>}` }[keyof T & string];
export type MessageKey = Paths<typeof pt>;

export type Vars = Record<string, string | number>;

function lookup(messages: Messages, key: string): string | undefined {
  let node: string | Messages | undefined = messages;
  for (const part of key.split('.')) {
    if (typeof node !== 'object') return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

export function translate(lang: Lang, key: MessageKey, vars?: Vars): string {
  const text = lookup(MESSAGES[lang], key) ?? lookup(MESSAGES[FALLBACK], key) ?? key;
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? formatValue(lang, vars[name]) : match));
}

/** Como translate, mas aceita elementos React nas variáveis (texto com destaque). */
export function translateRich(lang: Lang, key: MessageKey, vars: Record<string, ReactNode>): ReactNode {
  const text = translate(lang, key);
  return text.split(/(\{\w+\})/).map((part, i) => {
    const name = /^\{(\w+)\}$/.exec(part)?.[1];
    const value = name !== undefined && name in vars ? vars[name] : part;
    return <Fragment key={i}>{typeof value === 'number' ? formatValue(lang, value) : value}</Fragment>;
  });
}

function formatValue(lang: Lang, value: string | number): string {
  return typeof value === 'number' ? formatNumber(lang, value) : value;
}

export function formatNumber(lang: Lang, value: number): string {
  return value.toLocaleString(LANGUAGE_CONFIGS[lang].locale);
}

// ---------- React ----------

export interface I18n {
  lang: Lang;
  /** Troca o idioma e salva a escolha no aparelho */
  setLang: (lang: Lang) => void;
  locale: string;
  t: (key: MessageKey, vars?: Vars) => string;
  rich: (key: MessageKey, vars: Record<string, ReactNode>) => ReactNode;
  /** Número no formato do idioma (8.634 em PT, 8,634 em EN) */
  n: (value: number) => string;
}

function makeI18n(lang: Lang, setLang: (lang: Lang) => void = () => {}): I18n {
  return {
    lang,
    setLang,
    locale: LANGUAGE_CONFIGS[lang].locale,
    t: (key, vars) => translate(lang, key, vars),
    rich: (key, vars) => translateRich(lang, key, vars),
    n: value => formatNumber(lang, value),
  };
}

const I18nContext = createContext<I18n>(makeI18n(FALLBACK));

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLanguage);
  currentLang = lang;

  const setLang = useCallback((next: Lang) => {
    save(KEYS.lang, next);
    setLangState(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = LANGUAGE_CONFIGS[lang].locale;
    document.title = translate(lang, 'meta.title');
  }, [lang]);

  const value = useMemo(() => makeI18n(lang, setLang), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
